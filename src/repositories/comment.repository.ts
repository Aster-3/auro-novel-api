import { Repository } from "typeorm";
import { ICommentRepository } from "../interfaces/comment.repo.interface.js";
import { Comment } from "../entities/Comment.js";
import { CreateCommentDto } from "../schemas/create.comment.schema.js";
import { GetCommentsDto } from "../schemas/get.comments.schema.js";
import { Novel } from "../entities/_index.js";
import { ConflictError } from "../errors/conflict.error.js";

export class CommentRepository implements ICommentRepository {
  constructor(private commentRepo: Repository<Comment>) {}

  async create(comment: CreateCommentDto) {
    const hasCommentedBefore = await this.commentRepo.exists({
      where: {
        userId: comment.userId,
        novelId: comment.novelId,
      },
    });

    if (hasCommentedBefore)
      throw new ConflictError(
        "userId and novelId",
        "Bu seriye zaten bir inceleme bırakmışsınız",
      );

    return await this.commentRepo.manager.transaction(async (manager) => {
      await manager.increment(
        Novel,
        { id: comment.novelId },
        "totalReviewsCount",
        1,
      );

      if (comment.isRecommend) {
        await manager.increment(
          Novel,
          { id: comment.novelId },
          "positiveReviewsCount",
          1,
        );
      }

      return await manager.save(Comment, comment);
    });
  }

  async delete(id: number) {
    await this.commentRepo.delete(id);
  }

  async getTopCommentsOfLastWeek(): Promise<Comment[]> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return await this.commentRepo
      .createQueryBuilder("comment")
      .where("comment.createdAt >= :oneWeekAgo", { oneWeekAgo })
      .orderBy("comment.likeCount", "DESC")
      .take(10)
      .getMany();
  }

  async getCommentsByNovelId(dto: GetCommentsDto) {
    const { id, page, limit } = dto;

    const [comments, total] = await this.commentRepo.findAndCount({
      where: { novel: { id: id } },
      skip: (page - 1) * limit,
      select: {
        id: true,
        user: { id: true, nickname: true, profileImageUrl: true },
        content: true,
        isRecommend: true,
        createdAt: true,
        likeCount: true,
        replyCount: true,
      },
      relations: {
        user: true,
      },
      order: { createdAt: "DESC" },
      take: limit,
    });
    return {
      data: comments,
      count: total,
      currentPage: page,
      lastPage: Math.ceil(total / limit),
    };
  }
}
