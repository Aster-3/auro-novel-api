import { Novel } from "../entities/Novel.js";
import { FindAndCountType } from "../constants/findAndCountType.js";
import { CreateNovelDTo } from "../schemas/create.novel.schema.js";
import { GetNovelsDTo } from "../schemas/get.novels.schema.js";
import { UpdateNovelDTO } from "../schemas/update.novel.schema.js";

export interface INovelRepository {
  create(novel: CreateNovelDTo): Promise<Novel>;
  getNovels(dto: GetNovelsDTo): Promise<FindAndCountType<Novel>>;
  getLastUpdatedNovels(limit: number): Promise<Novel[]>;
  getWeeklyTrendingNovels(limit: number): Promise<Novel[]>;
  getNovelsWithTagId(tagId: string, limit: number): Promise<Novel[]>;
  getLastCreatedNovels(limit: number): Promise<Novel[]>;
  findOneById(id: string): Promise<Novel | null>;
  existControl(identifier: { id?: string; slug?: string }): Promise<boolean>;
  updateNovelCategories(novelId: string, categoryIds: number[]): Promise<void>;
  updateNovelTags(novelId: string, tagIds: string[]): Promise<void>;
  incrementViewCount(novelId: string): Promise<void>;
  incrementTotalSales(novelId: string): Promise<void>;
  incrementAndDecrementReviewCount(
    novelId: string,
    isIncrement: boolean,
    isPositive: boolean,
  ): Promise<Novel>;
  updateNovel(dto: UpdateNovelDTO): Promise<void>;
  updateRankingScore(novelId: string, newRankingScore: number): Promise<void>;
  getWeeklyTrendData(): Promise<
    {
      id: string;
      totalReviewsCount: number;
      totalSales: number;
      totalReviews: number;
      totalPurchases: number;
    }[]
  >;
  bulkUpdateWeeklyScores(
    scores: { id: string; weeklyScore: number }[],
  ): Promise<void>;
  getAllNovelsWithStats(): Promise<
    {
      id: string;
      viewCount: number;
      totalReviewsCount: number;
      positiveReviewsCount: number;
      totalSales: number;
    }[]
  >;
  isOwnerControl(novelId: string, authorId: string): Promise<boolean>;
  deleteNovel(novelId: string): Promise<void>;
  refreshChapterStats(novelId: string): Promise<void>;
  getPaywallConfig(novelId: string): Promise<{
    paywallStartVolume: number | null;
    paywallStartChapter: number | null;
    author: {
      user: {
        id: string | null;
      };
    };
  } | null>;
}
