import { BadRequestError } from "../errors/bad.request.js";
import { ForbiddenError } from "../errors/forbidden.error.js";
import { NotFoundError } from "../errors/not.found.error.js";
import { IChapterCommentService } from "../interfaces/chapter.comment.service.interface.js";
import { IUnitOfWork } from "../interfaces/unit.of.work.interface.js";
import {
  CreateChapterCommentDto,
  CreateChapterCommentReplyDto,
} from "../schemas/create.chapter.comment.schema.js";
import { GetChapterCommentsDto } from "../schemas/get.chapter.comments.schema.js";
import {
  NotificationTargetType,
  PersonalNotificationType,
} from "../constants/notification.constants.js";
import { runDelayedNotification } from "../utils/delayed.notification.js";
import { PushNotificationService } from "./push.notification.service.js";
import { deleteManyFromS3ByUrl } from "./s3.service.js";

const LIKE_NOTIFICATION_PUSH_THROTTLE_MS = 60 * 60 * 1000;

export class ChapterCommentService implements IChapterCommentService {
  constructor(
    private uow: IUnitOfWork,
    private pushNotificationService: PushNotificationService,
  ) {}

  async createComment(
    dto: CreateChapterCommentDto & {
      userId: string;
      imageUrl?: string | null;
      imageWidth?: number | null;
      imageHeight?: number | null;
    },
  ) {
    this.ensureCommentHasContentOrImage(dto.content, dto.imageUrl);

    const chapter = await this.uow.chapterPublicationRepository.getChapterForReading(
      dto.chapterId,
    );

    if (!chapter) {
      throw new NotFoundError("Bolum bulunamadi.");
    }

    const novel = await this.uow.novelRepository.findOneById(
      chapter.novelId,
      dto.userId,
    );
    if (!novel) {
      throw new NotFoundError("Bolum bulunamadi.");
    }

    return await this.uow.chapterCommentRepository.createRoot({
      ...dto,
      novelId: chapter.novelId,
    });
  }

  async createReply(
    dto: CreateChapterCommentReplyDto & {
      rootCommentId: number;
      userId: string;
      imageUrl?: string | null;
      imageWidth?: number | null;
      imageHeight?: number | null;
    },
  ) {
    this.ensureCommentHasContentOrImage(dto.content, dto.imageUrl);

    const rootComment = await this.uow.chapterCommentRepository.getMetaById(
      dto.rootCommentId,
    );

    if (!rootComment || rootComment.deletedAt) {
      throw new NotFoundError("Ana yorum bulunamadi.");
    }

    await this.ensureUsersCanInteract(dto.userId, rootComment.userId);

    if (rootComment.rootCommentId) {
      throw new BadRequestError("Yaniti sadece ana yorum altinda olusturabilirsiniz.");
    }

    const parentCommentId = dto.parentCommentId ?? dto.rootCommentId;
    const parentComment = await this.uow.chapterCommentRepository.getMetaById(
      parentCommentId,
    );

    if (!parentComment || parentComment.deletedAt) {
      throw new NotFoundError("Parent yorum bulunamadi.");
    }

    await this.ensureUsersCanInteract(dto.userId, parentComment.userId);

    const parentRootId = parentComment.rootCommentId ?? parentComment.id;
    if (
      parentRootId !== rootComment.id ||
      parentComment.chapterId !== rootComment.chapterId
    ) {
      throw new BadRequestError("Parent yorum bu yorum zincirine ait degil.");
    }

    const createdReply = await this.uow.chapterCommentRepository.createReply({
      ...dto,
      chapterId: rootComment.chapterId,
      novelId: rootComment.novelId,
      rootCommentId: rootComment.id,
      parentCommentId,
    });

    await this.notifyChapterCommentReplyOwner(
      dto.userId,
      createdReply.id,
      rootComment,
      parentComment,
    );

    return createdReply;
  }

  async deleteComment(commentId: number, userId: string) {
    const isOwner = await this.uow.chapterCommentRepository.isOwner(
      commentId,
      userId,
    );

    if (!isOwner) {
      throw new ForbiddenError("Bu yorumu silmeye yetkiniz yok.");
    }

    const deletedImageUrls = await this.uow.chapterCommentRepository.delete(
      commentId,
    );
    await deleteManyFromS3ByUrl(deletedImageUrls);
  }

  async getCommentsByChapterId(dto: GetChapterCommentsDto, userId?: string) {
    if (!dto.chapterId) {
      throw new BadRequestError("Chapter id zorunludur.");
    }

    const chapter = await this.uow.chapterPublicationRepository.getChapterForReading(
      dto.chapterId,
    );

    if (!chapter) {
      throw new NotFoundError("Bolum bulunamadi.");
    }

    return await this.uow.chapterCommentRepository.getRootComments(dto, userId);
  }

  async getRepliesByCommentId(
    dto: GetChapterCommentsDto & { rootCommentId: number },
    userId?: string,
  ) {
    const rootComment = await this.uow.chapterCommentRepository.getMetaById(
      dto.rootCommentId,
    );

    if (!rootComment) {
      throw new NotFoundError("Ana yorum bulunamadi.");
    }

    if (rootComment.rootCommentId) {
      throw new BadRequestError("Reply listesi icin ana yorum id kullanilmalidir.");
    }

    return await this.uow.chapterCommentRepository.getReplies(dto, userId);
  }

  async getOneCommentById(id: number, userId?: string) {
    return await this.uow.chapterCommentRepository.getOneById(id, userId);
  }

  async toggleLike(userId: string, commentId: number) {
    const comment = await this.uow.chapterCommentRepository.getMetaById(commentId);

    if (!comment || comment.deletedAt) {
      throw new NotFoundError("Yorum bulunamadi.");
    }

    await this.ensureUsersCanInteract(userId, comment.userId);

    const liked = await this.uow.chapterCommentLikeRepository.toggleLike(
      userId,
      commentId,
    );

    if (comment.userId === userId) {
      return liked;
    }

    if (liked) {
      this.scheduleChapterCommentLikeNotification(userId, commentId);
    } else {
      await this.syncChapterCommentLikeNotification(userId, commentId, false);
    }

    return liked;
  }

  private async ensureUsersCanInteract(userId: string, targetUserId: string) {
    if (userId === targetUserId) return;

    const blocked = await this.uow.userBlockRepository.existsBetween(
      userId,
      targetUserId,
    );

    if (blocked) {
      throw new NotFoundError("Yorum bulunamadi.");
    }
  }

  private ensureCommentHasContentOrImage(content: string, imageUrl?: string | null) {
    if (!content.trim() && !imageUrl) {
      throw new BadRequestError("Yorum veya gorsel zorunludur.");
    }
  }

  private async notifyChapterCommentReplyOwner(
    actorUserId: string,
    replyId: number,
    rootComment: NonNullable<
      Awaited<ReturnType<IUnitOfWork["chapterCommentRepository"]["getMetaById"]>>
    >,
    parentComment: NonNullable<
      Awaited<ReturnType<IUnitOfWork["chapterCommentRepository"]["getMetaById"]>>
    >,
  ) {
    try {
      if (parentComment.userId === actorUserId) {
        return;
      }

      const actor = await this.uow.userRepository.findOneById(actorUserId);
      const actorName = actor?.nickname || "Bir kullanici";
      const isRootReply = parentComment.id === rootComment.id;
      const titleSnapshot = isRootReply
        ? `${actorName} bolum yorumuna yanit verdi`
        : `${actorName} yanitina yanit verdi`;
      const pushBody = "Bolum yorumunda yeni bir yanit var.";
      const targetUrl = this.getChapterCommentTargetUrl(
        rootComment.novelId,
        rootComment.chapterId,
        rootComment.id,
        replyId,
      );

      await this.uow.personalNotificationRepository.createNotification({
        userId: parentComment.userId,
        actorUserId,
        type: PersonalNotificationType.CHAPTER_COMMENT_REPLY,
        targetType: NotificationTargetType.CHAPTER_COMMENT,
        targetId: String(parentComment.id),
        targetUrl,
        titleSnapshot,
        data: {
          novelId: rootComment.novelId,
          chapterId: rootComment.chapterId,
          rootCommentId: rootComment.id,
          parentCommentId: parentComment.id,
          replyId,
        },
      });

      await this.pushNotificationService.sendToUser(parentComment.userId, {
        title: titleSnapshot,
        body: pushBody,
        data: {
          notificationType: "personal_notification",
          type: PersonalNotificationType.CHAPTER_COMMENT_REPLY,
          targetType: NotificationTargetType.CHAPTER_COMMENT,
          targetId: String(parentComment.id),
          targetUrl,
          novelId: rootComment.novelId,
          chapterId: rootComment.chapterId,
          rootCommentId: rootComment.id,
          parentCommentId: parentComment.id,
          replyId,
        },
      });
    } catch (error) {
      console.error("Bolum yorum yanit bildirimi gonderilemedi:", error);
    }
  }

  private scheduleChapterCommentLikeNotification(
    userId: string,
    commentId: number,
  ) {
    runDelayedNotification(async () => {
      const stillLiked = await this.uow.chapterCommentLikeRepository.isLiked(
        userId,
        commentId,
      );

      if (!stillLiked) {
        return;
      }

      await this.syncChapterCommentLikeNotification(userId, commentId, true);
    });
  }

  private async syncChapterCommentLikeNotification(
    userId: string,
    commentId: number,
    allowPush: boolean,
  ) {
    try {
      const commentMeta = await this.uow.chapterCommentRepository.getMetaById(
        commentId,
      );

      if (!commentMeta || commentMeta.deletedAt) {
        return;
      }

      const aggregationKey = `${PersonalNotificationType.CHAPTER_COMMENT_LIKE}:${commentMeta.id}`;
      const likeSummary =
        await this.uow.chapterCommentLikeRepository.getLikeSummary(
          commentId,
          userId,
          commentMeta.userId,
        );

      if (!likeSummary.actorCount || !likeSummary.actorUserId) {
        await this.uow.personalNotificationRepository.softDeleteAggregatedNotification(
          commentMeta.userId,
          aggregationKey,
        );
        return;
      }

      const actor = await this.uow.userRepository.findOneById(
        likeSummary.actorUserId,
      );
      const actorName = actor?.nickname || "Bir kullanici";
      const pushBody = "Bolum yorumun yeni bir begeni aldi.";
      const rootCommentId = commentMeta.rootCommentId ?? commentMeta.id;
      const targetUrl = this.getChapterCommentTargetUrl(
        commentMeta.novelId,
        commentMeta.chapterId,
        rootCommentId,
        commentMeta.id,
      );
      const titleSnapshot = this.formatChapterCommentLikeTitle(
        actorName,
        likeSummary.actorCount,
      );

      const aggregation =
        await this.uow.personalNotificationRepository.syncAggregatedNotification(
          {
            userId: commentMeta.userId,
            actorUserId: likeSummary.actorUserId,
            type: PersonalNotificationType.CHAPTER_COMMENT_LIKE,
            targetType: NotificationTargetType.CHAPTER_COMMENT,
            targetId: String(commentMeta.id),
            targetUrl,
            aggregationKey,
            actorCount: likeSummary.actorCount,
            titleSnapshot,
            data: {
              novelId: commentMeta.novelId,
              chapterId: commentMeta.chapterId,
              rootCommentId,
              commentId: commentMeta.id,
            },
          },
          LIKE_NOTIFICATION_PUSH_THROTTLE_MS,
          { allowPush, createIfMissing: allowPush },
        );

      if (!aggregation?.shouldSendPush) {
        return;
      }

      await this.pushNotificationService.sendToUser(commentMeta.userId, {
        title: titleSnapshot,
        body: pushBody,
        data: {
          notificationType: "personal_notification",
          type: PersonalNotificationType.CHAPTER_COMMENT_LIKE,
          targetType: NotificationTargetType.CHAPTER_COMMENT,
          targetId: String(commentMeta.id),
          targetUrl,
          novelId: commentMeta.novelId,
          chapterId: commentMeta.chapterId,
          rootCommentId,
          commentId: commentMeta.id,
        },
      });
    } catch (error) {
      console.error("Bolum yorum begeni bildirimi guncellenemedi:", error);
    }
  }

  private formatChapterCommentLikeTitle(actorName: string, actorCount: number) {
    if (actorCount <= 1) {
      return `${actorName} bolum yorumunu begendi`;
    }

    return `${actorName} ve ${actorCount - 1} kisi bolum yorumunu begendi`;
  }

  private getChapterCommentTargetUrl(
    novelId: string,
    chapterId: string,
    rootCommentId: number,
    commentId: number,
  ) {
    return `https://auronovel.com/novels/${novelId}/chapters/${chapterId}/comments/${rootCommentId}/replies/${commentId}`;
  }
}
