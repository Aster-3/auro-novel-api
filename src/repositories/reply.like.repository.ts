import { Repository } from "typeorm";
import { ReplyLike } from "../entities/ReplyLike.js";
import { IReplyLikeRepository } from "../interfaces/reply.like.repo.interface.js";
import { Reply } from "../entities/Reply.js";

export class ReplyLikeRepository implements IReplyLikeRepository {
  constructor(private replyLikeRepo: Repository<ReplyLike>) {}

  async toggleLike(userId: string, replyId: number) {
    return await this.replyLikeRepo.manager.transaction(async (manager) => {
      const existingLike = await manager.findOne(ReplyLike, {
        where: { user: { id: userId }, reply: { id: replyId } },
      });
      if (existingLike) {
        await manager.remove(existingLike);
        await manager.decrement(Reply, { id: replyId }, "likeCount", 1);
        return false;
      } else {
        const newLike = manager.create(ReplyLike, {
          user: { id: userId },
          reply: { id: replyId },
        });
        await manager.save(newLike);
        await manager.increment(Reply, { id: replyId }, "likeCount", 1);
        return true;
      }
    });
  }
}
