import { ReplyController } from "../controllers/reply.controller.js";
import { AppDataSource } from "../database/data-source.js";
import { Reply } from "../entities/Reply.js";
import { ReplyRepository } from "../repositories/reply.repository.js";
import { ReplyService } from "../services/reply.service.js";
import { ReplyLike } from "../entities/ReplyLike.js";
import { ReplyLikeRepository } from "../repositories/reply.like.repository.js";

export const getReplyController = () => {
  const repo = AppDataSource.getRepository(Reply);
  const replyRepo = new ReplyRepository(repo);

  const likeRepo = AppDataSource.getRepository(ReplyLike);
  const replyLikeRepo = new ReplyLikeRepository(likeRepo);

  const replyService = new ReplyService(replyRepo, replyLikeRepo);
  const replyController = new ReplyController(replyService);
  return replyController;
};
