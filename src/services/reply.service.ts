import { IReplyRepository } from "../interfaces/reply.repo.interface.js";
import { IReplyService } from "../interfaces/reply.service.interface.js";
import { IReplyLikeRepository } from "../interfaces/reply.like.repo.interface.js";
import { CreateReplyDto } from "../schemas/create.reply.schema.js";
import { DeleteReplySchema } from "../schemas/delete.reply.schema.js";

export class ReplyService implements IReplyService {
  constructor(
    private replyRepo: IReplyRepository,
    private replyLikeRepo: IReplyLikeRepository,
  ) {}

  createReply = async (reply: CreateReplyDto) => {
    return await this.replyRepo.create(reply);
  };

  deleteReply = async (dto: DeleteReplySchema) => {
    const isOwner = await this.replyRepo.isOwner(dto.replyId, dto.userId!);
    if (!isOwner) {
      throw new Error("Bu yorumun sahibi değilsiniz.");
    }
    await this.replyRepo.delete(dto.replyId);
  };

  toggleLike = async (userId: string, replyId: number) => {
    return await this.replyLikeRepo.toggleLike(userId, replyId);
  };
}
