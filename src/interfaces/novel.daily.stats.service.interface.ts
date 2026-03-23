import { NovelDailyStats } from "../entities/NovelDailyStats.js";

export interface INovelDailyStatsService {
  getDashboardStats(
    novelId: string,
    authorId: string,
  ): Promise<NovelStatsResponse>;
  createDailySnapshot(novelId: string): Promise<void>;
}

export interface DashboardStats {
  current: number;
  change: number;
  status: TrendState;
}

export interface NovelStatsResponse {
  totalViews: DashboardStats;
  totalReviews: DashboardStats;
  totalSoldChapters: DashboardStats;
  totalRecommendations: DashboardStats;
}

export enum TrendState {
  UP = "UP",
  DOWN = "DOWN",
  STABLE = "STABLE",
}
