import { ConflictError } from "../errors/conflict.error.js";
import { ForbiddenError } from "../errors/forbidden.error.js";
import { NotFoundError } from "../errors/not.found.error.js";
import { IAuthorRepository } from "../interfaces/author.repo.interface.js";
import { INovelRepository } from "../interfaces/novel.repo.interface.js";
import { INovelService } from "../interfaces/novel.service.interface.js";
import { CreateNovelDTo } from "../schemas/create.novel.schema.js";
import { GetNovelsDTo } from "../schemas/get.novels.schema.js";
import { UpdateNovelDTO } from "../schemas/update.novel.schema.js";
import { presentAuthor } from "../utils/deleted.user.presenter.js";
import { uploadToS3 } from "./s3.service.js";

export class NovelService implements INovelService {
  constructor(
    private novelRepo: INovelRepository,
    private authorRepo: IAuthorRepository,
  ) {}

  private calculateWeeklyRankingScore(item: {
    createdAt: Date | string;
    viewCount: number | string;
    totalReviewsCount: number | string;
    positiveReviewsCount: number | string;
    totalLibraryCount: number | string;
    snapshotId: string | null;
    totalViews: number | string | null;
    totalReviews: number | string | null;
    totalPositiveReviews: number | string | null;
    totalLibraryCountSnapshot: number | string | null;
  }) {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const isNewNovel = new Date(item.createdAt).getTime() >= sevenDaysAgo;

    if (!item.snapshotId && !isNewNovel) {
      return 0;
    }

    const baselineViews = item.snapshotId ? Number(item.totalViews ?? 0) : 0;
    const baselineReviews = item.snapshotId
      ? Number(item.totalReviews ?? 0)
      : 0;
    const baselinePositiveReviews = item.snapshotId
      ? Number(item.totalPositiveReviews ?? 0)
      : 0;
    const baselineLibraryCount = item.snapshotId
      ? Number(item.totalLibraryCountSnapshot ?? 0)
      : 0;

    const weeklyViews = Math.max(Number(item.viewCount) - baselineViews, 0);
    const weeklyReviews = Math.max(
      Number(item.totalReviewsCount) - baselineReviews,
      0,
    );
    const weeklyPositiveReviews = Math.max(
      Number(item.positiveReviewsCount) - baselinePositiveReviews,
      0,
    );
    const weeklyLibraryAdds = Math.max(
      Number(item.totalLibraryCount) - baselineLibraryCount,
      0,
    );

    const reviewRatio =
      weeklyReviews > 0
        ? Math.min(weeklyPositiveReviews / weeklyReviews, 1)
        : 0;

    let score =
      Math.log1p(weeklyViews) * 1.2 +
      Math.log1p(weeklyReviews) * 6 +
      Math.log1p(weeklyLibraryAdds) * 4 +
      reviewRatio * Math.log1p(weeklyReviews) * 3;

    if (weeklyReviews < 2 && weeklyLibraryAdds < 3 && weeklyViews < 50) {
      score *= 0.4;
    }

    return Number(score.toFixed(4));
  }

  async create(
    dto: CreateNovelDTo,
    isAdmin: boolean,
    file?: Express.Multer.File,
  ) {
    const isSlugTaken = await this.novelRepo.existControl({ slug: dto.slug });
    if (isSlugTaken) {
      throw new ConflictError("slug", "Bu slug zaten kullanimda.");
    }

    const novelData = { ...dto };

    const author = await this.authorRepo.findByUserId(dto.authorId);
    if (author) {
      novelData.authorId = author.id;
    } else if (isAdmin) {
      const authorById = await this.authorRepo.existControlAuthorId(
        dto.authorId,
      );
      if (!authorById) {
        throw new NotFoundError("Yazar bulunamadi.");
      }
    } else {
      throw new NotFoundError("Yazar bulunamadi.");
    }

    if (file) {
      novelData.coverImage = await uploadToS3(file, "novel-covers");
    }

    return this.novelRepo.create(novelData);
  }

  async getNovels(
    dto: GetNovelsDTo,
    allowAdultContent = false,
    viewerId?: string,
  ) {
    return this.novelRepo.getNovels(dto, allowAdultContent, viewerId);
  }

  async getNovelDetailWithId(id: string, viewerId?: string) {
    const novel = await this.novelRepo.findOneById(id, viewerId, {
      includeBanned: true,
    });
    if (!novel) throw new NotFoundError("Aradiginiz novel bulunamadi.");

    if (
      this.isNovelActivelyBanned(novel) &&
      novel.author?.userId !== viewerId
    ) {
      throw new NotFoundError("Aradiginiz novel bulunamadi.");
    }

    const firstPublishedChapterId =
      await this.novelRepo.getFirstPublishedChapterId(id);
    const recommendationRate =
      novel.totalReviewsCount > 0
        ? Math.round(
            (novel.positiveReviewsCount / novel.totalReviewsCount) * 100,
          )
        : null;
    return {
      ...novel,
      author: presentAuthor(novel.author),
      recommendationRate,
      firstPublishedChapterId,
    };
  }

  async getLastUpdatedNovels(
    limit: number = 15,
    allowAdultContent = false,
    viewerId?: string,
  ) {
    const novels = await this.novelRepo.getLastUpdatedNovels(
      Number(limit),
      allowAdultContent,
      viewerId,
    );
    return novels.map((novel) => {
      const author = presentAuthor(novel.author);

      return {
        id: novel.id,
        name: novel.name,
        coverImage: novel.coverImage ?? null,
        lastChapterDate: novel.lastChapterDate ?? null,
        recommendRate: novel.totalReviewsCount
          ? Math.round(
              (novel.positiveReviewsCount / novel.totalReviewsCount) * 100,
            )
          : null,
        chapterCount: novel.chapterCount,
        authorName: author.authorName,
        authorIsDeleted: author.isDeletedUser,
      };
    });
  }

  async getWeeklyTrendingNovels(
    limit: number = 15,
    page: number = 1,
    allowAdultContent = false,
    viewerId?: string,
  ) {
    const maxWeeklyTrendingItems = 200;
    const safeLimit = Math.min(Math.max(Number(limit) || 15, 1), 50);
    const safePage = Math.max(Number(page) || 1, 1);
    const offset = (safePage - 1) * safeLimit;

    if (offset >= maxWeeklyTrendingItems) return [];

    return await this.novelRepo.getWeeklyTrendingNovels(
      Math.min(safeLimit, maxWeeklyTrendingItems - offset),
      safePage,
      allowAdultContent,
      viewerId,
    );
  }

  async getRandomClassicNovels(
    limit: number = 15,
    allowAdultContent = false,
    viewerId?: string,
  ) {
    if (limit > 50) limit = 50;
    return await this.novelRepo.getRandomClassicNovels(
      Number(limit),
      allowAdultContent,
      viewerId,
    );
  }

  async getAllNovelsWithStats() {
    return await this.novelRepo.getAllNovelsWithStats();
  }

  async refreshWeeklyTrendData() {
    const trendData = await this.novelRepo.getWeeklyTrendData();
    const data = trendData.map((item) => {
      return {
        id: item.id,
        weeklyScore: this.calculateWeeklyRankingScore(item),
      };
    });
    await this.novelRepo.bulkUpdateWeeklyScores(data);
    await this.novelRepo.bulkCreateWeeklyRankSnapshots(data, 200);
    await this.novelRepo.deleteOldWeeklyRankSnapshots(2);
  }

  async getNovelsWithTagId(
    tagId: string,
    limit: number = 15,
    allowAdultContent = false,
    viewerId?: string,
  ) {
    if (limit > 50) limit = 50;
    return await this.novelRepo.getNovelsWithTagId(
      tagId,
      limit,
      allowAdultContent,
      viewerId,
    );
  }

  async getLastCreatedNovels(
    limit: number = 15,
    allowAdultContent = false,
    viewerId?: string,
  ) {
    return await this.novelRepo.getLastCreatedNovels(
      limit,
      allowAdultContent,
      viewerId,
    );
  }

  async getSimilarNovels(
    novelId: string,
    limit: number = 10,
    allowAdultContent = false,
    viewerId?: string,
  ) {
    const novelExists = await this.novelRepo.existControl({ id: novelId });
    if (!novelExists) throw new NotFoundError("Roman bulunamadi.");

    return await this.novelRepo.getSimilarNovels(
      novelId,
      limit,
      allowAdultContent,
      viewerId,
    );
  }

  async updateNovelCategories(
    novelId: string,
    categoryIds: number[],
    userId: string,
    isAdmin: boolean,
  ) {
    await this.ensureNovelAccess(novelId, userId, isAdmin);
    await this.ensureNovelCanBeModified(novelId);
    await this.novelRepo.updateNovelCategories(novelId, categoryIds);
  }

  async updateNovelTags(
    novelId: string,
    tagIds: string[],
    userId: string,
    isAdmin: boolean,
  ) {
    await this.ensureNovelAccess(novelId, userId, isAdmin);
    await this.ensureNovelCanBeModified(novelId);
    await this.novelRepo.updateNovelTags(novelId, tagIds);
  }

  incrementViewCount(novelId: string) {
    return this.novelRepo.incrementViewCount(novelId);
  }

  async updateNovel(dto: UpdateNovelDTO, userId: string, isAdmin: boolean) {
    const novelExists = await this.novelRepo.existControl({ id: dto.id });
    if (!novelExists) throw new NotFoundError("...");
    await this.ensureNovelAccess(dto.id, userId, isAdmin);
    await this.ensureNovelCanBeModified(dto.id);

    const updateData = {
      ...dto,
      coverImage: dto.coverImage
        ? await uploadToS3(dto.coverImage, "novel-covers")
        : undefined,
    };

    await this.novelRepo.updateNovel(updateData);
  }

  async deleteNovel(
    novelId: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<void> {
    const novelExists = await this.novelRepo.existControl({ id: novelId });
    if (!novelExists) throw new NotFoundError("Roman bulunamadi.");
    await this.ensureNovelAccess(novelId, userId, isAdmin);
    await this.ensureNovelCanBeModified(novelId);
    await this.novelRepo.deleteNovel(novelId);
  }

  async isOwnerControl(novelId: string, authorId: string): Promise<boolean> {
    return await this.novelRepo.isOwnerControl(novelId, authorId);
  }

  private async ensureNovelAccess(
    novelId: string,
    userId: string,
    isAdmin: boolean,
  ) {
    if (isAdmin) return;
    const isOwner = await this.novelRepo.isOwnerControl(novelId, userId);
    if (!isOwner) {
      throw new ForbiddenError("Bu roman üzerinde işlem yapma yetkiniz yok.");
    }
  }

  private async ensureNovelCanBeModified(novelId: string) {
    if (await this.novelRepo.isActivelyBanned(novelId)) {
      throw new ForbiddenError("Banlı roman üzerinde işlem yapılamaz.");
    }
  }

  private isNovelActivelyBanned(novel: { bannedUntil?: Date | null }) {
    return Boolean(novel.bannedUntil && novel.bannedUntil > new Date());
  }
}
