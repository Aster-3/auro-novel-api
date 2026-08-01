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

    if (liked) {
      await this.notifyReplyOwnerForLike(userId, replyId);
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
      const bodySnapshot = reply.content;

      await this.personalNotificationRepo.createNotification({
        userId: commentMeta.userId,
        actorUserId: reply.userId,
        type: PersonalNotificationType.COMMENT_REPLY,
        targetType: NotificationTargetType.COMMENT,
        targetId: String(commentMeta.id),
        titleSnapshot,
        bodySnapshot,
        data: {
          novelId: commentMeta.novelId,
          commentId: commentMeta.id,
          replyId,
        },
      });

      await this.pushNotificationService.sendToUser(commentMeta.userId, {
        title: titleSnapshot,
        body: bodySnapshot,
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
      const bodySnapshot = reply.content;

      await this.personalNotificationRepo.createNotification({
        userId: parentReplyMeta.userId,
        actorUserId: reply.userId,
        type: PersonalNotificationType.REPLY_REPLY,
        targetType: NotificationTargetType.REPLY,
        targetId: String(parentReplyMeta.id),
        titleSnapshot,
        bodySnapshot,
        data: {
          novelId: commentMeta.novelId,
          commentId: commentMeta.id,
          parentReplyId: parentReplyMeta.id,
          replyId,
        },
      });

      await this.pushNotificationService.sendToUser(parentReplyMeta.userId, {
        title: titleSnapshot,
        body: bodySnapshot,
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

  private async notifyReplyOwnerForLike(userId: string, replyId: number) {
    try {
      const replyMeta = await this.replyRepo.getNotificationMetaById(replyId);

      if (!replyMeta || replyMeta.userId === userId) {
        return;
      }

      const commentMeta = await this.commentRepo.getNotificationMetaById(
        replyMeta.rootCommentId,
      );

      if (!commentMeta) {
        return;
      }

      const actor = await this.userRepo.findOneById(userId);
      const actorName = actor?.nickname || "Bir kullanici";
      const titleSnapshot = `${actorName} yanitini begendi`;
      const bodySnapshot = "Yanitin yeni bir begeni aldi.";

      await this.personalNotificationRepo.createNotification({
        userId: replyMeta.userId,
        actorUserId: userId,
        type: PersonalNotificationType.REPLY_LIKE,
        targetType: NotificationTargetType.REPLY,
        targetId: String(replyMeta.id),
        titleSnapshot,
        bodySnapshot,
        data: {
          novelId: commentMeta.novelId,
          commentId: commentMeta.id,
          replyId: replyMeta.id,
        },
      });

      await this.pushNotificationService.sendToUser(replyMeta.userId, {
        title: titleSnapshot,
        body: bodySnapshot,
        data: {
          notificationType: "personal_notification",
          type: PersonalNotificationType.REPLY_LIKE,
          targetType: NotificationTargetType.REPLY,
          targetId: String(replyMeta.id),
          novelId: commentMeta.novelId,
          commentId: commentMeta.id,
          replyId: replyMeta.id,
        },
      });
    } catch (error) {
      console.error("Reply begeni bildirimi gonderilemedi:", error);
    }
  }
}
