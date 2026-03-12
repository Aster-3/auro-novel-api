import { ChapterController } from "../controllers/chapter.controller.js";
import { AppDataSource } from "../database/data-source.js";
import { Novel } from "../entities/_index.js";
import { Chapter } from "../entities/Chapter.js";
import { Volume } from "../entities/Volume.js";
import { ChapterRepository } from "../repositories/chapter.repository.js";
import { NovelRepository } from "../repositories/novel.repository.js";
import { VolumeRepository } from "../repositories/volume.repository.js";
import { ChapterService } from "../services/chapter.service.js";

export const getChapterController = () => {
  const chapterRepo = new ChapterRepository(
    AppDataSource.getRepository(Chapter),
  );
  const volumeRepo = new VolumeRepository(AppDataSource.getRepository(Volume));
  const novelRepo = new NovelRepository(AppDataSource.getRepository(Novel));
  const chapterService = new ChapterService(chapterRepo, volumeRepo, novelRepo);
  const chapterController = new ChapterController(chapterService);
  return chapterController;
};
