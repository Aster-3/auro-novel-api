import { FindAndCountType } from "../constants/findAndCountType.js";
import { Comment } from "../entities/Comment.js";
import { CreateCommentDto } from "../schemas/create.comment.schema.js";
import { CreateReplyDto } from "../schemas/create.reply.schema.js";
import { GetCommentsDto } from "../schemas/get.comments.schema.js";
import { GetUserShowcaseDto } from "../schemas/get.user.showcase.schema.js";

export interface ICommentRepository {
  create(comment: CreateCommentDto | CreateReplyDto): Promise<Comment | null>;
  delete(id: number): Promise<void>;
  getCommentsByNovelId(
    dto: GetCommentsDto,
    userId?: string,
  ): Promise<FindAndCountType<Comment>>;
  getReviewsByUserId(
    dto: GetUserShowcaseDto,
    viewerId?: string,
  ): Promise<FindAndCountType<any>>;
  getTopCommentsOfLastWeek(): Promise<Comment[]>;
  getLast3CommentsWithCount(
    novelId: string,
    viewerId?: string,
  ): Promise<{ items: any[]; total: number }>;
  getMyComment(novelId: string, userId: string): Promise<Comment | null>;
  isOwner(
    commentId: number,
    userId: string,
  ): Promise<{ novelId: string; isRecommend: boolean } | null>;
  getOneById(id: number, viewerId?: string): Promise<Comment | null>;
  getNotificationMetaById(
    id: number,
  ): Promise<{ id: number; userId: string; novelId: string } | null>;
}
