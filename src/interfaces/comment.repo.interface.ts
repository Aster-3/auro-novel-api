import { FindAndCountType } from "../constants/findAndCountType.js";
import { Comment } from "../entities/Comment.js";
import { CreateCommentDto } from "../schemas/create.comment.schema.js";
import { CreateReplyDto } from "../schemas/create.reply.schema.js";
import { GetCommentsDto } from "../schemas/get.comments.schema.js";

export interface ICommentRepository {
  create(comment: CreateCommentDto | CreateReplyDto): Promise<Comment | null>;
  delete(id: number): Promise<void>;
  getCommentsByNovelId(
    dto: GetCommentsDto,
    userId?: string,
  ): Promise<FindAndCountType<Comment>>;
  getTopCommentsOfLastWeek(): Promise<Comment[]>;
  getLast3CommentsByNovelId(novelId: string): Promise<Comment[]>;
  getMyComment(novelId: string, userId: string): Promise<Comment | null>;
}
