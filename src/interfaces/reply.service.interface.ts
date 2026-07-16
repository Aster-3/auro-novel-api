import { Reply } from "../entities/Reply.js";
import { CreateReplyDto } from "../schemas/create.reply.schema.js";
import { DeleteReplySchema } from "../schemas/delete.reply.schema.js";

export type CreateReplyWithUserDto = CreateReplyDto & { userId: string };

export interface IReplyService {
  createReply(reply: CreateReplyWithUserDto): Promise<Reply>;
  deleteReply(dto: DeleteReplySchema): Promise<void>;
  toggleLike(userId: string, replyId: number): Promise<boolean>;
}
