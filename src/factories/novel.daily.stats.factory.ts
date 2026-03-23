import { NovelDailyStatsController } from "../controllers/novel.daily.stats.controller.js";
import { AppDataSource } from "../database/data-source.js";
import { Novel } from "../entities/_index.js";
import { NovelDailyStats } from "../entities/NovelDailyStats.js";
import { NovelDailyStatsRepository } from "../repositories/novel.daily.stats.repository.js";
import { NovelRepository } from "../repositories/novel.repository.js";
import { NovelDailyStatsService } from "../services/novel.daily.stats.service.js";

export const getNovelDailyStatsController = () => {
  const repo = AppDataSource.getRepository(NovelDailyStats);
  const novelDailyStatsRepo = new NovelDailyStatsRepository(repo);
  const novelRepo = new NovelRepository(AppDataSource.getRepository(Novel));
  const novelDailyStatsService = new NovelDailyStatsService(
    novelDailyStatsRepo,
    novelRepo,
  );
  const novelDailyStatsController = new NovelDailyStatsController(
    novelDailyStatsService,
  );
  return novelDailyStatsController;
};
