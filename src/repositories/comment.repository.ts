import { IsNull, Repository } from "typeorm";
import { ICommentRepository } from "../interfaces/comment.repo.interface.js";
import { Comment } from "../entities/Comment.js";
import { CreateCommentDto } from "../schemas/create.comment.schema.js";
import { CreateReplyDto } from "../schemas/create.reply.schema.js";

export class CommentRepository implements ICommentRepository {
  constructor(private commentRepo: Repository<Comment>) {}

  async create(comment: CreateCommentDto | CreateReplyDto) {
    return this.commentRepo.save(comment);
  }

  async delete(id: number) {
    await this.commentRepo.delete(id);
  }

  async getRecommendationRate(novelId: number) {
    const result = await this.commentRepo
      .createQueryBuilder("comment")
      .select("AVG(comment.isRecommend::int::float)", "avg")
      .addSelect("COUNT(comment.id)", "count") // Kaç kişi oyladı?
      .where("comment.novelId = :novelId", { novelId })
      .andWhere("comment.isRecommend IS NOT NULL")
      .getRawOne();

    const count = parseInt(result.count) || 0;
    const rate = count > 0 ? Math.round(parseFloat(result.avg) * 100) : 0;

    return { rate, count };
  }

  async searchComments(query: { page: number; limit: number }) {
    const [comments, total] = await this.commentRepo.findAndCount({
      skip: (query.page - 1) * query.limit,
      select: {
        id: true,
        user: { nickname: true },
        content: true,
        isRecommend: true,
        rootCommentId: true,
        parentCommentId: true,
        replyCount: true,
        createdAt: true,
      },
      take: query.limit,
      order: { createdAt: "DESC" },
      relations: { user: true },
    });
    return {
      data: comments,
      count: total,
      currentPage: Number(query.page),
      lastPage: Math.ceil(total / query.limit),
    };
  }

  async getCommentsByNovelId(query: {
    novelId: string;
    page: number;
    limit: number;
  }) {
    const [comments, total] = await this.commentRepo.findAndCount({
      where: { novel: { id: query.novelId }, parentComment: IsNull() },
      skip: (query.page - 1) * query.limit,
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
      take: query.limit,
    });
    return {
      data: comments,
      count: total,
      currentPage: query.page,
      lastPage: Math.ceil(total / query.limit),
    };
  }

  getCommentReplies = async (query: {
    page: number;
    limit: number;
    commentId: number;
  }) => {
    const [replies, total] = await this.commentRepo.findAndCount({
      where: { rootComment: { id: query.commentId } },
      relations: {
        user: true,
        parentComment: { user: true },
      },
      select: {
        id: true,
        content: true,
        likeCount: true,
        createdAt: true,
        user: { id: true, nickname: true, profileImageUrl: true },
        parentComment: {
          id: true,
          content: true,
          user: { nickname: true },
        },
        rootComment: { id: true },
      },
      order: { createdAt: "ASC" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return {
      data: replies,
      count: total,
      currentPage: query.page,
      lastPage: Math.ceil(total / query.limit),
    };
  };
}
