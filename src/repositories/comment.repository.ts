import { ILike, Repository } from "typeorm";
import { ICommentRepository } from "../interfaces/comment.repo.interface.js";
import { Comment } from "../entities/Comment.js";
import { da } from "zod/locales";

export class CommentRepository implements ICommentRepository {
  constructor(private commentRepo: Repository<Comment>) {}

  async getAllComments(page: number, limit: number) {
    const [comments, count] = await this.commentRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });
    return comments;
  }

  async getCommentsByUserId(userId: string, page: number, limit: number) {
    const [comments, total] = await this.commentRepo.findAndCount({
      where: { user: { id: userId } },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: comments,
      count: total,
      currentPage: page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async getCommentsByNovelId(novelId: string, page: number, limit: number) {
    const [comments, total] = await this.commentRepo.findAndCount({
      where: { novel: { id: novelId } },
      skip: (page - 1) * limit,
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
