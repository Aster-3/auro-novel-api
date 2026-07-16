import { FindAndCountType } from "../constants/findAndCountType.js";
import { Novel } from "../entities/Novel.js";
import { NovelListItem } from "./novel.repo.interface.js";
import { CreateNovelDTo } from "../schemas/create.novel.schema.js";
import { GetNovelsDTo } from "../schemas/get.novels.schema.js";
import { UpdateNovelDTO } from "../schemas/update.novel.schema.js";

export type NovelDetailResponse = Omit<Novel, "author"> & {
  author: {
    id: string;
    authorName: string;
    isRegisteredUser: boolean;
    isVerified: boolean;
  };
  recommendationRate: number | null;
  firstPublishedChapterId: string | null;
};

export interface INovelService {
  create(
    dto: CreateNovelDTo,
    isAdmin: boolean,
    file?: Express.Multer.File,
  ): Promise<Novel>;
  getNovels(dto: GetNovelsDTo): Promise<FindAndCountType<NovelListItem>>;
  getLastUpdatedNovels(limit?: number): Promise<
    {
      id: string;
      name: string;
      coverImage: string | null;
      lastChapterDate: Date | null;
      recommendRate: number | null;
      chapterCount: number;
      authorName: string;
    }[]
  >;
  getWeeklyTrendingNovels(limit?: number): Promise<Novel[]>;
  getNovelsWithTagId(tagId: string, limit?: number): Promise<Novel[]>;
  getLastCreatedNovels(limit?: number): Promise<Novel[]>;
  refreshWeeklyTrendData(): Promise<void>;
  getAllNovelsWithStats(): Promise<
    {
      id: string;
      viewCount: number;
      totalReviewsCount: number;
      positiveReviewsCount: number;
      totalLibraryCount: number;
    }[]
  >;
  getNovelDetailWithId(id: string): Promise<NovelDetailResponse>;
  updateNovelCategories(
    novelId: string,
    categoryIds: number[],
    userId: string,
    isAdmin: boolean,
  ): Promise<void>;
  updateNovelTags(
    novelId: string,
    tagIds: string[],
    userId: string,
    isAdmin: boolean,
  ): Promise<void>;
  incrementViewCount(novelId: string): Promise<void>;
  updateNovel(
    dto: UpdateNovelDTO,
    userId: string,
    isAdmin: boolean,
  ): Promise<void>;
  deleteNovel(
    novelId: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<void>;
  isOwnerControl(novelId: string, authorId: string): Promise<boolean>;
}
