import { Repository, SelectQueryBuilder } from "typeorm";
import { Novel } from "../entities/Novel.js";
import {
  INovelRepository,
  NovelListItem,
  SimilarNovelItem,
  WeeklyRankStatus,
  WeeklyTrendingNovelItem,
} from "../interfaces/novel.repo.interface.js";
import { CreateNovelDTo } from "../schemas/create.novel.schema.js";
import { GetNovelsDTo } from "../schemas/get.novels.schema.js";
import { QueryPageAndLimitDto } from "../schemas/queryPageAndLimitSchema.js";
import { UpdateNovelDTO } from "../schemas/update.novel.schema.js";
import { Chapter, NovelWeeklyRankSnapshot, Volume } from "../entities/_index.js";
import { NovelType, SeriesStatus } from "../constants/series.constants.js";
import { calculateRankingScore } from "../utils/calculateNovelRankingScore.js";
import { applyAdultContentFilter } from "../utils/adult.content.visibility.js";
import { applyBlockedUserVisibilityFilter } from "../utils/user.block.visibility.js";
import { getIstanbulDateString } from "../utils/date.string.js";

export class NovelRepository implements INovelRepository {
  constructor(private novelRepo: Repository<Novel>) {}

  private getTodayDateString() {
    return getIstanbulDateString();
  }

  private toNovelListItem(
    novel: Novel,
    options: { includeModeration?: boolean } = {},
  ): NovelListItem {
    const item: NovelListItem = {
      id: novel.id,
      name: novel.name,
      coverImage: novel.coverImage ?? null,
      synopsis: novel.synopsis ?? null,
      status: novel.status,
      chapterCount: novel.chapterCount,
      averageChapterWordCount: novel.averageChapterWordCount,
      viewCount: novel.viewCount,
      totalReviewsCount: novel.totalReviewsCount,
      recommendationRate:
        novel.totalReviewsCount > 0
          ? Math.round(
              (novel.positiveReviewsCount / novel.totalReviewsCount) * 100,
            )
          : null,
    };

    if (options.includeModeration) {
      item.bannedUntil = novel.bannedUntil ?? null;
      item.banReason = novel.banReason ?? null;
    }

    return item;
  }

  private withVisibleAuthor(query: SelectQueryBuilder<Novel>) {
    return query
      .leftJoin("novel.author", "authorVisibility")
      .leftJoin("authorVisibility.user", "authorUserVisibility");
  }

  private applyActiveBanFilter(query: SelectQueryBuilder<Novel>) {
    return query.andWhere(
      '(novel."bannedUntil" IS NULL OR novel."bannedUntil" <= NOW())',
    );
  }

  private getRankStatus(rankChange: number | null): WeeklyRankStatus {
    if (rankChange === null) return "new";
    if (rankChange > 0) return "up";
    if (rankChange < 0) return "down";
    return "same";
  }

  private async getPreviousWeeklyRanks(novelIds: string[]) {
    if (!novelIds.length) return new Map<string, number>();

    const snapshotRepo = this.novelRepo.manager.getRepository(
      NovelWeeklyRankSnapshot,
    );
    const latestSnapshot = await snapshotRepo
      .createQueryBuilder("snapshot")
      .select('MAX(snapshot."recordedAt")', "recordedAt")
      .getRawOne<{ recordedAt: string | null }>();

    if (!latestSnapshot?.recordedAt) return new Map<string, number>();

    const previousSnapshot = await snapshotRepo
      .createQueryBuilder("snapshot")
      .select('MAX(snapshot."recordedAt")', "recordedAt")
      .where('snapshot."recordedAt" < :latestRecordedAt', {
        latestRecordedAt: latestSnapshot.recordedAt,
      })
      .getRawOne<{ recordedAt: string | null }>();

    if (!previousSnapshot?.recordedAt) return new Map<string, number>();

    const rows = await snapshotRepo
      .createQueryBuilder("snapshot")
      .select('snapshot."novelId"', "novelId")
      .addSelect('snapshot."rank"', "rank")
      .where('snapshot."recordedAt" = :recordedAt', {
        recordedAt: previousSnapshot.recordedAt,
      })
      .andWhere('snapshot."novelId" IN (:...novelIds)', { novelIds })
      .getRawMany<{ novelId: string; rank: number }>();

    return new Map(rows.map((row) => [row.novelId, Number(row.rank)]));
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

  async isActivelyBanned(novelId: string) {
    return this.novelRepo
      .createQueryBuilder("novel")
      .where("novel.id = :novelId", { novelId })
      .andWhere('novel."bannedUntil" > NOW()')
      .getExists();
  }

  async getNovels(
    dto: GetNovelsDTo,
    allowAdultContent = false,
    viewerId?: string,
  ) {
    const { name, authorId, status, limit, page } = dto;
    const query = this.withVisibleAuthor(
      this.novelRepo.createQueryBuilder("novel"),
    )
      .select([
        "novel.id",
        "novel.name",
        "novel.coverImage",
        "novel.synopsis",
        "novel.status",
        "novel.chapterCount",
        "novel.averageChapterWordCount",
        "novel.viewCount",
        "novel.positiveReviewsCount",
        "novel.totalReviewsCount",
      ])
      .skip((page - 1) * limit)
      .take(limit);
    applyAdultContentFilter(query, allowAdultContent);
    this.applyActiveBanFilter(query);
    applyBlockedUserVisibilityFilter(query, viewerId, "authorUserVisibility");

    if (name) query.andWhere("novel.name ILIKE :name", { name: `%${name}%` });
    if (authorId) query.andWhere("novel.authorId = :authorId", { authorId });
    if (status && status !== SeriesStatus.DRAFT) {
      query.andWhere("novel.status = :status", { status });
    } else {
      query.andWhere("novel.status != :draft", { draft: SeriesStatus.DRAFT });
    }

    const [novels, total] = await query.getManyAndCount();
    const items = novels.map((novel) => this.toNovelListItem(novel));
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

  async getNovelsByAuthorUserId(
    userId: string,
    dto: QueryPageAndLimitDto,
    viewerId?: string,
  ) {
    const { limit, page } = dto;
    const query = this.novelRepo
      .createQueryBuilder("novel")
      .innerJoin("novel.author", "author")
      .leftJoin("author.user", "authorUser")
      .select([
        "novel.id",
        "novel.name",
        "novel.coverImage",
        "novel.synopsis",
        "novel.status",
        "novel.chapterCount",
        "novel.averageChapterWordCount",
        "novel.bannedUntil",
        "novel.banReason",
        "novel.viewCount",
        "novel.positiveReviewsCount",
        "novel.totalReviewsCount",
      ])
      .where("author.userId = :userId", { userId })
      .skip((page - 1) * limit)
      .take(limit);
    applyBlockedUserVisibilityFilter(query, viewerId, "authorUser");

    const [novels, total] = await query.getManyAndCount();

    const items = novels.map((novel) =>
      this.toNovelListItem(novel, { includeModeration: true }),
    );
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

  async getRecentNovelsByAuthorId(
    authorId: string,
    limit: number,
    allowAdultContent = false,
    viewerId?: string,
  ) {
    const query = this.withVisibleAuthor(
      this.novelRepo.createQueryBuilder("novel"),
    )
      .select([
        "novel.id",
        "novel.name",
        "novel.coverImage",
        "novel.synopsis",
        "novel.status",
        "novel.chapterCount",
        "novel.averageChapterWordCount",
        "novel.viewCount",
        "novel.positiveReviewsCount",
        "novel.totalReviewsCount",
        "novel.createdAt",
      ])
      .andWhere("novel.authorId = :authorId", { authorId })
      .andWhere("novel.status != :draft", { draft: SeriesStatus.DRAFT })
      .orderBy("novel.createdAt", "DESC")
      .take(limit);
    applyAdultContentFilter(query, allowAdultContent);
    this.applyActiveBanFilter(query);
    applyBlockedUserVisibilityFilter(query, viewerId, "authorUserVisibility");

    const [novels, total] = await query.getManyAndCount();

    return {
      items: novels.map((novel) => this.toNovelListItem(novel)),
      total,
    };
  }

  async findOneById(
    id: string,
    viewerId?: string,
    options: { includeBanned?: boolean } = {},
  ) {
    const query = this.withVisibleAuthor(
      this.novelRepo.createQueryBuilder("novel"),
    )
      .leftJoinAndSelect("novel.author", "author")
      .leftJoinAndSelect("author.user", "authorUser")
      .leftJoinAndSelect("novel.tags", "tags")
      .leftJoinAndSelect("novel.categories", "categories")
      .where("novel.id = :id", { id });

    applyBlockedUserVisibilityFilter(query, viewerId, "authorUser");
    if (!options.includeBanned) {
      this.applyActiveBanFilter(query);
    }

    return query.getOne();
  }

  async getCoverImageById(id: string) {
    const novel = await this.novelRepo.findOne({
      where: { id },
      select: { id: true, coverImage: true },
    });
    return novel?.coverImage;
  }

  async getLastUpdatedNovels(
    limit: number,
    allowAdultContent = false,
    viewerId?: string,
  ): Promise<Novel[]> {
    const query = this.withVisibleAuthor(
      this.novelRepo.createQueryBuilder("novel"),
    )
      .leftJoinAndSelect("novel.author", "author")
      .leftJoinAndSelect("author.user", "authorUser")
      .where("novel.status != :draft", { draft: SeriesStatus.DRAFT })
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
        "author.userId",
        "author.isVerified",
        "authorUser.id",
        "authorUser.nickname",
      ])
      .orderBy("novel.lastChapterDate", "DESC", "NULLS LAST")
      .take(limit);
    applyAdultContentFilter(query, allowAdultContent);
    this.applyActiveBanFilter(query);
    applyBlockedUserVisibilityFilter(query, viewerId, "authorUser");
    return query.getMany();
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
      .orderBy("volume.orderIndex", "ASC")
      .addOrderBy("pub.sortKey", "ASC")
      .select("pub.chapterId", "chapterId")
      .getRawOne<{ chapterId: string }>();

    return firstPublishedChapter?.chapterId ?? null;
  }

  async getWeeklyTrendingNovels(
    limit: number,
    page: number = 1,
    allowAdultContent = false,
    viewerId?: string,
  ): Promise<WeeklyTrendingNovelItem[]> {
    const offset = (page - 1) * limit;
    const query = this.withVisibleAuthor(
      this.novelRepo.createQueryBuilder("novel"),
    )
      .select([
        "novel.id",
        "novel.name",
        "novel.coverImage",
        "novel.weeklyRankingScore",
      ])
      .where("novel.status != :draft", { draft: SeriesStatus.DRAFT })
      .orderBy("novel.weeklyRankingScore", "DESC")
      .addOrderBy("novel.id", "ASC")
      .skip(offset)
      .take(limit);
    applyAdultContentFilter(query, allowAdultContent);
    this.applyActiveBanFilter(query);
    applyBlockedUserVisibilityFilter(query, viewerId, "authorUserVisibility");

    const novels = await query.getMany();
    const previousRanks = await this.getPreviousWeeklyRanks(
      novels.map((novel) => novel.id),
    );

    return novels.map((novel, index) => {
      const rank = offset + index + 1;
      const previousRank = previousRanks.get(novel.id) ?? null;
      const rankChange = previousRank === null ? null : previousRank - rank;

      return {
        id: novel.id,
        name: novel.name,
        coverImage: novel.coverImage ?? null,
        weeklyRankingScore: Number(novel.weeklyRankingScore),
        rank,
        previousRank,
        rankChange,
        rankStatus: this.getRankStatus(rankChange),
      };
    });
  }

  async getRandomClassicNovels(
    limit: number,
    allowAdultContent = false,
    viewerId?: string,
  ): Promise<Novel[]> {
    const poolLimit = Math.max(limit * 4, 30);

    const candidatesQuery = this.withVisibleAuthor(
      this.novelRepo.createQueryBuilder("novel"),
    )
      .select([
        "novel.id",
        "novel.name",
        "novel.coverImage",
        "novel.rankingScore",
        "novel.totalLibraryCount",
        "novel.totalReviewsCount",
      ])
      .where("novel.status != :draft", { draft: SeriesStatus.DRAFT })
      .andWhere("novel.type = :type", { type: NovelType.CLASSIC })
      .orderBy("novel.rankingScore", "DESC")
      .addOrderBy("novel.totalLibraryCount", "DESC")
      .addOrderBy("novel.totalReviewsCount", "DESC")
      .take(poolLimit);
    applyAdultContentFilter(candidatesQuery, allowAdultContent);
    this.applyActiveBanFilter(candidatesQuery);
    applyBlockedUserVisibilityFilter(
      candidatesQuery,
      viewerId,
      "authorUserVisibility",
    );
    const candidates = await candidatesQuery.getMany();

    return candidates
      .sort(() => Math.random() - 0.5)
      .slice(0, limit)
      .map((novel) => ({
        id: novel.id,
        name: novel.name,
        coverImage: novel.coverImage,
      })) as Novel[];
  }

  async getNovelsWithTagId(
    tagId: string,
    limit: number,
    allowAdultContent = false,
    viewerId?: string,
  ): Promise<Novel[]> {
    const query = this.withVisibleAuthor(
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
      .take(limit);
    applyAdultContentFilter(query, allowAdultContent);
    this.applyActiveBanFilter(query);
    applyBlockedUserVisibilityFilter(query, viewerId, "authorUserVisibility");
    return query.getMany();
  }

  async getLastCreatedNovels(
    limit: number,
    allowAdultContent = false,
    viewerId?: string,
  ): Promise<Novel[]> {
    const query = this.withVisibleAuthor(
      this.novelRepo.createQueryBuilder("novel"),
    )
      .select(["novel.id", "novel.name", "novel.coverImage", "novel.createdAt"])
      .where("novel.status != :draft", { draft: SeriesStatus.DRAFT })
      .orderBy("novel.createdAt", "DESC")
      .take(limit);
    applyAdultContentFilter(query, allowAdultContent);
    this.applyActiveBanFilter(query);
    applyBlockedUserVisibilityFilter(query, viewerId, "authorUserVisibility");
    return query.getMany();
  }

  async getSimilarNovels(
    novelId: string,
    limit: number,
    allowAdultContent = false,
    viewerId?: string,
  ): Promise<SimilarNovelItem[]> {
    const sourceNovelQuery = this.withVisibleAuthor(
      this.novelRepo.createQueryBuilder("novel"),
    )
      .leftJoinAndSelect("novel.tags", "sourceTag")
      .leftJoinAndSelect("novel.categories", "sourceCategory")
      .where("novel.id = :novelId", { novelId });

    applyBlockedUserVisibilityFilter(
      sourceNovelQuery,
      viewerId,
      "authorUserVisibility",
    );
    this.applyActiveBanFilter(sourceNovelQuery);

    const sourceNovel = await sourceNovelQuery.getOne();

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
      .andWhere("novel.status != :draft", { draft: SeriesStatus.DRAFT })
      .andWhere('(novel."bannedUntil" IS NULL OR novel."bannedUntil" <= NOW())')
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
    applyAdultContentFilter(query, allowAdultContent);
    applyBlockedUserVisibilityFilter(query as any, viewerId, "authorUser");

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
    const dateString = getIstanbulDateString(sevenDaysAgo);

    return await this.novelRepo
      .createQueryBuilder("novel")
      .leftJoin(
        "novel_daily_stats",
        "stats",
        "stats.novelId = novel.id AND stats.recordedAt = :dateString",
        { dateString },
      )
      .where("novel.status != :draft", { draft: SeriesStatus.DRAFT })
      .andWhere('(novel."bannedUntil" IS NULL OR novel."bannedUntil" <= NOW())')
      .select("novel.id", "id")
      .addSelect("novel.createdAt", "createdAt")
      .addSelect("novel.viewCount", "viewCount")
      .addSelect("novel.totalReviewsCount", "totalReviewsCount")
      .addSelect("novel.positiveReviewsCount", "positiveReviewsCount")
      .addSelect("novel.totalLibraryCount", "totalLibraryCount")
      .addSelect("stats.id", "snapshotId")
      .addSelect("stats.totalViews", "totalViews")
      .addSelect("stats.totalReviews", "totalReviews")
      .addSelect("stats.totalPositiveReviews", "totalPositiveReviews")
      .addSelect("stats.totalLibraryCount", "totalLibraryCountSnapshot")
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

  async bulkCreateWeeklyRankSnapshots(
    data: { id: string; weeklyScore: number }[],
    limit = 200,
  ) {
    if (!data.length) return;

    const recordedAt = this.getTodayDateString();
    const rankedData = [...data]
      .sort((a, b) => {
        if (b.weeklyScore !== a.weeklyScore) {
          return b.weeklyScore - a.weeklyScore;
        }
        return a.id.localeCompare(b.id);
      })
      .slice(0, limit)
      .map((item, index) => ({
        novelId: item.id,
        rankingScore: item.weeklyScore,
        rank: index + 1,
        recordedAt,
      }));

    await this.novelRepo.manager
      .createQueryBuilder()
      .insert()
      .into(NovelWeeklyRankSnapshot)
      .values(rankedData)
      .orUpdate(["rankingScore", "rank"], ["novelId", "recordedAt"])
      .execute();
  }

  async deleteOldWeeklyRankSnapshots(daysToKeep = 2) {
    const snapshotRepo = this.novelRepo.manager.getRepository(
      NovelWeeklyRankSnapshot,
    );
    const datesToKeep = await snapshotRepo
      .createQueryBuilder("snapshot")
      .select('snapshot."recordedAt"', "recordedAt")
      .groupBy('snapshot."recordedAt"')
      .orderBy('snapshot."recordedAt"', "DESC")
      .take(daysToKeep)
      .getRawMany<{ recordedAt: string }>();

    const recordedDates = datesToKeep.map((row) => row.recordedAt);
    if (recordedDates.length < daysToKeep) return;

    await snapshotRepo
      .createQueryBuilder()
      .delete()
      .from(NovelWeeklyRankSnapshot)
      .where('"recordedAt" NOT IN (:...recordedDates)', { recordedDates })
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
    await this.novelRepo
      .createQueryBuilder()
      .update(Novel)
      .set({ viewCount: () => '"viewCount" + 1' })
      .where("id = :id", { id: novelId })
      .andWhere('("bannedUntil" IS NULL OR "bannedUntil" <= NOW())')
      .execute();
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
      .select("COUNT(pub.chapterId)", "count")
      .addSelect('MAX(pub."publishedAt")', "lastDate")
      .addSelect('AVG(ch."wordCount")', "averageWordCount")
      .getRawOne();

    await this.novelRepo.update(novelId, {
      chapterCount: parseInt(stats.count) || 0,
      lastChapterDate: stats.lastDate || null,
      averageChapterWordCount:
        stats.averageWordCount === null || stats.averageWordCount === undefined
          ? null
          : Math.round(Number(stats.averageWordCount)),
    });
  }
}
