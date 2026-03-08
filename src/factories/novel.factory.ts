import { NovelController } from "../controllers/novel.controller.js";
import { AppDataSource } from "../database/data-source.js";
import { Novel } from "../entities/Novel.js";
import { NovelRepository } from "../repositories/novel.repository.js";
import { NovelService } from "../services/novel.service.js";
import { CommentService } from "../services/comment.service.js";
import { CommentRepository } from "../repositories/comment.repository.js";
import { Comment } from "../entities/Comment.js";

export const getNovelController = () => {
  const novelRepo = new NovelRepository(AppDataSource.getRepository(Novel));
  const commentRepo = new CommentRepository(
    AppDataSource.getRepository(Comment),
  );
  const commentService = new CommentService(commentRepo);
  const novelService = new NovelService(novelRepo);
  const novelController = new NovelController(novelService, commentService);
  return novelController;
};
