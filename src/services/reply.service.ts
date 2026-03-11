import { IReplyRepository } from "../interfaces/reply.repo.interface.js";
import { IReplyService } from "../interfaces/reply.service.interface.js";
import { CreateReplyDto } from "../schemas/create.reply.schema.js";

export class ReplyService implements IReplyService {
  constructor(private replyRepo: IReplyRepository) {}

  createReply = async (reply: CreateReplyDto) => {
    console.log("Creating reply with DTO:", reply);
    return await this.replyRepo.create(reply);
  };

  deleteReply = async (id: number) => {
    await this.replyRepo.delete(id);
  };
}
