import { Brackets, Not, Repository } from "typeorm";
import { ChapterPublication } from "../entities/ChapterPublication.js";
import { IChapterPublicationRepository } from "../interfaces/chapter.publication.repo.interface.js";
import { CreatePublicationDTO } from "../schemas/publish.chapter.schema.js";
import { GetChaptersDto } from "../schemas/get.chapters.schema.js";
import { NotFoundError } from "../errors/not.found.error.js";
import { PublicationStatus } from "../constants/chapter.constants.js";
import { INovelRepository } from "../interfaces/novel.repo.interface.js";

export class ChapterPublicationRepository implements IChapterPublicationRepository {
  constructor(
    private publicationRepo: Repository<ChapterPublication>,
    private novelRepo: INovelRepository,
  ) {}

  async create(dto: CreatePublicationDTO) {
    await this.publicationRepo.save(dto);
  }

  async getChaptersByNovelId(
    dto: GetChaptersDto,
    userId: string,
    isAdmin: boolean,
  ) {
    const { id, page, limit, sort } = dto;

    const novelConfig = await this.novelRepo.getPaywallConfig(id);
    if (!novelConfig) throw new NotFoundError("Roman bulunamadı.");

    const isOwner = novelConfig.author?.user?.id === userId;

    const query = this.publicationRepo
      .createQueryBuilder("pub")
      .innerJoinAndSelect("pub.chapter", "chapter")
      .innerJoinAndSelect("pub.volume", "volume")
      .leftJoinAndSelect(
        "chapter.purchases",
        "purchase",
        "purchase.userId = :userId",
        { userId: userId ?? null },
      )
      .where("chapter.novelId = :novelId", { novelId: id });

    query.andWhere(
      new Brackets((qb) => {
        // Kural A: Herkes yayında olan bölümleri görebilir
        qb.where("pub.publicationStatus = :published", {
          published: PublicationStatus.PUBLISHED,
        });

        // Kural B: Eğer kullanıcı satın almışsa, arşivlenmiş olsa bile görmeli
        if (userId) {
          qb.orWhere("purchase.id IS NOT NULL");
        }

        // Kural C: Admin veya Sahibi ise her şeyi (Arşivler dahil) görmeli
        if (isAdmin || isOwner) {
          qb.orWhere("pub.publicationStatus = :unpublished", {
            unpublished: PublicationStatus.UNPUBLISHED,
          });
        }
      }),
    );

    const sortDir = sort === "asc" ? "ASC" : "DESC";
    query
      .orderBy("volume.orderIndex", sortDir)
      .addOrderBy("pub.orderIndex", sortDir)
      .skip((page - 1) * limit)
      .take(limit);

    const [publications, total] = await query.getManyAndCount();

    const items = publications.map((p) => {
      const { paywallStartVolume, paywallStartChapter } = novelConfig;

      let isLockedBySystem = p.volume.orderIndex === 0;

      if (
        paywallStartVolume !== null &&
        paywallStartChapter !== null &&
        !isLockedBySystem
      ) {
        isLockedBySystem =
          p.volume.orderIndex > paywallStartVolume ||
          (p.volume.orderIndex === paywallStartVolume &&
            p.orderIndex >= paywallStartChapter);
      }

      const hasPurchased =
        p.chapter.purchases && p.chapter.purchases.length > 0;

      const isUnpublished =
        p.publicationStatus === PublicationStatus.UNPUBLISHED;

      const canRead =
        isAdmin ||
        isOwner ||
        hasPurchased ||
        (!isLockedBySystem && !isUnpublished);

      return {
        id: p.chapterId,
        title: p.chapter.title,
        chapterOrder: p.orderIndex,
        volumeOrder: p.volume.orderIndex,
        volumeName: p.volume.name,
        volumeId: p.volumeId,
        isLocked: !canRead,
        publishedAt: p.publishedAt,
        isUnpublished: isUnpublished,
      };
    });

    return {
      items: items as any[],
      total,
      currentPage: page,
      lastPage: Math.ceil(total / limit),
      nextPage: page < Math.ceil(total / limit) ? page + 1 : null,
    };
  }

  async getChapterForReading(id: string) {
    const publication = await this.publicationRepo.findOne({
      where: { chapterId: id },
      select: {
        chapterId: true,
        orderIndex: true,
        volumeId: true,
        chapter: {
          title: true,
          content: true,
          novel: {
            id: true,
            paywallStartChapter: true,
            paywallStartVolume: true,
            chapterFreemiumPrice: true,
            chapterPremiumPrice: true,
            discountRate: true,
            discountEndDate: true,
            status: true,
            author: { userId: true },
          },
        },
        volume: {
          orderIndex: true,
          id: true,
          name: true,
        },
        publicationStatus: true,
      },
      relations: { volume: true, chapter: { novel: { author: true } } },
    });

    if (!publication) return null;

    return {
      id: publication.chapterId,
      title: publication.chapter.title,
      content: publication.chapter.content,
      chapterOrder: publication.orderIndex,
      premiumPrice: publication.chapter.novel.chapterPremiumPrice,
      freemiumPrice: publication.chapter.novel.chapterFreemiumPrice,
      discountRate: publication.chapter.novel.discountRate,
      discountEndDate: publication.chapter.novel.discountEndDate,
      volumeOrder: publication.volume.orderIndex,
      volumeId: publication.volumeId,
      volumeTitle: publication.volume.name,
      paywallStartChapter: publication.chapter.novel.paywallStartChapter,
      paywallStartVolume: publication.chapter.novel.paywallStartVolume,
      authorId: publication.chapter.novel.author?.userId ?? null,
      publicationStatus: publication.publicationStatus,
      novelId: publication.chapter.novel.id,
      novelStatus: publication.chapter.novel.status,
    };
  }

  async getLastChapterOrderInVolume(volumeId: string) {
    const lastChapter = await this.publicationRepo.findOne({
      where: { volumeId },
      order: { orderIndex: "DESC" },
    });
    return lastChapter ? lastChapter.orderIndex : 0;
  }

  async getChapterForMeta(id: string) {
    const publication = await this.publicationRepo.findOne({
      where: { chapterId: id },
      select: {
        chapterId: true,
        orderIndex: true,
        volumeId: true,
        publicationStatus: true,
        chapter: {
          title: true,
          novel: {
            id: true,
            author: {
              userId: true,
            },
          },
        },
        volume: {
          orderIndex: true,
        },
      },
      relations: { volume: true, chapter: { novel: { author: true } } },
    });

    if (!publication) return null;

    return {
      id: publication.chapterId,
      title: publication.chapter.title,
      chapterOrder: publication.orderIndex,
      volumeOrder: publication.volume.orderIndex,
      volumeId: publication.volumeId,
      novelId: publication.chapter.novel.id,
      authorId: publication.chapter.novel?.author?.userId ?? null,
      publicationStatus: publication.publicationStatus,
    };
  }

  async otherChaptersExistInVolume(chapterId: string, volumeId: string) {
    return await this.publicationRepo.exists({
      where: {
        volumeId,
        chapterId: Not(chapterId),
      },
    });
  }

  async closeGapInVolume(volumeId: string, from: number): Promise<void> {
    await this.publicationRepo
      .createQueryBuilder()
      .update(ChapterPublication)
      .set({ orderIndex: () => '"orderIndex" - 1' })
      .where("volumeId = :volumeId", { volumeId })
      .andWhere("orderIndex > :from", { from })
      .execute();
  }

  async changePublicationStatus(
    chapterId: string,
    publicationStatus: PublicationStatus,
  ): Promise<void> {
    await this.publicationRepo.update(chapterId, { publicationStatus });
  }

  async getNextChapter(
    novelId: string,
    currentOrderIndex: number, // chapterOrder yerine artık orderIndex kullanıyoruz
    currentVolumeOrder: number, // Volume tablosundaki sıra
  ) {
    const nextChapter = await this.publicationRepo
      .createQueryBuilder("pub")
      .innerJoin("pub.chapter", "chapter")
      .innerJoin("pub.volume", "vol") // Volume tablosunu da bağlamalıyız ki sırasına bakalım
      .where("chapter.novelId = :novelId", { novelId })
      .andWhere(
        new Brackets((qb) => {
          // Mantık: Ya bir sonraki volume'un ilk bölümleri, ya aynı volume'un sonraki bölümleri
          qb.where("vol.orderIndex > :currentVolumeOrder", {
            currentVolumeOrder,
          }).orWhere(
            "vol.orderIndex = :currentVolumeOrder AND pub.orderIndex > :currentOrderIndex",
            { currentVolumeOrder, currentOrderIndex },
          );
        }),
      )
      .andWhere("pub.publicationStatus = :published", {
        published: PublicationStatus.PUBLISHED,
      })
      .orderBy("vol.orderIndex", "ASC")
      .addOrderBy("pub.orderIndex", "ASC")
      .select(["pub.chapterId", "chapter.title"])
      .getOne();

    if (!nextChapter) return null;

    return nextChapter.chapterId;
  }

  async getPreviousChapter(
    novelId: string,
    currentOrderIndex: number, // chapterOrder yerine artık orderIndex kullanıyoruz
    currentVolumeOrder: number, // Volume tablosundaki sıra
  ) {
    const previousChapter = await this.publicationRepo
      .createQueryBuilder("pub")
      .innerJoin("pub.chapter", "chapter")
      .innerJoin("pub.volume", "vol") // Volume tablosunu da bağlamalıyız ki sırasına bakalım
      .where("chapter.novelId = :novelId", { novelId })
      .andWhere(
        new Brackets((qb) => {
          // Mantık: Ya bir önceki volume'un son bölümleri, ya aynı volume'un önceki bölümleri
          qb.where("vol.orderIndex < :currentVolumeOrder", {
            currentVolumeOrder,
          }).orWhere(
            "vol.orderIndex = :currentVolumeOrder AND pub.orderIndex < :currentOrderIndex",
            { currentVolumeOrder, currentOrderIndex },
          );
        }),
      )
      .andWhere("pub.publicationStatus = :published", {
        published: PublicationStatus.PUBLISHED,
      })
      .orderBy("vol.orderIndex", "DESC")
      .addOrderBy("pub.orderIndex", "DESC")
      .select(["pub.chapterId", "chapter.title"])
      .getOne();

    if (!previousChapter) return null;

    return previousChapter.chapterId;
  }
}
