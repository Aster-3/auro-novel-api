import { ReadingStats } from "../entities/ReadingStats.js";
import { UpdateReadingStatsDto } from "../schemas/update.reading.stats.schema.js";

export interface IReadingStatsRepository {
  getUserStats(userId: string): Promise<ReadingStats[]>;
  getUserNovelStats(
    userId: string,
    novelId: string,
  ): Promise<ReadingStats | null>;
  updateReadingStats(dto: UpdateReadingStatsDto): Promise<void>;
  existControl(userId: string, novelId: string): Promise<boolean>;
  updateReadingStats(dto: UpdateReadingStatsDto): Promise<void>;
}
