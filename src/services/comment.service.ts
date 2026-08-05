import { NotFoundError } from "../errors/not.found.error.js";
import { ICommentLikeRepository } from "../interfaces/comment.like.repo.interface.js";
import { ICommentRepository } from "../interfaces/comment.repo.interface.js";
import { ICommentService } from "../interfaces/comment.service.interface.js";
import { INovelRepository } from "../interfaces/novel.repo.interface.js";
import { IReplyRepository } from "../interfaces/reply.repo.interface.js";
import { IUnitOfWork } from "../interfaces/unit.of.work.interface.js";
import { CreateCommentDto } from "../schemas/create.comment.schema.js";
import { GetCommentRepliesDto } from "../schemas/get.comment.replies.schema.js";
import { GetCommentsDto } from "../schemas/get.comments.schema.js";
import { calculateRankingScore } from "../utils/calculateNovelRankingScore.js";
import {
  NotificationTargetType,
  PersonalNotificationType,
} from "../constants/notification.constants.js";
import { PushNotificationService } from "./push.notification.service.js";

const LIKE_NOTIFICATION_PUSH_THROTTLE_MS = 60 * 60 * 1000;

export class CommentService implements ICommentService {
  constructor(
    private uow: IUnitOfWork,
    private pushNotificationService: PushNotificationService,
  ) {}

  createComment = async (dto: CreateCommentDto) => {
    const novel = await this.uow.novelRepository.findOneById(
      dto.novelId,
      dto.userId,
    );
    if (!novel) {
      throw new NotFoundError("Novel not found");
    }

    await this.uow.startTransaction();

    try {
      const comment = await this.uow.commentRepository.create(dto);
      const novel =
        await this.uow.novelRepository.incrementAndDecrementReviewCount(
          dto.novelId,
          true,
          dto.isRecommend,
        );

      const newScore = calculateRankingScore(
        novel.positiveReviewsCount,
        novel.totalReviewsCount,
      );
      await this.uow.novelRepository.updateRankingScore(dto.novelId, newScore);

      await this.uow.commit();
      return comment;
    } catch (error) {
      await this.uow.rollback();
      throw error;
    } finally {
      await this.uow.release();
    }
  };

  deleteComment = async (id: number, userId: string) => {
    // 1. Yorumun varlığını ve sahipliğini kontrol et (Veriyi de çekmiş oluyoruz)
    const comment = await this.uow.commentRepository.isOwner(id, userId);

    if (!comment) {
      throw new NotFoundError(
        "Yorum bulunamadı veya bu işlemi yapmaya yetkiniz yok.",
      );
    }

    await this.uow.startTransaction();

    try {
      // 2. Yorumu sil
      await this.uow.commentRepository.delete(id);

      const updatedStats =
        await this.uow.novelRepository.incrementAndDecrementReviewCount(
          comment.novelId,
          false, // Azaltma işlemi
          comment.isRecommend, // Pozitif miydi?
        );

      // 4. Skoru yeniden hesapla ve güncelle
      const newScore = calculateRankingScore(
        updatedStats.positiveReviewsCount,
        updatedStats.totalReviewsCount,
      );
      await this.uow.novelRepository.updateRankingScore(
        comment.novelId,
        newScore,
      );

      await this.uow.commit();
    } catch (error) {
      await this.uow.rollback();
      throw error;
    } finally {
      await this.uow.release();
    }
  };

  getCommentsByNovelId = async (dto: GetCommentsDto, userId: string) => {
    const novel = await this.uow.novelRepository.findOneById(
      dto.novelId,
      userId,
    );
    if (!novel) {
      throw new NotFoundError("Novel not found");
    }

    return await this.uow.commentRepository.getCommentsByNovelId(dto, userId);
  };

  getTopCommentsOfLastWeek = async () => {
    return await this.uow.commentRepository.getTopCommentsOfLastWeek();
  };

  async getCommentReplies(dto: GetCommentRepliesDto) {
    if (dto.userId) {
      const commentMeta = await this.uow.commentRepository.getNotificationMetaById(
        dto.id,
      );
      if (!commentMeta) {
        throw new NotFoundError("Yorum bulunamadi.");
      }
      await this.ensureUsersCanInteract(dto.userId, commentMeta.userId);
    }

    return this.uow.replyRepository.getCommentReplies(dto);
  }

  async toggleLike(userId: string, commentId: number) {
    const commentMeta =
      await this.uow.commentRepository.getNotificationMetaById(commentId);

    if (!commentMeta) {
      throw new NotFoundError("Yorum bulunamadi.");
    }

    await this.ensureUsersCanInteract(userId, commentMeta.userId);

    const liked = await this.uow.commentLikeRepository.toggleLike(
      userId,
      commentId,
    );

    if (liked) {
      await this.notifyCommentOwnerForLike(userId, commentId);
    }

    return liked;
  }

  getLast3CommentsByNovelId(novelId: string, viewerId?: string) {
    return this.uow.novelRepository.findOneById(novelId, viewerId).then((novel) => {
      if (!novel) {
        throw new NotFoundError("Novel not found");
      }

      return this.uow.commentRepository.getLast3CommentsWithCount(
        novelId,
        viewerId,
      );
    });
  }

  async getMyComment(novelId: string, userId: string) {
    const novel = await this.uow.novelRepository.findOneById(novelId, userId);
    if (!novel) {
      throw new NotFoundError("Novel not found");
    }

    return this.uow.commentRepository.getMyComment(novelId, userId);
  }

  getOneCommentById(id: number, viewerId?: string) {
    return this.uow.commentRepository.getOneById(id, viewerId);
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

  private async notifyCommentOwnerForLike(userId: string, commentId: number) {
    try {
      const commentMeta =
        await this.uow.commentRepository.getNotificationMetaById(commentId);

      if (!commentMeta || commentMeta.userId === userId) {
        return;
      }

      const actor = await this.uow.userRepository.findOneById(userId);
      const actorName = actor?.nickname || "Bir kullanici";
      const pushBody = "Yorumun yeni bir begeni aldi.";
      const targetUrl = `https://auronovel.com/novels/${commentMeta.novelId}/comments/${commentMeta.id}`;

      const aggregation =
        await this.uow.personalNotificationRepository.createOrUpdateAggregatedNotification(
          {
            userId: commentMeta.userId,
            actorUserId: userId,
            type: PersonalNotificationType.COMMENT_LIKE,
            targetType: NotificationTargetType.COMMENT,
            targetId: String(commentMeta.id),
            targetUrl,
            aggregationKey: `${PersonalNotificationType.COMMENT_LIKE}:${commentMeta.id}`,
            data: {
              novelId: commentMeta.novelId,
              commentId: commentMeta.id,
            },
          },
          LIKE_NOTIFICATION_PUSH_THROTTLE_MS,
        );

      const titleSnapshot = this.formatCommentLikeTitle(
        actorName,
        aggregation.notification.actorCount,
      );
      await this.uow.personalNotificationRepository.updateNotificationSnapshots(
        aggregation.notification.id,
        titleSnapshot,
      );

      if (!aggregation.shouldSendPush) {
        return;
      }

      await this.pushNotificationService.sendToUser(commentMeta.userId, {
        title: titleSnapshot,
        body: pushBody,
        data: {
          notificationType: "personal_notification",
          type: PersonalNotificationType.COMMENT_LIKE,
          targetType: NotificationTargetType.COMMENT,
          targetId: String(commentMeta.id),
          targetUrl,
          novelId: commentMeta.novelId,
          commentId: commentMeta.id,
        },
      });
    } catch (error) {
      console.error("Yorum begeni bildirimi gonderilemedi:", error);
    }
  }

  private formatCommentLikeTitle(actorName: string, actorCount: number) {
    if (actorCount <= 1) {
      return `${actorName} yorumunu begendi`;
    }

    return `${actorName} ve ${actorCount - 1} kisi yorumunu begendi`;
  }
}
