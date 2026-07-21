import { Novel } from "../entities/Novel.js";
import { FindAndCountType } from "../constants/findAndCountType.js";
import { CreateNovelDTo } from "../schemas/create.novel.schema.js";
import { GetNovelsDTo } from "../schemas/get.novels.schema.js";
import { QueryPageAndLimitDto } from "../schemas/queryPageAndLimitSchema.js";
import { UpdateNovelDTO } from "../schemas/update.novel.schema.js";

export type NovelListItem = Pick<
  Novel,
  "id" | "name" | "coverImage" | "status" | "chapterCount" | "viewCount"
> & {
  recommendationRate: number | null;
};

export type SimilarNovelItem = Pick<
  Novel,
  "id" | "name" | "coverImage"
>;

export interface INovelRepository {
  create(novel: CreateNovelDTo): Promise<Novel>;
  getNovels(dto: GetNovelsDTo): Promise<FindAndCountType<NovelListItem>>;
  getNovelsByAuthorUserId(
    userId: string,
    dto: QueryPageAndLimitDto,
  ): Promise<FindAndCountType<NovelListItem>>;
  getLastUpdatedNovels(limit: number): Promise<Novel[]>;
  getWeeklyTrendingNovels(limit: number): Promise<Novel[]>;
  getRandomClassicNovels(limit: number): Promise<Novel[]>;
  getNovelsWithTagId(tagId: string, limit: number): Promise<Novel[]>;
  getLastCreatedNovels(limit: number): Promise<Novel[]>;
  getSimilarNovels(novelId: string, limit: number): Promise<SimilarNovelItem[]>;
  findOneById(id: string): Promise<Novel | null>;
  getFirstPublishedChapterId(novelId: string): Promise<string | null>;
  existControl(identifier: { id?: string; slug?: string }): Promise<boolean>;
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
      totalReviewsCount: number;
      totalReviews: number;
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
      totalLibraryCount: number;
    }[]
  >;
  isOwnerControl(novelId: string, authorId: string): Promise<boolean>;
  deleteNovel(novelId: string): Promise<void>;
  refreshChapterStats(novelId: string): Promise<void>;
}
