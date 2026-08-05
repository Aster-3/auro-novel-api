import { NovelDailyStats } from "../entities/NovelDailyStats.js";
import { NotFoundError } from "../errors/not.found.error.js";
import { INovelDailyStatsRepository } from "../interfaces/novel.daily.stats.repo.interface.js";
import {
  DailyNovelStats,
  DashboardStats,
  INovelDailyStatsService,
  NovelStatsResponse,
  TrendState,
} from "../interfaces/novel.daily.stats.service.interface.js";
import { INovelRepository } from "../interfaces/novel.repo.interface.js";
import { getIstanbulDateString } from "../utils/date.string.js";

type LiveNovelStats = {
  viewCount: number;
  totalReviewsCount: number;
  positiveReviewsCount: number;
  totalLibraryCount: number;
};

export class NovelDailyStatsService implements INovelDailyStatsService {
  constructor(
    private novelDailyStatsRepo: INovelDailyStatsRepository,
    private novelRepository: INovelRepository,
  ) {}

  private getRecommendationRate(
    positiveReviews: number,
    totalReviews: number,
  ) {
    return totalReviews > 0 ? (positiveReviews / totalReviews) * 100 : 0;
  }

  private getSnapshotRecommendationRate(snapshot?: NovelDailyStats) {
    if (!snapshot) return 0;

    return this.getRecommendationRate(
      snapshot.totalPositiveReviews,
      snapshot.totalReviews,
    );
  }

  private calculateDashboardStats(
    current: number,
    currentPeriodBaseline: number,
    previousPeriodStart: number,
    previousPeriodEnd: number,
  ): DashboardStats {
    const periodGain = current - currentPeriodBaseline;
    const previousPeriodGain = previousPeriodEnd - previousPeriodStart;

    let changePercent = 0;
    if (previousPeriodGain !== 0) {
      changePercent =
        ((periodGain - previousPeriodGain) / Math.abs(previousPeriodGain)) *
        100;
    } else if (periodGain !== 0) {
      changePercent = periodGain > 0 ? 100 : -100;
    }

    const roundedChange = parseFloat(changePercent.toFixed(1));

    return {
      current,
      periodGain,
      change: roundedChange,
      changePercent: roundedChange,
      status:
        periodGain > previousPeriodGain
          ? TrendState.UP
          : periodGain < previousPeriodGain
            ? TrendState.DOWN
            : TrendState.STABLE,
    };
  }

  private calculateRecommendationStats(
    currentRate: number,
    currentPeriodBaselineRate: number,
    previousPeriodStartRate: number,
    previousPeriodEndRate: number,
  ): DashboardStats {
    const periodGain = currentRate - currentPeriodBaselineRate;
    const previousPeriodGain = previousPeriodEndRate - previousPeriodStartRate;
    const changePercent = periodGain - previousPeriodGain;

    return {
      current: parseFloat(currentRate.toFixed(1)),
      periodGain: parseFloat(periodGain.toFixed(1)),
      change: parseFloat(changePercent.toFixed(1)),
      changePercent: parseFloat(changePercent.toFixed(1)),
      status:
        periodGain > previousPeriodGain
          ? TrendState.UP
          : periodGain < previousPeriodGain
            ? TrendState.DOWN
            : TrendState.STABLE,
    };
  }

  private buildDailyStats(
    snapshots: NovelDailyStats[],
    liveNovel: LiveNovelStats,
    limit: number,
  ): DailyNovelStats[] {
    const dailyStats: DailyNovelStats[] = [];

    for (let index = 1; index < snapshots.length; index += 1) {
      const previous = snapshots[index - 1];
      const current = snapshots[index];

      dailyStats.push({
        date: current.recordedAt,
        views: current.totalViews - previous.totalViews,
        reviews: current.totalReviews - previous.totalReviews,
        libraryAdds: current.totalLibraryCount - previous.totalLibraryCount,
        recommendationRate: parseFloat(
          this.getSnapshotRecommendationRate(current).toFixed(1),
        ),
      });
    }

    const latestSnapshot = snapshots[snapshots.length - 1];
    if (latestSnapshot) {
      dailyStats.push({
        date: getIstanbulDateString(),
        views: liveNovel.viewCount - latestSnapshot.totalViews,
        reviews: liveNovel.totalReviewsCount - latestSnapshot.totalReviews,
        libraryAdds:
          liveNovel.totalLibraryCount - latestSnapshot.totalLibraryCount,
        recommendationRate: parseFloat(
          this.getRecommendationRate(
            liveNovel.positiveReviewsCount,
            liveNovel.totalReviewsCount,
          ).toFixed(1),
        ),
      });
    }

    return dailyStats.slice(-limit);
  }

  getDashboardStats = async (
    novelId: string,
    authorId: string,
    limit: number = 7,
  ): Promise<NovelStatsResponse> => {
    const safeLimit = Math.min(Math.max(Number(limit) || 7, 1), 30);
    const novelExists = await this.novelRepository.isOwnerControl(
      novelId,
      authorId,
    );

    if (!novelExists) {
      throw new NotFoundError(
        "Novel bulunamadi veya bu novelin sahibi degilsiniz.",
      );
    }

    const liveNovel = await this.novelRepository.findOneById(
      novelId,
      undefined,
      { includeBanned: true },
    );

    if (!liveNovel) throw new NotFoundError("Novel bulunamadi.");

    const snapshots = await this.novelDailyStatsRepo.getLatestSnapshots(
      novelId,
      safeLimit * 2 + 1,
    );
    const orderedSnapshots = [...snapshots].reverse();
    const currentPeriodBaseline =
      orderedSnapshots.length > safeLimit
        ? orderedSnapshots[orderedSnapshots.length - safeLimit - 1]
        : orderedSnapshots[0];
    const previousPeriodStart =
      orderedSnapshots.length > safeLimit * 2
        ? orderedSnapshots[orderedSnapshots.length - safeLimit * 2 - 1]
        : orderedSnapshots[0];
    const previousPeriodEnd =
      orderedSnapshots.length > safeLimit
        ? orderedSnapshots[orderedSnapshots.length - safeLimit - 1]
        : orderedSnapshots[0];
    const currentRate = this.getRecommendationRate(
      liveNovel.positiveReviewsCount,
      liveNovel.totalReviewsCount,
    );

    return {
      totalViews: this.calculateDashboardStats(
        liveNovel.viewCount,
        currentPeriodBaseline?.totalViews ?? 0,
        previousPeriodStart?.totalViews ?? 0,
        previousPeriodEnd?.totalViews ?? 0,
      ),
      totalReviews: this.calculateDashboardStats(
        liveNovel.totalReviewsCount,
        currentPeriodBaseline?.totalReviews ?? 0,
        previousPeriodStart?.totalReviews ?? 0,
        previousPeriodEnd?.totalReviews ?? 0,
      ),
      totalLibraryCount: this.calculateDashboardStats(
        liveNovel.totalLibraryCount,
        currentPeriodBaseline?.totalLibraryCount ?? 0,
        previousPeriodStart?.totalLibraryCount ?? 0,
        previousPeriodEnd?.totalLibraryCount ?? 0,
      ),
      totalRecommendations: this.calculateRecommendationStats(
        currentRate,
        this.getSnapshotRecommendationRate(currentPeriodBaseline),
        this.getSnapshotRecommendationRate(previousPeriodStart),
        this.getSnapshotRecommendationRate(previousPeriodEnd),
      ),
      daily: this.buildDailyStats(orderedSnapshots, liveNovel, safeLimit),
    };
  };

  createDailySnapshot = async (novelId: string) => {
    await this.novelDailyStatsRepo.createDailySnapshot(novelId);
  };

  bulkCreateDailySnapshots = async (
    snapshots: {
      id: string;
      viewCount: number;
      totalReviewsCount: number;
      positiveReviewsCount: number;
      totalLibraryCount: number;
    }[],
  ) => {
    await this.novelDailyStatsRepo.bulkCreate(snapshots);
  };

  deleteOldDailySnapshots = async (daysToKeep: number = 90) => {
    await this.novelDailyStatsRepo.deleteOlderThan(daysToKeep);
  };
}
