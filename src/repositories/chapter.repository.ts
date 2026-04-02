import { MoreThan, Not, Repository } from "typeorm";
import { Chapter } from "../entities/_index.js";
import { CreateChapterDTO } from "../schemas/create.chapter.schema.js";
import { IChapterRepository } from "../interfaces/chapter.repo.interface.js";
import { GetChaptersDto } from "../schemas/get.chapters.schema.js";
import { UpdateChapterDTO } from "../schemas/update.chapter.schema.js";
import { NotFoundError } from "../errors/not.found.error.js";

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

  async getChapters(dto: GetChaptersDto) {
    const { id, userId, page, limit, sort } = dto;

    const novelConfig = await this.chapterRepo.manager
      .getRepository("Novel")
      .createQueryBuilder("novel")
      .leftJoin("novel.author", "author")
      .select([
        "novel.paywallStartVolume",
        "novel.paywallStartChapter",
        "author.userId",
      ])
      .where("novel.id = :id", { id })
      .getRawOne();

    if (!novelConfig) throw new NotFoundError("Roman bulunamadı.");

    const isOwner = novelConfig.author_userId === userId;

    // 2. ADIM: Bölümleri çekiyoruz (Artık join kalabalığı bitti!)
    const query = this.chapterRepo
      .createQueryBuilder("chapter")
      .leftJoinAndSelect("chapter.volume", "volume")
      .leftJoinAndSelect(
        "chapter.purchases",
        "purchase",
        "purchase.userId = :userId",
        { userId: userId ?? null },
      )
      .where("chapter.novelId = :novelId", { novelId: id })
      .andWhere("chapter.isPublished = :isPublished", { isPublished: true })
      .select([
        "chapter.id",
        "chapter.title",
        "chapter.orderIndex",
        "chapter.createdAt",
        "chapter.volumeId",
        "volume.orderIndex",
        "volume.name",
      ]);

    const sortDir = sort === "asc" ? "ASC" : "DESC";
    query
      .orderBy("volume.orderIndex", sortDir)
      .addOrderBy("chapter.orderIndex", sortDir);

    query.skip((page - 1) * limit).take(limit);

    const [chapters, total] = await query.getManyAndCount();

    // 3. ADIM: Hafif Mapping
    const items = chapters.map((c) => {
      // Kilit mantığında novelConfig'den gelen sabit değerleri kullanıyoruz
      const isLockedBySystem =
        c.volume.orderIndex === 0 ||
        c.volume.orderIndex > novelConfig.novel_paywallStartVolume ||
        (c.volume.orderIndex === novelConfig.novel_paywallStartVolume &&
          c.orderIndex >= novelConfig.novel_paywallStartChapter);

      const hasPurchased = c.purchases && c.purchases.length > 0;
      const canRead = !isLockedBySystem || isOwner || hasPurchased;

      return {
        id: c.id,
        title: c.title,
        chapterOrder: c.orderIndex,
        volumeOrder: c.volume.orderIndex,
        volumeName: c.volume.name,
        volumeId: c.volumeId,
        isLocked: !canRead,
        createdAt: c.createdAt,
      };
    });

    return {
      items,
      total,
      currentPage: page,
      lastPage: Math.ceil(total / limit),
      nextPage: page < Math.ceil(total / limit) ? page + 1 : null,
    };
  }

  duplicateControl(volumeId: string, order: number) {
    return this.chapterRepo.exists({
      where: {
        volumeId: volumeId,
        orderIndex: order,
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

  async getMaxOrderIndexInVolume(volumeId: string): Promise<number> {
    const maxOrder = await this.chapterRepo
      .createQueryBuilder("chapter")
      .where("chapter.volumeId = :volumeId", { volumeId })
      .select("MAX(chapter.orderIndex)", "max")
      .getRawOne();
    return parseFloat(maxOrder.max) || 0;
  }

  async closeGapInVolume(volumeId: string, orderIndex: number) {
    await this.chapterRepo
      .createQueryBuilder()
      .update() // Update moduna geç
      .set({ orderIndex: () => "orderIndex - 1" }) // Mevcut değerden 1 çıkar
      .where("volumeId = :volumeId", { volumeId })
      .andWhere("orderIndex > :orderIndex", { orderIndex }) // Çıkan bölümden büyük olanlar
      .execute();
  }

  async updateChapter(dto: UpdateChapterDTO) {
    await this.chapterRepo.update({ id: dto.id }, dto);
  }

  async isPurchased(chapterId: string): Promise<boolean> {
    return await this.chapterRepo
      .createQueryBuilder("chapter")
      .innerJoin("chapter.purchases", "purchase")
      .where("chapter.id = :id", { id: chapterId })
      .getExists();
  }

  async getLastPublishedChapterIndexInVolume(
    volumeId: string,
  ): Promise<number> {
    const lastPublishedChapter = await this.chapterRepo
      .createQueryBuilder("chapter")
      .where("chapter.volumeId = :volumeId", { volumeId })
      .andWhere("chapter.isPublished = :isPublished", { isPublished: true })
      .orderBy("chapter.orderIndex", "DESC")
      .select("chapter.orderIndex", "orderIndex")
      .getRawOne();
    return lastPublishedChapter ? parseInt(lastPublishedChapter.orderIndex) : 0;
  }

  async getShortInfoById(chapterId: string) {
    const chapter = await this.chapterRepo.findOne({
      where: { id: chapterId },
      select: {
        id: true,
        novelId: true,
        volumeId: true,
        orderIndex: true,
        publishedAt: true,
        isPublished: true,
        novel: {
          id: true,
          author: {
            userId: true,
          },
        },
        volume: {
          orderIndex: true,
        },
      },
      relations: {
        novel: { author: true },
        volume: true,
      },
    });
    return chapter;
  }

  async getLastChapterInVolume(
    novelId: string,
    volumeId: string,
  ): Promise<Chapter | null> {
    const lastChapter = await this.chapterRepo.findOne({
      where: { novelId, volumeId },
      order: { orderIndex: "DESC" },
    });
    return lastChapter;
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

  async getDraftChapterByNovelId(dto: GetChaptersDto) {
    const { id, page, limit } = dto;

    const query = this.chapterRepo
      .createQueryBuilder("chapter")
      .leftJoinAndSelect("chapter.volume", "volume")
      .where("chapter.novelId = :novelId", { novelId: id })
      .andWhere("chapter.isPublished = :isPublished", { isPublished: false })
      .select([
        "chapter.id",
        "chapter.title",
        "chapter.orderIndex",
        "chapter.createdAt",
        "chapter.volumeId",
        "volume.orderIndex",
        "volume.name",
      ])
      .orderBy("volume.orderIndex", "ASC")
      .addOrderBy("chapter.orderIndex", "ASC")
      .skip((page - 1) * limit)
      .take(limit);

    const [chapters, total] = await query.getManyAndCount();

    const items = chapters.map((c) => ({
      id: c.id,
      title: c.title || "Adsız Taslak",
      chapterOrder: c.orderIndex,
      volumeOrder: c.volume.orderIndex,
      volumeName: c.volume.name,
      createdAt: c.createdAt,
    }));

    return {
      items,
      total,
      currentPage: page,
      lastPage: Math.ceil(total / limit),
      nextPage: page < Math.ceil(total / limit) ? page + 1 : null,
    };
  }

  async getOneChapter(id: string) {
    return await this.chapterRepo.findOne({
      where: { id },
      relations: { novel: { author: true }, volume: true, purchases: true },
      select: {
        id: true,
        title: true,
        content: true,
        orderIndex: true,
        novelId: true,
        novel: {
          author: {
            userId: true,
          },
          paywallStartVolume: true,
          paywallStartChapter: true,
        },
        volume: {
          orderIndex: true,
          id: true,
        },
        purchases: {
          userId: true,
        },
      },
    });
  }

  async getNovelIdByChapterId(chapterId: string) {
    const chapter = await this.chapterRepo.findOne({
      where: { id: chapterId },
      select: { novelId: true },
    });
    if (!chapter) {
      return null;
    }
    return chapter.novelId;
  }

  async hasPublishedAfterInVolume(
    volumeId: string,
    orderIndex: number,
  ): Promise<boolean> {
    const exist = await this.chapterRepo.exists({
      where: {
        volumeId,
        orderIndex: MoreThan(orderIndex),
        isPublished: true,
      },
    });
    return exist;
  }

  async hasOtherPublishedInVolume(
    chapterId: string,
    volumeId: string,
  ): Promise<boolean> {
    return await this.chapterRepo
      .createQueryBuilder("chapter")
      .where("chapter.volumeId = :volumeId", { volumeId: volumeId })
      .andWhere("chapter.isPublished = true")
      .andWhere("chapter.id != :currentId", { currentId: chapterId }) // Kendini hariç tut
      .getExists();
  }

  async hasAnyAfterInVolume(
    volumeId: string,
    orderIndex: number,
  ): Promise<boolean> {
    return await this.chapterRepo.exists({
      where: {
        volumeId,
        orderIndex: MoreThan(orderIndex),
      },
    });
  }

  async hasOtherChaptersInVolume(
    chapterId: string,
    volumeId: string,
  ): Promise<boolean> {
    return await this.chapterRepo
      .createQueryBuilder("chapter")
      .where("chapter.volumeId = :volumeId", { volumeId: volumeId })
      .andWhere("chapter.id != :currentId", { currentId: chapterId }) // Kendini hariç tut
      .getExists();
  }
}
