import { Repository } from "typeorm";
import { ICommentRepository } from "../interfaces/comment.repo.interface.js";
import { Comment } from "../entities/Comment.js";
import { CreateCommentDto } from "../schemas/create.comment.schema.js";

export class CommentRepository implements ICommentRepository {
  constructor(private commentRepo: Repository<Comment>) {}

  create(comment: CreateCommentDto) {
    return this.commentRepo.save(comment);
  }

  async getCommentsByNovelId(query: {
    novelId: string;
    page: number;
    limit: number;
  }) {
    const [comments, total] = await this.commentRepo.findAndCount({
      where: { novel: { id: query.novelId } },
      skip: (query.page - 1) * query.limit,
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
