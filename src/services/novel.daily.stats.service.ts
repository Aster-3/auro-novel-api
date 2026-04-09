import { calculateTrend } from "../calculate.trend.js";
import { NotFoundError } from "../errors/not.found.error.js";
import { INovelDailyStatsRepository } from "../interfaces/novel.daily.stats.repo.interface.js";
import {
  INovelDailyStatsService,
  NovelStatsResponse,
  TrendState,
} from "../interfaces/novel.daily.stats.service.interface.js";
import { INovelRepository } from "../interfaces/novel.repo.interface.js";

export class NovelDailyStatsService implements INovelDailyStatsService {
  constructor(
    private novelDailyStatsRepo: INovelDailyStatsRepository,
    private novelRepository: INovelRepository,
  ) {}

  getDashboardStats = async (
    novelId: string,
    authorId: string,
  ): Promise<NovelStatsResponse> => {
    const novelExists = await this.novelRepository.isOwnerControl(
      novelId,
      authorId,
    );
    if (!novelExists) {
      throw new NotFoundError(
        "Novel bulunamadı veya bu novelin sahibi değilsiniz.",
      );
    }
    const snapshots = await this.novelDailyStatsRepo.getLatestSnapshots(
      novelId,
      2,
    );
    const liveNovel = await this.novelRepository.findOneById(novelId);

    if (!liveNovel) throw new NotFoundError("Novel bulunamadı.");

    const yesterday = snapshots[0];
    const dayBefore = snapshots[1];

    const currentRate =
      liveNovel.totalReviewsCount > 0
        ? (liveNovel.positiveReviewsCount / liveNovel.totalReviewsCount) * 100
        : 0;

    const yesterdayRate =
      yesterday && yesterday.totalReviews > 0
        ? (yesterday.totalPositiveReviews / yesterday.totalReviews) * 100
        : 0;

    const rateChange = currentRate - yesterdayRate;

    let recommendationStatus = TrendState.STABLE;
    if (rateChange > 0) {
      recommendationStatus = TrendState.UP;
    } else if (rateChange < 0) {
      recommendationStatus = TrendState.DOWN;
    }

    return {
      totalViews: calculateTrend(
        liveNovel.viewCount,
        yesterday?.totalViews,
        dayBefore?.totalViews,
      ),
      totalReviews: calculateTrend(
        liveNovel.totalReviewsCount,
        yesterday?.totalReviews,
        dayBefore?.totalReviews,
      ),
      totalSoldChapters: calculateTrend(
        liveNovel.totalSales,
        yesterday?.totalPurchases,
        dayBefore?.totalPurchases,
      ),

      totalRecommendations: {
        current: parseFloat(currentRate.toFixed(1)),
        change: parseFloat(rateChange.toFixed(1)),
        status: recommendationStatus,
      },
    };
  };

  createDailySnapshot = async (novelId: string) => {
    // Bu metod, günlük istatistik kaydı oluşturmak için kullanılabilir.
    // Örneğin, her gün saat 00:00'da bu metodu çağırarak günlük istatistik kaydı oluşturabilirsiniz.
    await this.novelDailyStatsRepo.createDailySnapshot(novelId);
  };
}
