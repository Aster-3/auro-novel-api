import { FindAndCountType } from "../constants/findAndCountType.js";
import { Comment } from "../entities/Comment.js";
import { CreateCommentDto } from "../schemas/create.comment.schema.js";

export interface ICommentRepository {
  create(comment: CreateCommentDto): Promise<Comment | null>;
  getCommentsByNovelId(query: {
    novelId: string;
    page?: number;
    limit?: number;
  }): Promise<FindAndCountType<Comment>>;
}
