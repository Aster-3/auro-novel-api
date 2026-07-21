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

export class CommentService implements ICommentService {
  constructor(
    private uow: IUnitOfWork,
    private pushNotificationService: PushNotificationService,
  ) {}

  createComment = async (dto: CreateCommentDto) => {
    const novel = await this.uow.novelRepository.findOneById(dto.novelId);
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
    const novel = await this.uow.novelRepository.findOneById(dto.novelId);
    if (!novel) {
      throw new NotFoundError("Novel not found");
    }

    return await this.uow.commentRepository.getCommentsByNovelId(dto, userId);
  };

  getTopCommentsOfLastWeek = async () => {
    return await this.uow.commentRepository.getTopCommentsOfLastWeek();
  };

  getCommentReplies(dto: GetCommentRepliesDto) {
    return this.uow.replyRepository.getCommentReplies(dto);
  }

  async toggleLike(userId: string, commentId: number) {
    const liked = await this.uow.commentLikeRepository.toggleLike(
      userId,
      commentId,
    );

    if (liked) {
      await this.notifyCommentOwnerForLike(userId, commentId);
    }

    return liked;
  }

  getLast3CommentsByNovelId(novelId: string) {
    return this.uow.novelRepository.findOneById(novelId).then((novel) => {
      if (!novel) {
        throw new NotFoundError("Novel not found");
      }

      return this.uow.commentRepository.getLast3CommentsWithCount(novelId);
    });
  }

  async getMyComment(novelId: string, userId: string) {
    const novel = await this.uow.novelRepository.findOneById(novelId);
    if (!novel) {
      throw new NotFoundError("Novel not found");
    }

    return this.uow.commentRepository.getMyComment(novelId, userId);
  }

  getOneCommentById(id: number) {
    return this.uow.commentRepository.getOneById(id);
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
      const titleSnapshot = `${actorName} yorumunu begendi`;
      const bodySnapshot = "Yorumun yeni bir begeni aldi.";

      await this.uow.personalNotificationRepository.createNotification({
        userId: commentMeta.userId,
        actorUserId: userId,
        type: PersonalNotificationType.COMMENT_LIKE,
        targetType: NotificationTargetType.COMMENT,
        targetId: String(commentMeta.id),
        titleSnapshot,
        bodySnapshot,
        data: {
          novelId: commentMeta.novelId,
          commentId: commentMeta.id,
        },
      });

      await this.pushNotificationService.sendToUser(commentMeta.userId, {
        title: titleSnapshot,
        body: bodySnapshot,
        data: {
          notificationType: "personal_notification",
          type: PersonalNotificationType.COMMENT_LIKE,
          targetType: NotificationTargetType.COMMENT,
          targetId: String(commentMeta.id),
          novelId: commentMeta.novelId,
          commentId: commentMeta.id,
        },
      });
    } catch (error) {
      console.error("Yorum begeni bildirimi gonderilemedi:", error);
    }
  }
}
