import { FindAndCountType } from "../constants/findAndCountType.js";
import { Reply } from "../entities/Reply.js";
import { CreateReplyDto } from "../schemas/create.reply.schema.js";
import { DeleteReplySchema } from "../schemas/delete.reply.schema.js";
import { GetCommentRepliesDto } from "../schemas/get.comment.replies.schema.js";
import { GetUserShowcaseDto } from "../schemas/get.user.showcase.schema.js";

export interface IReplyRepository {
  create(reply: CreateReplyDto & { userId: string }): Promise<Reply>;
  delete(replyId: number): Promise<void>;
  getCommentReplies(
    dto: GetCommentRepliesDto,
  ): Promise<FindAndCountType<Reply>>;
  getRepliesByUserId(
    dto: GetUserShowcaseDto,
    viewerId?: string,
  ): Promise<FindAndCountType<any>>;
  isOwner(replyId: number, userId: string): Promise<boolean>;
  getNotificationMetaById(
    id: number,
  ): Promise<
    | { id: number; userId: string; rootCommentId: number; deletedAt: Date | null }
    | null
  >;
}
