import { FindAndCountType } from "../constants/findAndCountType.js";
import { Reply } from "../entities/Reply.js";
import { CreateReplyDto } from "../schemas/create.reply.schema.js";
import { GetCommentRepliesDto } from "../schemas/get.comment.replies.schema.js";

export interface IReplyRepository {
  create(reply: CreateReplyDto): Promise<Reply>;
  delete(id: number): Promise<void>;
  getCommentReplies(
    dto: GetCommentRepliesDto,
  ): Promise<FindAndCountType<Reply>>;
}
