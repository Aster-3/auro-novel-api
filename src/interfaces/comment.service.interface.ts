import { FindAndCountType } from "../constants/findAndCountType.js";
import { getRepliesDto } from "../dtos/get.replies.dto.js";
import { Comment } from "../entities/Comment.js";
import { Reply } from "../entities/Reply.js";
import { CreateCommentDto } from "../schemas/create.comment.schema.js";
import { GetCommentRepliesDto } from "../schemas/get.comment.replies.schema.js";
import { GetCommentsDto } from "../schemas/get.comments.schema.js";

export interface ICommentService {
  getCommentsByNovelId(
    dto: GetCommentsDto,
    userId?: string,
  ): Promise<FindAndCountType<Comment>>;
  createComment(dto: CreateCommentDto): Promise<Comment | null>;
  deleteComment(id: number, userId?: string): Promise<void>;
  getTopCommentsOfLastWeek(): Promise<Comment[]>;
  getCommentReplies(
    dto: GetCommentRepliesDto,
  ): Promise<FindAndCountType<Reply>>;
  toggleLike(userId: string, commentId: number): Promise<boolean>;
  getLast3CommentsByNovelId(
    novelId: string,
  ): Promise<{ items: Comment[]; total: number }>;
  getMyComment(novelId: string, userId: string): Promise<Comment | null>;
  getOneCommentById(id: number): Promise<Comment | null>;
}
