import { FindOptionsWhere, ILike, Not, Repository } from "typeorm";
import { Novel } from "../entities/Novel.js";
import { INovelRepository } from "../interfaces/novel.repo.interface.js";
import { CreateNovelDTo } from "../schemas/create.novel.schema.js";
import { GetNovelsDTo } from "../schemas/get.novels.schema.js";
import { UpdateNovelDTO } from "../schemas/update.novel.schema.js";
import { Chapter, Volume } from "../entities/_index.js";
import { PublicationStatus } from "../constants/chapter.constants.js";
import { SeriesStatus } from "../constants/series.constants.js";
import { calculateRankingScore } from "../utils/calculateNovelRankingScore.js";

export class NovelRepository implements INovelRepository {
  constructor(private novelRepo: Repository<Novel>) {}

  async create(createNovelDto: CreateNovelDTo) {
    return await this.novelRepo.manager.transaction(async (manager) => {
      const newNovel = manager.create(Novel, createNovelDto);
      const savedNovel = await manager.save(newNovel);

      const firstVolume = manager.create(Volume, {
        title: "Cilt 1",
        orderIndex: 1,
        novelId: savedNovel.id,
      });

      await manager.save(firstVolume);

      return savedNovel;
    });
  }

  async existControl(identifier: { id?: string; slug?: string }) {
    const { id, slug } = identifier;

    if (!id && !slug) {
      throw new Error(
        "Sorgu hatası: 'id' veya 'slug' parametrelerinden en az biri tanımlı olmalıdır",
      );
    }

    const queryCondition = id ? { id } : { slug };

    return await this.novelRepo.exists({
      where: queryCondition,
    });
  }

  async getNovels(dto: GetNovelsDTo) {
    const { name, status, limit, page } = dto;
    const where: FindOptionsWhere<Novel> = {};
    if (name) where.name = ILike(`%${name}%`);
    if (status) where.status = status;

    const [novels, total] = await this.novelRepo.findAndCount({
      where: where,
      select: {
        id: true,
        name: true,
        coverImage: true,
      },
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalPage = Math.ceil(total / limit);
    const nextPage = page < totalPage ? page + 1 : null;
    return {
      items: novels,
      total: total,
      nextPage: nextPage,
      currentPage: page,
      lastPage: totalPage,
    };
  }

  async findOneById(id: string) {
    return this.novelRepo.findOne({
      where: { id },
      select: {
        id: true,
        name: true,
        coverImage: true,
        synopsis: true,
        status: true,
        positiveReviewsCount: true,
        totalReviewsCount: true,
        viewCount: true,
        rankingScore: true,
        sourceType: true,
        chapterFreemiumPrice: true,
        chapterPremiumPrice: true,
        format: true,
        totalSales: true,
        chapterCount: true,
        lastChapterDate: true,
        author: {
          id: true,
          nickname: true,
          user: { id: true, nickname: true },
        },
        categories: { id: true, trName: true, enName: true },
        tags: { id: true, name: true },
      },
      relations: {
        author: {
          user: true,
        },
        tags: true,
        categories: true,
      },
    });
  }

  async getLastUpdatedNovels(limit: number): Promise<Novel[]> {
    return this.novelRepo.find({
      order: {
        lastChapterDate: {
          direction: "DESC",
          nulls: "LAST",
        },
      },
      take: limit,
      where: {
        status: Not(SeriesStatus.DRAFT),
      },
      select: {
        id: true,
        name: true,
        coverImage: true,
        author: {
          id: true,
          nickname: true,
          user: { id: true, nickname: true },
        },
        rankingScore: true,
        totalReviewsCount: true,
        positiveReviewsCount: true,
        chapterCount: true,
        lastChapterDate: true,
      },
      relations: { author: { user: true } },
    });
  }

  async getAllNovelsWithStats() {
    return this.novelRepo.find({
      select: {
        id: true,
        viewCount: true,
        totalReviewsCount: true,
        positiveReviewsCount: true,
        totalSales: true,
      },
    });
  }

  async getWeeklyTrendingNovels(limit: number): Promise<Novel[]> {
    return this.novelRepo.find({
      select: {
        id: true,
        name: true,
        coverImage: true,
        weeklyRankingScore: true,
      },
      order: {
        weeklyRankingScore: "DESC",
      },
    });
  }

  async getNovelsWithTagId(tagId: string, limit: number): Promise<Novel[]> {
    return this.novelRepo.find({
      where: {
        tags: {
          id: tagId,
        },
      },
      select: {
        id: true,
        name: true,
        coverImage: true,
        rankingScore: true,
      },
      order: {
        rankingScore: "DESC",
      },
      take: limit,
    });
  }

  async getLastCreatedNovels(limit: number): Promise<Novel[]> {
    return this.novelRepo.find({
      order: {
        createdAt: "DESC",
      },
      take: limit,
      where: {
        status: Not(SeriesStatus.DRAFT),
      },
      select: {
        id: true,
        name: true,
        coverImage: true,
      },
    });
  }

  async getWeeklyTrendData(): Promise<any[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateString = sevenDaysAgo.toISOString().split("T")[0];

    return await this.novelRepo
      .createQueryBuilder("novel")
      .leftJoin(
        "novel_daily_stats",
        "stats",
        "stats.novelId = novel.id AND stats.recordedAt = :dateString",
        { dateString },
      )
      .select([
        "novel.id",
        "novel.totalReviewsCount",
        "novel.totalSales",
        "stats.totalReviews",
        "stats.totalPurchases",
      ])
      .getRawMany();
  }

  async bulkUpdateWeeklyScores(data: { id: string; weeklyScore: number }[]) {
    await this.novelRepo
      .createQueryBuilder()
      .insert()
      .into(Novel)
      .values(
        data.map((item) => ({
          id: item.id,
          weeklyRankingScore: item.weeklyScore,
        })),
      )
      .orUpdate(["weeklyRankingScore"], ["id"])
      .execute();
  }

  async updateRankingScore(novelId: string, newRankingScore: number) {
    await this.novelRepo.update(novelId, { rankingScore: newRankingScore });
  }

  async incrementAndDecrementReviewCount(
    novelId: string,
    isIncrement: boolean,
    isPositive: boolean,
  ) {
    const change = isIncrement ? 1 : -1;

    const updateSet: any = {
      totalReviewsCount: () => `totalReviewsCount + ${change}`,
    };

    if (isPositive) {
      updateSet.positiveReviewsCount = () => `positiveReviewsCount + ${change}`;
    }

    const result = await this.novelRepo
      .createQueryBuilder()
      .update(Novel)
      .set(updateSet)
      .where("id = :id", { id: novelId })
      .returning(["totalReviewsCount", "positiveReviewsCount", "totalSales"])
      .execute();

    return result.raw[0];
  }

  async updateNovelCategories(novelId: string, categoryIds: number[]) {
    const categories = categoryIds.map((id) => ({ id }));
    await this.novelRepo.save({
      id: novelId,
      categories: categories,
    } as any);
  }

  async updateNovelTags(novelId: string, tagIds: string[]) {
    const tags = tagIds.map((id) => ({ id }));
    await this.novelRepo.save({
      id: novelId,
      tags: tags,
    } as any);
  }

  updateGlobalPopularityScores() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  }

  async incrementViewCount(novelId: string) {
    await this.novelRepo.increment({ id: novelId }, "viewCount", 1);
  }

  async incrementTotalSales(novelId: string): Promise<void> {
    await this.novelRepo.increment({ id: novelId }, "totalSales", 1);
  }

  async updateNovel(dto: UpdateNovelDTO) {
    const { id, ...updateData } = dto;
    const partialEntity = {
      ...updateData,
      categories: updateData.categories?.map((catId) => ({ id: catId })),
      tags: updateData.tags?.map((tagId) => ({ id: tagId })),
    };

    await this.novelRepo.save({ id: id, ...partialEntity });
  }

  async isOwnerControl(novelId: string, authorId: string): Promise<boolean> {
    if (!authorId || !novelId) {
      return false;
    }

    return await this.novelRepo.exists({
      where: {
        id: novelId,
        author: {
          user: { id: authorId },
        },
      },
    });
  }

  async deleteNovel(novelId: string): Promise<void> {
    await this.novelRepo.delete(novelId);
  }

  async refreshChapterStats(novelId: string): Promise<void> {
    const stats = await this.novelRepo.manager
      .createQueryBuilder("ChapterPublication", "pub")
      .innerJoin("pub.chapter", "ch")
      .where("ch.novelId = :novelId", { novelId })
      .andWhere("pub.publicationStatus = :status", {
        status: PublicationStatus.PUBLISHED,
      })
      .select("COUNT(pub.chapterId)", "count")
      .addSelect('MAX(pub."publishedAt")', "lastDate")
      .getRawOne();

    await this.novelRepo.update(novelId, {
      chapterCount: parseInt(stats.count) || 0,
      lastChapterDate: stats.lastDate || null,
    });
  }

  async getPaywallConfig(novelId: string) {
    const novel = await this.novelRepo.findOne({
      where: { id: novelId },
      select: {
        id: true,
        paywallStartVolume: true,
        paywallStartChapter: true,
        author: {
          id: true,
          user: { id: true },
        },
      },
      relations: {
        author: {
          user: true,
        },
      },
    });
    if (!novel) return null;
    return {
      paywallStartVolume: novel.paywallStartVolume,
      paywallStartChapter: novel.paywallStartChapter,
      author: {
        user: {
          id: novel.author?.user?.id || null,
        },
      },
    };
  }
}
