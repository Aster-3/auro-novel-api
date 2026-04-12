import { INovelDailyStatsService } from "../interfaces/novel.daily.stats.service.interface.js";
import { INovelService } from "../interfaces/novel.service.interface.js";
import cron from "node-cron";

export const createDailySnapshot = async (
  novelDailyStatsService: INovelDailyStatsService,
  novelService: INovelService,
) => {
  cron.schedule(
    "0 0 * * *",
    async () => {
      try {
        const novelsWithStats = await novelService.getAllNovelsWithStats();
        await novelDailyStatsService.bulkCreateDailySnapshots(novelsWithStats);
      } catch (error) {
        console.error("Error creating daily snapshots:", error);
      }
    },
    {
      timezone: "Europe/Istanbul",
    },
  );
};
