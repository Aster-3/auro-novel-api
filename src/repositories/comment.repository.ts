import { IsNull, Repository } from "typeorm";
import { ICommentRepository } from "../interfaces/comment.repo.interface.js";
import { Comment } from "../entities/Comment.js";
import { CreateCommentDto } from "../schemas/create.comment.schema.js";
import { CreateReplyDto } from "../schemas/create.reply.schema.js";

export class CommentRepository implements ICommentRepository {
  constructor(private commentRepo: Repository<Comment>) {}

  create(comment: CreateCommentDto | CreateReplyDto) {
    return this.commentRepo.save(comment);
  }

  async delete(id: number) {
    await this.commentRepo.delete(id);
  }

  async getCommentsByNovelId(query: {
    novelId: string;
    page: number;
    limit: number;
  }) {
    const [comments, total] = await this.commentRepo.findAndCount({
      where: { novel: { id: query.novelId }, parentComment: IsNull() },
      skip: (query.page - 1) * query.limit,
      relations: {
        user: true,
        replies: { user: true, likes: true, replies: true },
        likes: true,
      },
      take: query.limit,
    });
    return {
      data: comments,
      count: total,
      currentPage: query.page,
      lastPage: Math.ceil(total / query.limit),
    };
  }
}
