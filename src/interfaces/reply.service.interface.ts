import { Reply } from "../entities/Reply.js";
import { CreateReplyDto } from "../schemas/create.reply.schema.js";

export interface IReplyService {
  createReply(reply: CreateReplyDto): Promise<Reply>;
  deleteReply(id: number): Promise<void>;
}
