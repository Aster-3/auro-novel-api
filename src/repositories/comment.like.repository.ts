import { Not, Repository } from "typeorm";
import { CommentLike } from "../entities/CommentLike.js";
import { ICommentLikeRepository } from "../interfaces/comment.like.repo.interface.js";
import { Comment } from "../entities/Comment.js";

export class CommentLikeRepository implements ICommentLikeRepository {
  constructor(private commentLikeRepo: Repository<CommentLike>) {}

  async toggleLike(userId: string, commentId: number) {
    return await this.commentLikeRepo.manager.transaction(async (manager) => {
      const existingLike = await manager.findOne(CommentLike, {
        where: { user: { id: userId }, comment: { id: commentId } },
      });
      if (existingLike) {
        await manager.remove(existingLike);
        await manager.decrement(Comment, { id: commentId }, "likeCount", 1);
        return false;
      } else {
        const newLike = manager.create(CommentLike, {
          user: { id: userId },
          comment: { id: commentId },
        });
        await manager.save(newLike);
        await manager.increment(Comment, { id: commentId }, "likeCount", 1);
        return true;
      }
    });
  }

  async isLiked(userId: string, commentId: number) {
    return await this.commentLikeRepo.exists({
      where: { userId, commentId },
    });
  }

  async getLikeSummary(
    commentId: number,
    preferredActorUserId?: string,
    excludedUserId?: string,
  ) {
    const where = excludedUserId
      ? { commentId, userId: Not(excludedUserId) }
      : { commentId };
    const [actorCount, preferredLike, fallbackLike] = await Promise.all([
      this.commentLikeRepo.count({ where }),
      preferredActorUserId && preferredActorUserId !== excludedUserId
        ? this.commentLikeRepo.findOne({
            where: { commentId, userId: preferredActorUserId },
            select: { userId: true, commentId: true },
          })
        : Promise.resolve(null),
      this.commentLikeRepo.findOne({
        where,
        select: { userId: true, commentId: true },
      }),
    ]);

    return {
      actorCount,
      actorUserId: preferredLike?.userId ?? fallbackLike?.userId ?? null,
    };
  }
}
