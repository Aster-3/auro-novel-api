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
  getLast3CommentsWithCount(
    novelId: string,
  ): Promise<{ items: Comment[]; total: number }>;
  getMyComment(novelId: string, userId: string): Promise<Comment | null>;
  isOwner(commentId: number, userId: string): Promise<boolean>;
  getOneById(id: number): Promise<Comment | null>;
}
