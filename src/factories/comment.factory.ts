import { CommentController } from "../controllers/comment.controller.js";
import { AppDataSource } from "../database/data-source.js";
import { Comment } from "../entities/Comment.js";
import { CommentRepository } from "../repositories/comment.repository.js";
import { CommentService } from "../services/comment.service.js";

export const getCommentController = () => {
  const repo = AppDataSource.getRepository(Comment);
  const commentRepo = new CommentRepository(repo);
  const commentService = new CommentService(commentRepo);
  const commentController = new CommentController(commentService);
  return commentController;
};
