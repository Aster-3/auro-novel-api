import { FindAndCountType } from "../constants/findAndCountType.js";
import { getRepliesDto } from "../dtos/get.replies.dto.js";
import { Comment } from "../entities/Comment.js";
import { Reply } from "../entities/Reply.js";
import { CreateCommentDto } from "../schemas/create.comment.schema.js";
import { GetCommentRepliesDto } from "../schemas/get.comment.replies.schema.js";
import { GetCommentsDto } from "../schemas/get.comments.schema.js";

export interface ICommentService {
  getCommentsByNovelId(dto: GetCommentsDto): Promise<FindAndCountType<Comment>>;
  createComment(dto: CreateCommentDto): Promise<Comment | null>;
  deleteComment(id: number): Promise<void>;
  getTopCommentsOfLastWeek(): Promise<Comment[]>;
  getCommentReplies(
    dto: GetCommentRepliesDto,
  ): Promise<FindAndCountType<Reply>>;
  toggleLike(userId: string, commentId: number): Promise<boolean>;
  getLast3CommentsByNovelId(novelId: string): Promise<Comment[]>;
}
