import { Novel } from "../entities/Novel.js";
import { FindAndCountType } from "../constants/findAndCountType.js";
import { CreateNovelDTo } from "../schemas/create.novel.schema.js";
import { GetNovelsDTo } from "../schemas/get.novels.schema.js";
import { QueryPageAndLimitDto } from "../schemas/queryPageAndLimitSchema.js";
import { UpdateNovelDTO } from "../schemas/update.novel.schema.js";

export type NovelListItem = Pick<
  Novel,
  | "id"
  | "name"
  | "coverImage"
  | "synopsis"
  | "status"
  | "chapterCount"
  | "averageChapterWordCount"
  | "viewCount"
  | "totalReviewsCount"
> & {
  recommendationRate: number | null;
  bannedUntil?: Date | null;
  banReason?: string | null;
};

export type SimilarNovelItem = Pick<
  Novel,
  "id" | "name" | "coverImage"
>;

export type WeeklyRankStatus = "new" | "up" | "down" | "same";

export type WeeklyTrendingNovelItem = Pick<
  Novel,
  "id" | "name" | "coverImage" | "weeklyRankingScore"
> & {
  rank: number;
  previousRank: number | null;
  rankChange: number | null;
  rankStatus: WeeklyRankStatus;
};

export interface INovelRepository {
  create(novel: CreateNovelDTo): Promise<Novel>;
  getNovels(
    dto: GetNovelsDTo,
    allowAdultContent?: boolean,
    viewerId?: string,
  ): Promise<FindAndCountType<NovelListItem>>;
  getNovelsByAuthorUserId(
    userId: string,
    dto: QueryPageAndLimitDto,
    viewerId?: string,
  ): Promise<FindAndCountType<NovelListItem>>;
  getRecentNovelsByAuthorId(
    authorId: string,
    limit: number,
    allowAdultContent?: boolean,
    viewerId?: string,
  ): Promise<{ items: NovelListItem[]; total: number }>;
  getLastUpdatedNovels(
    limit: number,
    allowAdultContent?: boolean,
    viewerId?: string,
  ): Promise<Novel[]>;
  getWeeklyTrendingNovels(
    limit: number,
    page?: number,
    allowAdultContent?: boolean,
    viewerId?: string,
  ): Promise<WeeklyTrendingNovelItem[]>;
  getRandomClassicNovels(
    limit: number,
    allowAdultContent?: boolean,
    viewerId?: string,
  ): Promise<Novel[]>;
  getNovelsWithTagId(
    tagId: string,
    limit: number,
    allowAdultContent?: boolean,
    viewerId?: string,
  ): Promise<Novel[]>;
  getLastCreatedNovels(
    limit: number,
    allowAdultContent?: boolean,
    viewerId?: string,
  ): Promise<Novel[]>;
  getSimilarNovels(
    novelId: string,
    limit: number,
    allowAdultContent?: boolean,
    viewerId?: string,
  ): Promise<SimilarNovelItem[]>;
  findOneById(
    id: string,
    viewerId?: string,
    options?: { includeBanned?: boolean },
  ): Promise<Novel | null>;
  getFirstPublishedChapterId(novelId: string): Promise<string | null>;
  existControl(identifier: { id?: string; slug?: string }): Promise<boolean>;
  isActivelyBanned(novelId: string): Promise<boolean>;
  updateNovelCategories(novelId: string, categoryIds: number[]): Promise<void>;
  updateNovelTags(novelId: string, tagIds: string[]): Promise<void>;
  incrementViewCount(novelId: string): Promise<void>;
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
      createdAt: Date;
      viewCount: number;
      totalReviewsCount: number;
      positiveReviewsCount: number;
      totalLibraryCount: number;
      snapshotId: string | null;
      totalViews: number | null;
      totalReviews: number | null;
      totalPositiveReviews: number | null;
      totalLibraryCountSnapshot: number | null;
    }[]
  >;
  bulkUpdateWeeklyScores(
    scores: { id: string; weeklyScore: number }[],
  ): Promise<void>;
  bulkCreateWeeklyRankSnapshots(
    scores: { id: string; weeklyScore: number }[],
    limit?: number,
  ): Promise<void>;
  deleteOldWeeklyRankSnapshots(daysToKeep?: number): Promise<void>;
  getAllNovelsWithStats(): Promise<
    {
      id: string;
      viewCount: number;
      totalReviewsCount: number;
      positiveReviewsCount: number;
      totalLibraryCount: number;
    }[]
  >;
  isOwnerControl(novelId: string, authorId: string): Promise<boolean>;
  deleteNovel(novelId: string): Promise<void>;
  refreshChapterStats(novelId: string): Promise<void>;
}
