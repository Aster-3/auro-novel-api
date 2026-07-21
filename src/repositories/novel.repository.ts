import { Repository, SelectQueryBuilder } from "typeorm";
import { Novel } from "../entities/Novel.js";
import {
  INovelRepository,
  SimilarNovelItem,
} from "../interfaces/novel.repo.interface.js";
import { CreateNovelDTo } from "../schemas/create.novel.schema.js";
import { GetNovelsDTo } from "../schemas/get.novels.schema.js";
import { QueryPageAndLimitDto } from "../schemas/queryPageAndLimitSchema.js";
import { UpdateNovelDTO } from "../schemas/update.novel.schema.js";
import { Chapter, Volume } from "../entities/_index.js";
import { PublicationStatus } from "../constants/chapter.constants.js";
import { SeriesStatus } from "../constants/series.constants.js";
import { calculateRankingScore } from "../utils/calculateNovelRankingScore.js";

export class NovelRepository implements INovelRepository {
  constructor(private novelRepo: Repository<Novel>) {}

  private withVisibleAuthor(query: SelectQueryBuilder<Novel>) {
    return query
      .leftJoin("novel.author", "authorVisibility")
      .leftJoin("authorVisibility.user", "authorUserVisibility")
      .andWhere(
        "(authorVisibility.userId IS NULL OR authorUserVisibility.id IS NOT NULL)",
      );
  }

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
    const { name, authorId, status, limit, page } = dto;
    const query = this.withVisibleAuthor(
      this.novelRepo.createQueryBuilder("novel"),
    )
      .select([
        "novel.id",
        "novel.name",
        "novel.coverImage",
        "novel.status",
        "novel.chapterCount",
        "novel.viewCount",
        "novel.positiveReviewsCount",
        "novel.totalReviewsCount",
      ])
      .skip((page - 1) * limit)
      .take(limit);

    if (name) query.andWhere("novel.name ILIKE :name", { name: `%${name}%` });
    if (authorId) query.andWhere("novel.authorId = :authorId", { authorId });
    if (status && status !== SeriesStatus.DRAFT) {
      query.andWhere("novel.status = :status", { status });
    } else {
      query.andWhere("novel.status != :draft", { draft: SeriesStatus.DRAFT });
    }

    const [novels, total] = await query.getManyAndCount();
    const items = novels.map((novel) => ({
      id: novel.id,
      name: novel.name,
      coverImage: novel.coverImage ?? null,
      status: novel.status,
      chapterCount: novel.chapterCount,
      viewCount: novel.viewCount,
      recommendationRate:
        novel.totalReviewsCount > 0
          ? Math.round(
              (novel.positiveReviewsCount / novel.totalReviewsCount) * 100,
            )
          : null,
    }));
    const totalPage = Math.ceil(total / limit);
    const nextPage = page < totalPage ? page + 1 : null;
    return {
      items,
      total: total,
      nextPage: nextPage,
      currentPage: page,
      lastPage: totalPage,
    };
  }

  async getNovelsByAuthorUserId(userId: string, dto: QueryPageAndLimitDto) {
    const { limit, page } = dto;
    const query = this.novelRepo
      .createQueryBuilder("novel")
      .innerJoin("novel.author", "author")
      .select([
        "novel.id",
        "novel.name",
        "novel.coverImage",
        "novel.status",
        "novel.chapterCount",
        "novel.viewCount",
        "novel.positiveReviewsCount",
        "novel.totalReviewsCount",
      ])
      .where("author.userId = :userId", { userId })
      .skip((page - 1) * limit)
      .take(limit);

    const [novels, total] = await query.getManyAndCount();

    const items = novels.map((novel) => ({
      id: novel.id,
      name: novel.name,
      coverImage: novel.coverImage ?? null,
      status: novel.status,
      chapterCount: novel.chapterCount,
      viewCount: novel.viewCount,
      recommendationRate:
        novel.totalReviewsCount > 0
          ? Math.round(
              (novel.positiveReviewsCount / novel.totalReviewsCount) * 100,
            )
          : null,
    }));
    const totalPage = Math.ceil(total / limit);
    const nextPage = page < totalPage ? page + 1 : null;
    return {
      items,
      total,
      nextPage,
      currentPage: page,
      lastPage: totalPage,
    };
  }

  async findOneById(id: string) {
    return this.withVisibleAuthor(
      this.novelRepo.createQueryBuilder("novel"),
    )
      .leftJoinAndSelect("novel.author", "author")
      .leftJoinAndSelect("author.user", "authorUser")
      .leftJoinAndSelect("novel.tags", "tags")
      .leftJoinAndSelect("novel.categories", "categories")
      .where("novel.id = :id", { id })
      .andWhere(
        "(authorVisibility.userId IS NULL OR authorUserVisibility.id IS NOT NULL)",
      )
      .getOne();
  }

  async getLastUpdatedNovels(limit: number): Promise<Novel[]> {
    return this.withVisibleAuthor(
      this.novelRepo.createQueryBuilder("novel"),
    )
      .leftJoinAndSelect("novel.author", "author")
      .leftJoinAndSelect("author.user", "authorUser")
      .where("novel.status != :draft", { draft: SeriesStatus.DRAFT })
      .andWhere(
        "(authorVisibility.userId IS NULL OR authorUserVisibility.id IS NOT NULL)",
      )
      .select([
        "novel.id",
        "novel.name",
        "novel.coverImage",
        "novel.rankingScore",
        "novel.totalReviewsCount",
        "novel.positiveReviewsCount",
        "novel.chapterCount",
        "novel.lastChapterDate",
        "author.id",
        "author.nickname",
        "author.isVerified",
        "authorUser.id",
        "authorUser.nickname",
      ])
      .orderBy("novel.lastChapterDate", "DESC", "NULLS LAST")
      .take(limit)
      .getMany();
  }

  async getAllNovelsWithStats() {
    return this.novelRepo.find({
      select: {
        id: true,
        viewCount: true,
        totalReviewsCount: true,
        positiveReviewsCount: true,
        totalLibraryCount: true,
      },
    });
  }

  async getFirstPublishedChapterId(novelId: string) {
    const firstPublishedChapter = await this.novelRepo.manager
      .createQueryBuilder("ChapterPublication", "pub")
      .innerJoin("pub.chapter", "chapter")
      .innerJoin("pub.volume", "volume")
      .where("chapter.novelId = :novelId", { novelId })
      .andWhere("pub.publicationStatus = :published", {
        published: PublicationStatus.PUBLISHED,
      })
      .orderBy("volume.orderIndex", "ASC")
      .addOrderBy("pub.orderIndex", "ASC")
      .select("pub.chapterId", "chapterId")
      .getRawOne<{ chapterId: string }>();

    return firstPublishedChapter?.chapterId ?? null;
  }

  async getWeeklyTrendingNovels(limit: number): Promise<Novel[]> {
    return this.withVisibleAuthor(
      this.novelRepo.createQueryBuilder("novel"),
    )
      .select([
        "novel.id",
        "novel.name",
        "novel.coverImage",
        "novel.weeklyRankingScore",
      ])
      .where("novel.status != :draft", { draft: SeriesStatus.DRAFT })
      .andWhere(
        "(authorVisibility.userId IS NULL OR authorUserVisibility.id IS NOT NULL)",
      )
      .orderBy("novel.weeklyRankingScore", "DESC")
      .take(limit)
      .getMany();
  }

  async getNovelsWithTagId(tagId: string, limit: number): Promise<Novel[]> {
    return this.withVisibleAuthor(
      this.novelRepo.createQueryBuilder("novel"),
    )
      .innerJoin("novel.tags", "tag", "tag.id = :tagId", { tagId })
      .andWhere("novel.status != :draft", { draft: SeriesStatus.DRAFT })
      .select([
        "novel.id",
        "novel.name",
        "novel.coverImage",
        "novel.rankingScore",
      ])
      .orderBy("novel.rankingScore", "DESC")
      .take(limit)
      .getMany();
  }

  async getLastCreatedNovels(limit: number): Promise<Novel[]> {
    return this.withVisibleAuthor(
      this.novelRepo.createQueryBuilder("novel"),
    )
      .select(["novel.id", "novel.name", "novel.coverImage", "novel.createdAt"])
      .where("novel.status != :draft", { draft: SeriesStatus.DRAFT })
      .andWhere(
        "(authorVisibility.userId IS NULL OR authorUserVisibility.id IS NOT NULL)",
      )
      .orderBy("novel.createdAt", "DESC")
      .take(limit)
      .getMany();
  }

  async getSimilarNovels(
    novelId: string,
    limit: number,
  ): Promise<SimilarNovelItem[]> {
    const sourceNovel = await this.withVisibleAuthor(
      this.novelRepo.createQueryBuilder("novel"),
    )
      .leftJoinAndSelect("novel.tags", "sourceTag")
      .leftJoinAndSelect("novel.categories", "sourceCategory")
      .where("novel.id = :novelId", { novelId })
      .andWhere(
        "(authorVisibility.userId IS NULL OR authorUserVisibility.id IS NOT NULL)",
      )
      .getOne();

    if (!sourceNovel) return [];

    const tagIds = sourceNovel.tags?.map((tag) => tag.id) ?? [];
    const categoryIds =
      sourceNovel.categories?.map((category) => category.id) ?? [];

    const sharedTagCountExpression = tagIds.length
      ? "COUNT(DISTINCT CASE WHEN tag.id IN (:...tagIds) THEN tag.id END)"
      : "0";
    const sharedCategoryCountExpression = categoryIds.length
      ? "COUNT(DISTINCT CASE WHEN category.id IN (:...categoryIds) THEN category.id END)"
      : "0";
    const similarityScoreExpression = `
      (${sharedTagCountExpression} * 5) +
      (${sharedCategoryCountExpression} * 3) +
      (CASE WHEN novel.type = :type THEN 2 ELSE 0 END) +
      (LEAST(novel."rankingScore", 100) * 0.05) +
      (COALESCE(novel."weeklyRankingScore", 0) * 0.05) +
      (LN(novel."totalLibraryCount" + 1) * 0.5) +
      (CASE WHEN novel."totalReviewsCount" > 0 THEN novel."positiveReviewsCount"::float / novel."totalReviewsCount" ELSE 0 END)
    `;

    const query = this.novelRepo
      .createQueryBuilder("novel")
      .leftJoin("novel.author", "author")
      .leftJoin("author.user", "authorUser")
      .leftJoin("novel.tags", "tag")
      .leftJoin("novel.categories", "category")
      .select("novel.id", "id")
      .addSelect("novel.name", "name")
      .addSelect("novel.coverImage", "coverImage")
      .addSelect(sharedTagCountExpression, "sharedTagCount")
      .addSelect(sharedCategoryCountExpression, "sharedCategoryCount")
      .addSelect(similarityScoreExpression, "similarityScore")
      .where("novel.id != :novelId", { novelId })
      .andWhere("(author.userId IS NULL OR authorUser.id IS NOT NULL)")
      .andWhere("novel.status != :draft", { draft: SeriesStatus.DRAFT })
      .andWhere("novel.isBanned = false")
      .andWhere("novel.isAdultContent = :isAdultContent", {
        isAdultContent: sourceNovel.isAdultContent,
      })
      .groupBy("novel.id")
      .orderBy('"similarityScore"', "DESC")
      .addOrderBy('"sharedTagCount"', "DESC")
      .addOrderBy('"sharedCategoryCount"', "DESC")
      .addOrderBy('novel."rankingScore"', "DESC")
      .limit(limit)
      .setParameters({
        type: sourceNovel.type,
        tagIds,
        categoryIds,
      });

    const rows = await query.getRawMany<{
      id: string;
      name: string;
      coverImage: string | null;
    }>();

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      coverImage: row.coverImage ?? null,
    }));
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
      .select(["novel.id", "novel.totalReviewsCount", "stats.totalReviews"])
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
      .returning(["totalReviewsCount", "positiveReviewsCount"])
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
}
