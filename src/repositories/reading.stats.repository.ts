import { Repository } from "typeorm";
import {
  IReadingStatsRepository,
  RecentReadItem,
} from "../interfaces/reading.stats.repository.interface.js";
import { UpdateReadingStatsDto } from "../schemas/update.reading.stats.schema.js";
import { ReadingStats } from "../entities/ReadingStats.js";

export class ReadingStatsRepository implements IReadingStatsRepository {
  constructor(private readonly readingRepo: Repository<ReadingStats>) {}

  async createOrUpdateReadingStats(dto: UpdateReadingStatsDto): Promise<void> {
    const {
      userId,
      novelId,
      lastReadChapterId,
      lastChapterProgress,
      incrementTime,
    } = dto;

    await this.readingRepo
      .createQueryBuilder()
      .insert()
      .into(ReadingStats)
      .values({
        userId,
        novelId,
        lastReadChapterId,
        lastChapterProgress,
        totalReadTime: incrementTime,
        lastReadAt: new Date(),
      })
      .onConflict(
        `("userId", "novelId") DO UPDATE SET 
      "totalReadTime" = "reading_stats"."totalReadTime" + EXCLUDED."totalReadTime",
      "lastReadChapterId" = EXCLUDED."lastReadChapterId",
      "lastChapterProgress" = EXCLUDED."lastChapterProgress",
      "lastReadAt" = EXCLUDED."lastReadAt"`,
      )
      .execute();
  }

  async getUserNovelStats(userId: string, novelId: string) {
    return await this.readingRepo.findOne({
      where: { userId, novelId },
      select: {
        id: true,
        novelId: true,
        lastChapterProgress: true,
        totalReadTime: true,
        lastReadAt: true,
        lastReadChapterId: true,
      },
    });
  }

  async getUserStats(userId: string) {
    const stats = await this.readingRepo.find({
      where: { userId },
      select: {
        id: true,
        novelId: true,
        lastChapterProgress: true,
        totalReadTime: true,
        lastReadAt: true,
        lastReadChapterId: true,
      },
    });
    return stats;
  }

  async getRecentReadsByUserId(
    userId: string,
    limit: number,
  ): Promise<{ items: RecentReadItem[]; total: number }> {
    const [stats, total] = await this.readingRepo
      .createQueryBuilder("stats")
      .leftJoinAndSelect("stats.novel", "novel")
      .leftJoin("novel.author", "author")
      .leftJoin("author.user", "authorUser")
      .leftJoinAndSelect("stats.chapter", "chapter")
      .where("stats.userId = :userId", { userId })
      .andWhere("(author.userId IS NULL OR authorUser.id IS NOT NULL)")
      .orderBy("stats.lastReadAt", "DESC")
      .take(limit)
      .getManyAndCount();

    return {
      items: stats.map((stat) => ({
        id: stat.id,
        novelId: stat.novelId,
        lastChapterProgress: stat.lastChapterProgress,
        totalReadTime: stat.totalReadTime,
        lastReadAt: stat.lastReadAt,
        lastReadChapter: stat.chapter
          ? {
              id: stat.chapter.id,
              title: stat.chapter.title,
            }
          : null,
        novel: stat.novel
          ? {
              id: stat.novel.id,
              name: stat.novel.name,
              slug: stat.novel.slug,
              coverImageUrl: stat.novel.coverImage,
            }
          : null,
      })),
      total,
    };
  }

  async existControl(userId: string, novelId: string): Promise<boolean> {
    return await this.readingRepo.existsBy({ userId, novelId });
  }

  async updateReadingStats(dto: UpdateReadingStatsDto): Promise<void> {
    await this.createOrUpdateReadingStats(dto);
  }
}
