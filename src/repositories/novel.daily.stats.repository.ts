import { Repository } from "typeorm";
import { NovelDailyStats } from "../entities/NovelDailyStats.js";
import { INovelDailyStatsRepository } from "../interfaces/novel.daily.stats.repo.interface.js";

export class NovelDailyStatsRepository implements INovelDailyStatsRepository {
  constructor(private novelDailyStatsRepo: Repository<NovelDailyStats>) {}

  async getStatsByNovelId(novelId: string) {
    return await this.novelDailyStatsRepo.findOne({
      where: { novelId },
      order: { recordedAt: "DESC" },
    });
  }

  async createDailySnapshot(novelId: string) {
    const today = new Date().toISOString().split("T")[0];
    const stats = this.novelDailyStatsRepo.create({
      novelId,
      recordedAt: today,
      totalViews: 0,
      totalReviews: 0,
      totalPositiveReviews: 0,
      totalPurchases: 0,
    });
    return await this.novelDailyStatsRepo.save(stats);
  }

  async getLatestSnapshots(novelId: string, limit: number = 2) {
    return await this.novelDailyStatsRepo.find({
      where: { novelId },
      order: { recordedAt: "DESC" },
      take: limit,
    });
  }

  async bulkCreate(snapshots: any[]) {
    const recordedAt = new Date().toISOString().split("T")[0];

    const entities = snapshots.map((s) => ({
      novelId: s.id,
      recordedAt,
      totalViews: s.viewCount,
      totalReviews: s.totalReviewsCount,
      totalPositiveReviews: s.positiveReviewsCount,
      totalPurchases: s.totalSales,
    }));

    await this.novelDailyStatsRepo
      .createQueryBuilder()
      .insert()
      .into(NovelDailyStats)
      .values(entities)
      .execute();
  }
}
