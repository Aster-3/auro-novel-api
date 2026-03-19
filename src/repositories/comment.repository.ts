import { Repository } from "typeorm";
import { ICommentRepository } from "../interfaces/comment.repo.interface.js";
import { Comment } from "../entities/Comment.js";
import { CreateCommentDto } from "../schemas/create.comment.schema.js";
import { GetCommentsDto } from "../schemas/get.comments.schema.js";
import { Novel } from "../entities/_index.js";
import { ConflictError } from "../errors/conflict.error.js";
import { ne } from "@faker-js/faker";

export class CommentRepository implements ICommentRepository {
  constructor(private commentRepo: Repository<Comment>) {}

  async create(dto: CreateCommentDto) {
    const hasCommentedBefore = await this.commentRepo.exists({
      where: {
        userId: dto.userId,
        novelId: dto.novelId,
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
        { id: dto.novelId },
        "totalReviewsCount",
        1,
      );

      if (dto.isRecommend) {
        await manager.increment(
          Novel,
          { id: dto.novelId },
          "positiveReviewsCount",
          1,
        );
      }

      const newComment = manager.create(Comment, {
        ...dto,
        novelId: dto.novelId, // dto.novelId'den geldiğini belirttiniz
      });

      return await manager.save(Comment, newComment);
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

  getLast3CommentsByNovelId(novelId: string) {
    return this.commentRepo.find({
      where: { novel: { id: novelId } },
      order: { createdAt: "DESC" },
      take: 3,
      select: {
        id: true,
        user: { id: true, nickname: true, profileImageUrl: true },
        content: true,
        isRecommend: true,
        createdAt: true,
      },
      relations: {
        user: true,
      },
    });
  }
  async getCommentsByNovelId(dto: GetCommentsDto) {
    const { novelId, page, limit } = dto;

    const [comments, total] = await this.commentRepo.findAndCount({
      where: { novel: { id: novelId } },
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

    const totalPage = Math.ceil(total / limit);
    const nextPage = page < totalPage ? page + 1 : null;
    return {
      items: comments,
      total: total,
      currentPage: page,
      nextPage: nextPage,
      lastPage: totalPage,
    };
  }
}
