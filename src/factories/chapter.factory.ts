import { ChapterController } from "../controllers/chapter.controller.js";
import { AppDataSource } from "../database/data-source.js";
import { Chapter } from "../entities/Chapter.js";
import { ChapterRepository } from "../repositories/chapter.repository.js";
import { ChapterService } from "../services/chapter.service.js";

export const getChapterController = () => {
  const chapterRepo = new ChapterRepository(
    AppDataSource.getRepository(Chapter),
  );
  const chapterService = new ChapterService(chapterRepo);
  const chapterController = new ChapterController(chapterService);
  return chapterController;
};
