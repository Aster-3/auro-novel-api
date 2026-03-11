import { CommentController } from "../controllers/comment.controller.js";
import { AppDataSource } from "../database/data-source.js";
import { CommentLike } from "../entities/CommentLike.js";
import { Novel } from "../entities/Novel.js";
import { Comment } from "../entities/Comment.js";
import { Reply } from "../entities/Reply.js";
import { CommentLikeRepository } from "../repositories/comment.like.repository.js";
import { CommentRepository } from "../repositories/comment.repository.js";
import { NovelRepository } from "../repositories/novel.repository.js";
import { ReplyRepository } from "../repositories/reply.repository.js";
import { CommentService } from "../services/comment.service.js";

export const getCommentController = () => {
  const commentRepo = new CommentRepository(
    AppDataSource.getRepository(Comment),
  );
  const replyRepo = new ReplyRepository(AppDataSource.getRepository(Reply));
  const novelRepo = new NovelRepository(AppDataSource.getRepository(Novel));
  const commentLikeRepo = new CommentLikeRepository(
    AppDataSource.getRepository(CommentLike),
  );
  const commentService = new CommentService(
    commentRepo,
    replyRepo,
    novelRepo,
    commentLikeRepo,
  );
  const commentController = new CommentController(commentService);
  return commentController;
};
