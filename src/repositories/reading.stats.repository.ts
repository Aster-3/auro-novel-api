import { Repository } from "typeorm";
import { IReadingStatsRepository } from "../interfaces/reading.stats.repository.interface.js";
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

    // await this.readingRepo
    //   .createQueryBuilder()
    //   .insert()
    //   .into(ReadingStats)
    //   .values({
    //     userId,
    //     novelId,
    //     lastReadChapterId,
    //     lastChapterProgress,
    //     totalReadTime: incrementTime,
    //     lastReadAt: new Date(),
    //   })
    //   .orUpdate(
    //     ["lastReadChapterId", "lastChapterProgress", "totalReadTime", "lastReadAt"],
    //     ["userId", "novelId"] // Benzersiz anahtarlar
    //   )
    //   // Kritik nokta: Mevcut sürenin üzerine ekleme yapıyoruz
    //   .set({
    //     lastReadChapterId,
    //     lastChapterProgress,
    //     lastReadAt: new Date(),
    //     totalReadTime: () => `"totalReadTime" + ${incrementTime}`,
    //   })
    //   .execute();
  }

  async getUserNovelStats(
    userId: string,
    novelId: string,
  ): Promise<ReadingStats | null> {
    return await this.readingRepo.findOneBy({ userId, novelId });
  }

  async existControl(userId: string, novelId: string): Promise<boolean> {
    return await this.readingRepo.existsBy({ userId, novelId });
  }

  // ID bazlı basit güncellemeye artık ihtiyacın kalmayabilir ama dursun dersen:
  async updateReadingStats(dto: UpdateReadingStatsDto): Promise<void> {
    // Bu metod artık createOrUpdate ile benzer işi yapıyor,
    // karmaşayı önlemek için serviste sadece createOrUpdate'i çağırman daha temiz olur.
    await this.createOrUpdateReadingStats(dto);
  }
}
