import { Repository } from "typeorm";
import { Chapter } from "../entities/_index.js";
import { CreateChapterDTO } from "../schemas/create.chapter.schema.js";
import { IChapterRepository } from "../interfaces/chapter.repo.interface.js";
import { GetChaptersDto } from "../schemas/get.chapters.schema.js";
import { UpdateChapterDTO } from "../schemas/update.chapter.schema.js";

export class ChapterRepository implements IChapterRepository {
  constructor(private chapterRepo: Repository<Chapter>) {}

  async create(dto: CreateChapterDTO) {
    const chapter = await this.chapterRepo.save(dto);
    if (!chapter) return false;
    return true;
  }

  async delete(id: string) {
    await this.chapterRepo.delete(id);
  }

  async getChapterByNovelId(dto: GetChaptersDto) {
    const { id, userId, page, limit } = dto;

    const query = this.chapterRepo
      .createQueryBuilder("chapter")
      .select([
        "chapter.id",
        "chapter.title",
        "chapter.order",
        "chapter.isLocked", // Senin tablondaki kolon
      ])
      // Sadece bu kullanıcıya ait satın alımı getir (Join içindeki filtre hayat kurtarır)
      .leftJoinAndSelect(
        "chapter.purchases",
        "purchase",
        "purchase.userId = :userId",
        { userId: userId ?? null }, // userId yoksa null gönder ki hata almasın
      )
      .where("chapter.novelId = :novelId", { novelId: id })
      .orderBy("chapter.order", "ASC")
      .skip((page - 1) * limit)
      .take(limit);

    const [chapters, total] = await query.getManyAndCount();

    // Frontend için temiz mapping
    const data = chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      order: chapter.order,
      // MANTIK: Bölüm kilitli değilse VEYA kullanıcı satın almışsa "unlocked" true döner
      isUnlocked:
        !chapter.isLocked ||
        (chapter.purchases && chapter.purchases.length > 0),
    }));

    return {
      data: data,
      count: total,
      currentPage: page,
      lastPage: Math.ceil(total / limit),
    };
  }

  duplicateControl(novelId: string, order: number) {
    return this.chapterRepo.exists({
      where: {
        novelId: novelId,
        order: order,
      },
    });
  }

  async existControl(id: string) {
    return await this.chapterRepo.exists({
      where: {
        id: id,
      },
    });
  }

  async getLockStatus(chapterId: string) {
    const chapter = await this.chapterRepo.findOne({
      where: { id: chapterId },
      select: { isLocked: true },
    });
    if (!chapter) {
      return null;
    }
    return chapter.isLocked;
  }

  async updateChapter(dto: UpdateChapterDTO) {
    await this.chapterRepo.update({ id: dto.id }, dto);
  }

  async getLastChapterOrder(novelId: string) {
    const chapter = await this.chapterRepo
      .createQueryBuilder("chapter")
      .where("chapter.novelId = :novelId", { novelId })
      .orderBy("chapter.order", "DESC")
      .getOne();

    return chapter ? chapter.order : 0;
  }

  async getSummary(novelId: string) {
    const stats = await this.chapterRepo
      .createQueryBuilder("chapter")
      .where("chapter.novelId = :novelId", { novelId })
      .select("COUNT(chapter.id)", "totalCount")
      .addSelect("MAX(chapter.createdAt)", "lastPublishedAt")
      .getRawOne();

    return {
      total: parseInt(stats.totalCount),
      lastPublishedAt: stats.lastPublishedAt,
    };
  }
}
