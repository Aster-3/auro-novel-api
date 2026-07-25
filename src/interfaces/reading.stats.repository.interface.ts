import { ReadingStats } from "../entities/ReadingStats.js";
import { UpdateReadingStatsDto } from "../schemas/update.reading.stats.schema.js";

export type RecentReadItem = {
  id: string;
  novelId: string;
  lastChapterProgress: number;
  totalReadTime: number;
  lastReadAt: Date;
  lastReadChapter: {
    id: string;
    title: string;
  } | null;
  novel: {
    id: string;
    name: string;
    slug: string;
    coverImageUrl?: string | null;
  } | null;
};

export interface IReadingStatsRepository {
  getUserStats(userId: string): Promise<ReadingStats[]>;
  getUserNovelStats(
    userId: string,
    novelId: string,
  ): Promise<ReadingStats | null>;
  getRecentReadsByUserId(
    userId: string,
    limit: number,
  ): Promise<{ items: RecentReadItem[]; total: number }>;
  updateReadingStats(dto: UpdateReadingStatsDto): Promise<void>;
  existControl(userId: string, novelId: string): Promise<boolean>;
}
