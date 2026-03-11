import { CommentController } from "../controllers/comment.controller.js";
import { AppDataSource } from "../database/data-source.js";
import { Comment } from "../entities/Comment.js";
import { Reply } from "../entities/Reply.js";
import { CommentRepository } from "../repositories/comment.repository.js";
import { ReplyRepository } from "../repositories/reply.repository.js";
import { CommentService } from "../services/comment.service.js";

export const getCommentController = () => {
  const commentRepo = new CommentRepository(
    AppDataSource.getRepository(Comment),
  );
  const replyRepo = new ReplyRepository(AppDataSource.getRepository(Reply));
  const commentService = new CommentService(commentRepo, replyRepo);
  const commentController = new CommentController(commentService);
  return commentController;
};
