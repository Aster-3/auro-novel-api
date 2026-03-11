import { FindAndCountType } from "../constants/findAndCountType.js";
import { Comment } from "../entities/Comment.js";
import { CreateCommentDto } from "../schemas/create.comment.schema.js";
import { CreateReplyDto } from "../schemas/create.reply.schema.js";
import { GetCommentRepliesDto } from "../schemas/get.comment.replies.schema.js";
import { GetCommentsDto } from "../schemas/get.comments.schema.js";

export interface ICommentRepository {
  create(comment: CreateCommentDto | CreateReplyDto): Promise<Comment | null>;
  delete(id: number): Promise<void>;
  getCommentsByNovelId(dto: GetCommentsDto): Promise<FindAndCountType<Comment>>;
  getTopCommentsOfLastWeek(): Promise<Comment[]>;
}
