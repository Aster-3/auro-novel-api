import { NovelDailyStats } from "../entities/NovelDailyStats.js";

export interface INovelDailyStatsRepository {
  getStatsByNovelId(novelId: string): Promise<NovelDailyStats | null>;
  createDailySnapshot(novelId: string): Promise<NovelDailyStats>;
  getLatestSnapshots(
    novelId: string,
    limit: number,
  ): Promise<NovelDailyStats[]>;
  bulkCreate(
    snapshots: {
      id: string;
      viewCount: number;
      totalReviewsCount: number;
      positiveReviewsCount: number;
      totalSales: number;
    }[],
  ): Promise<void>;
}
