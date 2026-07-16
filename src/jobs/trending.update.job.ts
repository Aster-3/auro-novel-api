import cron from "node-cron";
import { INovelService } from "../interfaces/novel.service.interface.js";

export const setupTrendingUpdateJob = (novelService: INovelService) => {
  cron.schedule(
    "0 0 * * *",
    async () => {
      try {
        await novelService.refreshWeeklyTrendData();
      } catch (error) {
        console.error("Cron hatasi:", error);
      }
    },
    {
      timezone: "Europe/Istanbul",
    },
  );
};
