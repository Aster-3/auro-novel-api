import { ConflictError } from "../errors/conflict.error.js";
import { ForbiddenError } from "../errors/forbidden.error.js";
import { NotFoundError } from "../errors/not.found.error.js";
import { IAuthorRepository } from "../interfaces/author.repo.interface.js";
import { INovelRepository } from "../interfaces/novel.repo.interface.js";
import { INovelService } from "../interfaces/novel.service.interface.js";
import { CreateNovelDTo } from "../schemas/create.novel.schema.js";
import { GetNovelsDTo } from "../schemas/get.novels.schema.js";
import { UpdateNovelDTO } from "../schemas/update.novel.schema.js";
import { uploadToS3 } from "./s3.service.js";

export class NovelService implements INovelService {
  constructor(
    private novelRepo: INovelRepository,
    private authorRepo: IAuthorRepository,
  ) {}

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

  async getNovels(dto: GetNovelsDTo) {
    return this.novelRepo.getNovels(dto);
  }

  async getNovelDetailWithId(id: string) {
    const novel = await this.novelRepo.findOneById(id);
    if (!novel) throw new NotFoundError("Aradiginiz novel bulunamadi.");
    const registeredUser = novel.author?.user;
    const isRegisteredUser = Boolean(registeredUser?.id);
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
      author: {
        id: registeredUser?.id ?? novel.author.id,
        authorName:
          registeredUser?.nickname ?? novel.author.nickname ?? "Unknown Author",
        isRegisteredUser,
        isVerified: novel.author.isVerified,
      },
      recommendationRate,
      firstPublishedChapterId,
    };
  }

  async getLastUpdatedNovels(limit: number = 15) {
    const novels = await this.novelRepo.getLastUpdatedNovels(Number(limit));
    return novels.map((novel) => ({
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
      authorName: novel.author.user
        ? novel.author.user.nickname
        : (novel.author.nickname ?? "Unknown Author"),
    }));
  }

  async getWeeklyTrendingNovels(limit: number = 15) {
    return await this.novelRepo.getWeeklyTrendingNovels(Number(limit));
  }

  async getRandomClassicNovels(limit: number = 15) {
    if (limit > 50) limit = 50;
    return await this.novelRepo.getRandomClassicNovels(Number(limit));
  }

  async getAllNovelsWithStats() {
    return await this.novelRepo.getAllNovelsWithStats();
  }

  async refreshWeeklyTrendData() {
    const trendData = await this.novelRepo.getWeeklyTrendData();
    const data = trendData.map((item) => {
      const { totalReviewsCount, totalReviews } = item;
      return {
        id: item.id,
        weeklyScore: totalReviewsCount - (totalReviews || 0),
      };
    });
    await this.novelRepo.bulkUpdateWeeklyScores(data);
  }

  async getNovelsWithTagId(tagId: string, limit: number = 15) {
    if (limit > 50) limit = 50;
    return await this.novelRepo.getNovelsWithTagId(tagId, limit);
  }

  async getLastCreatedNovels(limit: number = 15) {
    return await this.novelRepo.getLastCreatedNovels(limit);
  }

  async getSimilarNovels(novelId: string, limit: number = 10) {
    const novelExists = await this.novelRepo.existControl({ id: novelId });
    if (!novelExists) throw new NotFoundError("Roman bulunamadi.");

    return await this.novelRepo.getSimilarNovels(novelId, limit);
  }

  async updateNovelCategories(
    novelId: string,
    categoryIds: number[],
    userId: string,
    isAdmin: boolean,
  ) {
    await this.ensureNovelAccess(novelId, userId, isAdmin);
    await this.novelRepo.updateNovelCategories(novelId, categoryIds);
  }

  async updateNovelTags(
    novelId: string,
    tagIds: string[],
    userId: string,
    isAdmin: boolean,
  ) {
    await this.ensureNovelAccess(novelId, userId, isAdmin);
    await this.novelRepo.updateNovelTags(novelId, tagIds);
  }

  incrementViewCount(novelId: string) {
    return this.novelRepo.incrementViewCount(novelId);
  }

  async updateNovel(dto: UpdateNovelDTO, userId: string, isAdmin: boolean) {
    const novelExists = await this.novelRepo.existControl({ id: dto.id });
    if (!novelExists) throw new NotFoundError("...");
    await this.ensureNovelAccess(dto.id, userId, isAdmin);

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
      throw new ForbiddenError("Bu roman uzerinde islem yapma yetkiniz yok.");
    }
  }
}
