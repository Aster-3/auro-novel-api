import cron from "node-cron";
import { INovelService } from "../interfaces/novel.service.interface.js";

export const setupTrendingUpdateJob = (novelService: INovelService) => {
  cron.schedule(
    "0 0 * * *",
    async () => {
      await novelService.refreshWeeklyTrendData();
      try {
      } catch (error) {
        console.error("Cron hatası:", error);
      }
    },
    {
      timezone: "Europe/Istanbul",
    },
  );
};
