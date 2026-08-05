import { FindAndCountType } from "../constants/findAndCountType.js";
import { Novel } from "../entities/Novel.js";
import {
  NovelListItem,
  SimilarNovelItem,
  WeeklyTrendingNovelItem,
} from "./novel.repo.interface.js";
import { CreateNovelDTo } from "../schemas/create.novel.schema.js";
import { GetNovelsDTo } from "../schemas/get.novels.schema.js";
import { UpdateNovelDTO } from "../schemas/update.novel.schema.js";

export type NovelDetailResponse = Omit<Novel, "author"> & {
  author: {
    id: string | null;
    authorName: string;
    isRegisteredUser: boolean;
    isDeletedUser: boolean;
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
  getNovels(
    dto: GetNovelsDTo,
    allowAdultContent?: boolean,
    viewerId?: string,
  ): Promise<FindAndCountType<NovelListItem>>;
  getLastUpdatedNovels(
    limit?: number,
    allowAdultContent?: boolean,
    viewerId?: string,
  ): Promise<
    {
      id: string;
      name: string;
      coverImage: string | null;
      lastChapterDate: Date | null;
      recommendRate: number | null;
      chapterCount: number;
      authorName: string;
      authorIsDeleted: boolean;
    }[]
  >;
  getWeeklyTrendingNovels(
    limit?: number,
    page?: number,
    allowAdultContent?: boolean,
    viewerId?: string,
  ): Promise<WeeklyTrendingNovelItem[]>;
  getRandomClassicNovels(
    limit?: number,
    allowAdultContent?: boolean,
    viewerId?: string,
  ): Promise<Novel[]>;
  getNovelsWithTagId(
    tagId: string,
    limit?: number,
    allowAdultContent?: boolean,
    viewerId?: string,
  ): Promise<Novel[]>;
  getLastCreatedNovels(
    limit?: number,
    allowAdultContent?: boolean,
    viewerId?: string,
  ): Promise<Novel[]>;
  getSimilarNovels(
    novelId: string,
    limit?: number,
    allowAdultContent?: boolean,
    viewerId?: string,
  ): Promise<SimilarNovelItem[]>;
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
  getNovelDetailWithId(
    id: string,
    viewerId?: string,
  ): Promise<NovelDetailResponse>;
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
