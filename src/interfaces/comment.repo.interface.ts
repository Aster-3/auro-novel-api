import { FindAndCountType } from "../constants/findAndCountType.js";
import { Comment } from "../entities/Comment.js";
import { CreateCommentDto } from "../schemas/create.comment.schema.js";
import { CreateReplyDto } from "../schemas/create.reply.schema.js";

export interface ICommentRepository {
  create(comment: CreateCommentDto | CreateReplyDto): Promise<Comment | null>;
  delete(id: number): Promise<void>;
  getCommentsByNovelId(query: {
    novelId: string;
    page?: number;
    limit?: number;
  }): Promise<FindAndCountType<Comment>>;
}
