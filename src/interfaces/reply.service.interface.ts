import { Reply } from "../entities/Reply.js";
import { CreateReplyDto } from "../schemas/create.reply.schema.js";
import { DeleteReplySchema } from "../schemas/delete.reply.schema.js";

export interface IReplyService {
  createReply(reply: CreateReplyDto): Promise<Reply>;
  deleteReply(dto: DeleteReplySchema): Promise<void>;
  toggleLike(userId: string, replyId: number): Promise<boolean>;
}
