import { FindAndCountType } from "../constants/findAndCountType.js";
import { Novel } from "../entities/Novel.js";
import { CreateNovelDTo } from "../schemas/create.novel.schema.js";
import { GetNovelsDTo } from "../schemas/get.novels.schema.js";
import { UpdateNovelDTO } from "../schemas/update.novel.schema.js";

export interface INovelService {
  create(
    dto: CreateNovelDTo,
    isAdmin: boolean,
    file?: Express.Multer.File,
  ): Promise<Novel>;
  getNovels(dto: GetNovelsDTo): Promise<FindAndCountType<Novel>>;
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
      totalSales: number;
    }[]
  >;
  getNovelDetailWithId(id: string): Promise<Novel>;
  updateNovelCategories(novelId: string, categoryIds: number[]): Promise<void>;
  updateNovelTags(novelId: string, tagIds: string[]): Promise<void>;
  incrementViewCount(novelId: string): Promise<void>;
  updateNovel(dto: UpdateNovelDTO): Promise<void>;
  deleteNovel(novelId: string): Promise<void>;
  isOwnerControl(novelId: string, authorId: string): Promise<boolean>;
}
