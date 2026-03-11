import { ReplyController } from "../controllers/reply.controller.js";
import { AppDataSource } from "../database/data-source.js";
import { Reply } from "../entities/Reply.js";
import { ReplyRepository } from "../repositories/reply.repository.js";
import { ReplyService } from "../services/reply.service.js";

export const getReplyController = () => {
  const repo = AppDataSource.getRepository(Reply);
  const replyRepo = new ReplyRepository(repo);
  const replyService = new ReplyService(replyRepo);
  const replyController = new ReplyController(replyService);
  return replyController;
};
