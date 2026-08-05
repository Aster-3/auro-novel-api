import { INovelDailyStatsService } from "../interfaces/novel.daily.stats.service.interface.js";

export class NovelDailyStatsController {
  constructor(private novelDailyStatsService: INovelDailyStatsService) {}

  getDashboardStats = async (req: any, res: any) => {
    const { novelId } = req.params;
    const { limit } = res.locals.validatedData;
    const authorId = req.user?.id;
    const stats = await this.novelDailyStatsService.getDashboardStats(
      novelId,
      authorId,
      limit,
    );
    res.json(stats);
  };
}
