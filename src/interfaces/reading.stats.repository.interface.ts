import { UpdateReadingStatsDto } from "../schemas/update.reading.stats.schema.js";

export interface IReadingStatsRepository {
  //   getNovelStats(novelId: string): Promise<{ totalReads: number; uniqueReaders: number }>;
  //   getChapterStats(chapterId: string): Promise<{ totalReads: number; uniqueReaders: number }>;
  updateReadingStats(dto: UpdateReadingStatsDto): Promise<void>;
}
