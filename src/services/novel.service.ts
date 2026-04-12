import { INovelRepository } from "../interfaces/novel.repo.interface.js";
import { INovelService } from "../interfaces/novel.service.interface.js";
import { CreateNovelDTo } from "../schemas/create.novel.schema.js";
import { ConflictError } from "../errors/conflict.error.js";
import { GetNovelsDTo } from "../schemas/get.novels.schema.js";
import { NotFoundError } from "../errors/not.found.error.js";
import { UpdateNovelDTO } from "../schemas/update.novel.schema.js";
import { IAuthorRepository } from "../interfaces/author.repo.interface.js";
import { uploadToS3 } from "./s3.service.js";
import { Novel } from "../entities/_index.js";
import { da } from "@faker-js/faker";

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

    if (isSlugTaken)
      throw new ConflictError("slug", "Bu slug zaten kullanımda.");

    const novelData = { ...dto };

    if (!isAdmin) {
      const author = await this.authorRepo.findByUserId(dto.authorId);

      if (!author) {
        throw new NotFoundError("Yazar bulunamadı.");
      }

      novelData.authorId = author.id;
    } else {
      const isAuthorAvailable = await this.authorRepo.existControlAuthorId(
        dto.authorId,
      );

      if (!isAuthorAvailable) {
        throw new NotFoundError("Yazar bulunamadı.");
      }
    }

    if (file) {
      const fileUrl = await uploadToS3(file, "novel-covers");
      novelData.coverImage = fileUrl;
    }

    return this.novelRepo.create(novelData);
  }

  async getNovels(dto: GetNovelsDTo) {
    return this.novelRepo.getNovels(dto);
  }

  async getNovelDetailWithId(id: string) {
    const novel = await this.novelRepo.findOneById(id);
    if (!novel) throw new NotFoundError("Aradığınız novel bulunamadı.");
    const recommendationRate =
      novel.totalReviewsCount > 0
        ? Math.round(
            (novel.positiveReviewsCount / novel.totalReviewsCount) * 100,
          )
        : null;
    return { ...novel, recommendationRate };
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

  async getAllNovelsWithStats() {
    return await this.novelRepo.getAllNovelsWithStats();
  }

  async refreshWeeklyTrendData() {
    const trendData = await this.novelRepo.getWeeklyTrendData();
    const data = trendData.map((item) => {
      const { totalReviewsCount, totalSales, totalReviews, totalPurchases } =
        item;
      const diffReviews = totalReviewsCount - (totalReviews || 0);
      const diffSales = totalSales - (totalPurchases || 0);
      const weeklyScore = diffReviews * 0.7 + diffSales * 0.3; // Basit bir ağırlıklı formül
      return {
        id: item.id,
        weeklyScore,
      };
    });
    await this.novelRepo.bulkUpdateWeeklyScores(data);
  }

  async getNovelsWithTagId(tagId: string, limit: number = 15) {
    if (limit > 50) limit = 50;
    console.log("Tag ID:", tagId); // Debug: Tag ID'yi kontrol et
    return await this.novelRepo.getNovelsWithTagId(tagId, limit);
  }

  async getLastCreatedNovels(limit: number = 15) {
    return await this.novelRepo.getLastCreatedNovels(limit);
  }

  async updateNovelCategories(novelId: string, categoryIds: number[]) {
    await this.novelRepo.updateNovelCategories(novelId, categoryIds);
  }

  async updateNovelTags(novelId: string, tagIds: string[]) {
    await this.novelRepo.updateNovelTags(novelId, tagIds);
  }

  incrementViewCount(novelId: string) {
    return this.novelRepo.incrementViewCount(novelId);
  }

  async updateNovel(dto: UpdateNovelDTO) {
    const novelExists = await this.novelRepo.existControl({ id: dto.id });
    if (!novelExists) throw new NotFoundError("...");

    // Yeni bir obje oluşturup alanları elle eşliyoruz (Mapping)
    const updateData = {
      ...dto,
      coverImage: dto.coverImage
        ? await uploadToS3(dto.coverImage, "novel-covers")
        : undefined,
    };

    await this.novelRepo.updateNovel(updateData);
  }

  async deleteNovel(novelId: string): Promise<void> {
    await this.novelRepo.deleteNovel(novelId);
  }

  async isOwnerControl(novelId: string, authorId: string): Promise<boolean> {
    return await this.novelRepo.isOwnerControl(novelId, authorId);
  }
}
