import { Repository } from "typeorm";
import { ChapterComment } from "../entities/ChapterComment.js";
import { ChapterCommentLike } from "../entities/ChapterCommentLike.js";
import { IChapterCommentLikeRepository } from "../interfaces/chapter.comment.like.repo.interface.js";

export class ChapterCommentLikeRepository
  implements IChapterCommentLikeRepository
{
  constructor(private likeRepo: Repository<ChapterCommentLike>) {}

  async toggleLike(userId: string, commentId: number) {
    return await this.likeRepo.manager.transaction(async (manager) => {
      const existingLike = await manager.findOne(ChapterCommentLike, {
        where: { userId, commentId },
      });

      if (existingLike) {
        await manager.remove(ChapterCommentLike, existingLike);
        await manager.decrement(ChapterComment, { id: commentId }, "likeCount", 1);
        return false;
      }

      const newLike = manager.create(ChapterCommentLike, {
        userId,
        commentId,
      });

      await manager.save(ChapterCommentLike, newLike);
      await manager.increment(ChapterComment, { id: commentId }, "likeCount", 1);
      return true;
    });
  }
}
