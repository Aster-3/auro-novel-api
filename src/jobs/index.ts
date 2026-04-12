import { INovelDailyStatsService } from "../interfaces/novel.daily.stats.service.interface.js";
import { INovelService } from "../interfaces/novel.service.interface.js";
import { createDailySnapshot } from "./create.daily.snapshot.novel.js";
import { setupTrendingUpdateJob } from "./trending.update.job.js";

export class JobLoader {
  static init(
    novelService: INovelService,
    novelDailyStatsService: INovelDailyStatsService,
  ) {
    console.log("Initializing jobs...");
    createDailySnapshot(novelDailyStatsService, novelService);
    setupTrendingUpdateJob(novelService);
    console.log("All jobs initialized.");
  }
}
