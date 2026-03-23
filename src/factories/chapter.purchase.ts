import { ChapterPurchaseController } from "../controllers/chapter.purchase.controller.js";
import { AppDataSource } from "../database/data-source.js";
import { Chapter, ChapterPurchase, User } from "../entities/_index.js";
import { ChapterPurchaseRepository } from "../repositories/chapter.purchase.repository.js";
import { ChapterRepository } from "../repositories/chapter.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { ChapterPurchaseService } from "../services/create.chapter.purchase.service.js";

export const getChapterPurchaseController = () => {
  const chapterPurchaseRepo = new ChapterPurchaseRepository(
    AppDataSource.getRepository(ChapterPurchase),
    AppDataSource,
  );
  const userRepo = new UserRepository(AppDataSource.getRepository(User));
  const chapterRepo = new ChapterRepository(
    AppDataSource.getRepository(Chapter),
  );
  const chapterPurchaseService = new ChapterPurchaseService(
    chapterPurchaseRepo,
    userRepo,
    chapterRepo,
  );

  const chapterPurchaseController = new ChapterPurchaseController(
    chapterPurchaseService,
  );
  return chapterPurchaseController;
};
