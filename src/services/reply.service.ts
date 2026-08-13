import { IReplyRepository } from "../interfaces/reply.repo.interface.js";
import {
  CreateReplyWithUserDto,
  IReplyService,
} from "../interfaces/reply.service.interface.js";
import { IReplyLikeRepository } from "../interfaces/reply.like.repo.interface.js";
import { DeleteReplySchema } from "../schemas/delete.reply.schema.js";
import { ICommentRepository } from "../interfaces/comment.repo.interface.js";
import { IUserRepository } from "../interfaces/user.repo.interface.js";
import { IUserBlockRepository } from "../interfaces/user.block.repo.interface.js";
import { IPersonalNotificationRepository } from "../interfaces/personal.notification.repo.interface.js";
import {
  NotificationTargetType,
  PersonalNotificationType,
} from "../constants/notification.constants.js";
import { PushNotificationService } from "./push.notification.service.js";
import { NotFoundError } from "../errors/not.found.error.js";
import { runDelayedNotification } from "../utils/delayed.notification.js";

const LIKE_NOTIFICATION_PUSH_THROTTLE_MS = 60 * 60 * 1000;

export class ReplyService implements IReplyService {
  constructor(
    private replyRepo: IReplyRepository,
    private replyLikeRepo: IReplyLikeRepository,
    private commentRepo: ICommentRepository,
    private userRepo: IUserRepository,
    private userBlockRepo: IUserBlockRepository,
    private personalNotificationRepo: IPersonalNotificationRepository,
    private pushNotificationService: PushNotificationService,
  ) {}

  createReply = async (reply: CreateReplyWithUserDto) => {
    await this.ensureReplyTargetVisible(reply);
    const createdReply = await this.replyRepo.create(reply);
    if (reply.parentReplyId) {
      await this.notifyParentReplyOwner(reply, createdReply.id);
    } else {
      await this.notifyRootCommentOwner(reply, createdReply.id);
    }
    return createdReply;
  };

  deleteReply = async (dto: DeleteReplySchema) => {
    const isOwner = await this.replyRepo.isOwner(dto.replyId, dto.userId!);
    if (!isOwner) {
      throw new Error("Bu yorumun sahibi değilsiniz.");
    }
    await this.replyRepo.delete(dto.replyId);
  };

  toggleLike = async (userId: string, replyId: number) => {
    const replyMeta = await this.replyRepo.getNotificationMetaById(replyId);
    if (!replyMeta || replyMeta.deletedAt) {
      throw new NotFoundError("Yanit bulunamadi.");
    }
    await this.ensureUsersCanInteract(userId, replyMeta.userId);

    const liked = await this.replyLikeRepo.toggleLike(userId, replyId);

    if (replyMeta.userId === userId) {
      return liked;
    }

    if (liked) {
      this.scheduleReplyLikeNotification(userId, replyId);
    } else {
      await this.syncReplyLikeNotification(userId, replyId, false);
    }

    return liked;
  };

  private async ensureReplyTargetVisible(reply: CreateReplyWithUserDto) {
    const targetUserId = reply.parentReplyId
      ? (await this.replyRepo.getNotificationMetaById(reply.parentReplyId))
          ?.userId
      : (await this.commentRepo.getNotificationMetaById(reply.rootCommentId))
          ?.userId;

    if (!targetUserId) {
      throw new NotFoundError("Yanitlanacak icerik bulunamadi.");
    }

    await this.ensureUsersCanInteract(reply.userId, targetUserId);
  }

  private async ensureUsersCanInteract(userId: string, targetUserId: string) {
    if (userId === targetUserId) return;

    const blocked = await this.userBlockRepo.existsBetween(userId, targetUserId);
    if (blocked) {
      throw new NotFoundError("Yanitlanacak icerik bulunamadi.");
    }
  }

  private async notifyRootCommentOwner(
    reply: CreateReplyWithUserDto,
    replyId: number,
  ) {
    try {
      const commentMeta = await this.commentRepo.getNotificationMetaById(
        reply.rootCommentId,
      );

      if (!commentMeta || commentMeta.userId === reply.userId) {
        return;
      }

      const actor = await this.userRepo.findOneById(reply.userId);
      const actorName = actor?.nickname || "Bir kullanici";
      const titleSnapshot = `${actorName} yorumuna yanit verdi`;
      const pushBody = reply.content;

      await this.personalNotificationRepo.createNotification({
        userId: commentMeta.userId,
        actorUserId: reply.userId,
        type: PersonalNotificationType.COMMENT_REPLY,
        targetType: NotificationTargetType.COMMENT,
        targetId: String(commentMeta.id),
        titleSnapshot,
        data: {
          novelId: commentMeta.novelId,
          commentId: commentMeta.id,
          replyId,
        },
      });

      await this.pushNotificationService.sendToUser(commentMeta.userId, {
        title: titleSnapshot,
        body: pushBody,
        data: {
          notificationType: "personal_notification",
          type: PersonalNotificationType.COMMENT_REPLY,
          targetType: NotificationTargetType.COMMENT,
          targetId: String(commentMeta.id),
          novelId: commentMeta.novelId,
          commentId: commentMeta.id,
          replyId,
        },
      });
    } catch (error) {
      console.error("Yanit bildirimi gonderilemedi:", error);
    }
  }

  private async notifyParentReplyOwner(
    reply: CreateReplyWithUserDto,
    replyId: number,
  ) {
    try {
      if (!reply.parentReplyId) {
        return;
      }

      const [commentMeta, parentReplyMeta] = await Promise.all([
        this.commentRepo.getNotificationMetaById(reply.rootCommentId),
        this.replyRepo.getNotificationMetaById(reply.parentReplyId),
      ]);

      if (
        !commentMeta ||
        !parentReplyMeta ||
        parentReplyMeta.userId === reply.userId
      ) {
        return;
      }

      const actor = await this.userRepo.findOneById(reply.userId);
      const actorName = actor?.nickname || "Bir kullanici";
      const titleSnapshot = `${actorName} yanitina yanit verdi`;
      const pushBody = reply.content;

      await this.personalNotificationRepo.createNotification({
        userId: parentReplyMeta.userId,
        actorUserId: reply.userId,
        type: PersonalNotificationType.REPLY_REPLY,
        targetType: NotificationTargetType.REPLY,
        targetId: String(parentReplyMeta.id),
        titleSnapshot,
        data: {
          novelId: commentMeta.novelId,
          commentId: commentMeta.id,
          parentReplyId: parentReplyMeta.id,
          replyId,
        },
      });

      await this.pushNotificationService.sendToUser(parentReplyMeta.userId, {
        title: titleSnapshot,
        body: pushBody,
        data: {
          notificationType: "personal_notification",
          type: PersonalNotificationType.REPLY_REPLY,
          targetType: NotificationTargetType.REPLY,
          targetId: String(parentReplyMeta.id),
          novelId: commentMeta.novelId,
          commentId: commentMeta.id,
          parentReplyId: parentReplyMeta.id,
          replyId,
        },
      });
    } catch (error) {
      console.error("Reply yanit bildirimi gonderilemedi:", error);
    }
  }

  private async syncReplyLikeNotification(
    userId: string,
    replyId: number,
    allowPush: boolean,
  ) {
    try {
      const replyMeta = await this.replyRepo.getNotificationMetaById(replyId);

      if (!replyMeta) {
        return;
      }

      const commentMeta = await this.commentRepo.getNotificationMetaById(
        replyMeta.rootCommentId,
      );

      if (!commentMeta) {
        return;
      }

      const aggregationKey = `${PersonalNotificationType.REPLY_LIKE}:${replyMeta.id}`;
      const likeSummary = await this.replyLikeRepo.getLikeSummary(
        replyId,
        userId,
        replyMeta.userId,
      );

      if (!likeSummary.actorCount || !likeSummary.actorUserId) {
        await this.personalNotificationRepo.softDeleteAggregatedNotification(
          replyMeta.userId,
          aggregationKey,
        );
        return;
      }

      const actor = await this.userRepo.findOneById(likeSummary.actorUserId);
      const actorName = actor?.nickname || "Bir kullanici";
      const pushBody = "Yanitin yeni bir begeni aldi.";
      const targetUrl = `https://auronovel.com/novels/${commentMeta.novelId}/comments/${commentMeta.id}/replies/${replyMeta.id}`;
      const titleSnapshot = this.formatReplyLikeTitle(
        actorName,
        likeSummary.actorCount,
      );

      const aggregation =
        await this.personalNotificationRepo.syncAggregatedNotification(
          {
            userId: replyMeta.userId,
            actorUserId: likeSummary.actorUserId,
            type: PersonalNotificationType.REPLY_LIKE,
            targetType: NotificationTargetType.REPLY,
            targetId: String(replyMeta.id),
            targetUrl,
            aggregationKey,
            actorCount: likeSummary.actorCount,
            titleSnapshot,
            data: {
              novelId: commentMeta.novelId,
              commentId: commentMeta.id,
              replyId: replyMeta.id,
            },
          },
          LIKE_NOTIFICATION_PUSH_THROTTLE_MS,
          { allowPush, createIfMissing: allowPush },
        );

      if (!aggregation?.shouldSendPush) {
        return;
      }

      await this.pushNotificationService.sendToUser(replyMeta.userId, {
        title: titleSnapshot,
        body: pushBody,
        data: {
          notificationType: "personal_notification",
          type: PersonalNotificationType.REPLY_LIKE,
          targetType: NotificationTargetType.REPLY,
          targetId: String(replyMeta.id),
          targetUrl,
          novelId: commentMeta.novelId,
          commentId: commentMeta.id,
          replyId: replyMeta.id,
        },
      });
    } catch (error) {
      console.error("Reply begeni bildirimi guncellenemedi:", error);
    }
  }

  private scheduleReplyLikeNotification(userId: string, replyId: number) {
    runDelayedNotification(async () => {
      const stillLiked = await this.replyLikeRepo.isLiked(userId, replyId);

      if (!stillLiked) {
        return;
      }

      await this.syncReplyLikeNotification(userId, replyId, true);
    });
  }

  private formatReplyLikeTitle(actorName: string, actorCount: number) {
    if (actorCount <= 1) {
      return `${actorName} yanitini begendi`;
    }

    return `${actorName} ve ${actorCount - 1} kisi yanitini begendi`;
  }
}
