import { NovelController } from "../controllers/novel.controller.js";
import { AppDataSource } from "../database/data-source.js";
import { Novel } from "../entities/Novel.js";
import { NovelRepository } from "../repositories/novel.repository.js";
import { NovelService } from "../services/novel.service.js";
import { CommentService } from "../services/comment.service.js";
import { CommentRepository } from "../repositories/comment.repository.js";
import { Comment } from "../entities/Comment.js";
import { Reply } from "../entities/Reply.js";
import { ReplyRepository } from "../repositories/reply.repository.js";
import { Chapter } from "../entities/Chapter.js";
import { ChapterRepository } from "../repositories/chapter.repository.js";
import { Author } from "../entities/_index.js";
import { AuthorRepository } from "../repositories/author.repository.js";

export const getNovelController = () => {
  const novelRepo = new NovelRepository(AppDataSource.getRepository(Novel));
  const commentRepo = new CommentRepository(
    AppDataSource.getRepository(Comment),
  );
  const replyRepo = new ReplyRepository(AppDataSource.getRepository(Reply));
  const commentService = new CommentService(commentRepo, replyRepo, novelRepo);
  const chapterRepo = new ChapterRepository(
    AppDataSource.getRepository(Chapter),
  );

  const authorRepo = new AuthorRepository(AppDataSource.getRepository(Author));
  const novelService = new NovelService(novelRepo, authorRepo);
  const novelController = new NovelController(
    novelService,
    commentService,
    chapterRepo,
  );
  return novelController;
};
