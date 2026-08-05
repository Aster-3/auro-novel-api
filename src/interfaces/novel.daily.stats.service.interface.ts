import { NovelDailyStats } from "../entities/NovelDailyStats.js";

export interface INovelDailyStatsService {
  getDashboardStats(
    novelId: string,
    authorId: string,
    limit?: number,
  ): Promise<NovelStatsResponse>;
  createDailySnapshot(novelId: string): Promise<void>;
  bulkCreateDailySnapshots(
    snapshots: {
      id: string;
      viewCount: number;
      totalReviewsCount: number;
      positiveReviewsCount: number;
      totalLibraryCount: number;
    }[],
  ): Promise<void>;
  deleteOldDailySnapshots(daysToKeep?: number): Promise<void>;
}

export interface DashboardStats {
  current: number;
  periodGain: number;
  change: number;
  changePercent: number;
  status: TrendState;
}

export interface DailyNovelStats {
  date: string;
  views: number;
  reviews: number;
  libraryAdds: number;
  recommendationRate: number;
}

export interface NovelStatsResponse {
  totalViews: DashboardStats;
  totalReviews: DashboardStats;
  totalRecommendations: DashboardStats;
  totalLibraryCount: DashboardStats;
  daily: DailyNovelStats[];
}

export enum TrendState {
  UP = "UP",
  DOWN = "DOWN",
  STABLE = "STABLE",
}
