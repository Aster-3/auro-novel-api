import { Brackets, In, Not, Repository } from "typeorm";
import { PublicationStatus } from "../constants/chapter.constants.js";
import { ChapterPublication } from "../entities/ChapterPublication.js";
import { NotFoundError } from "../errors/not.found.error.js";
import { IChapterPublicationRepository } from "../interfaces/chapter.publication.repo.interface.js";
import { INovelRepository } from "../interfaces/novel.repo.interface.js";
import { GetChaptersDto } from "../schemas/get.chapters.schema.js";
import { CreatePublicationDTO } from "../schemas/publish.chapter.schema.js";
import { wordCounter } from "../utils/wordCounter.js";

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

    const novel = await this.novelRepo.findOneById(id);
    if (!novel) throw new NotFoundError("Roman bulunamadi.");

    const isOwner = novel.author?.user?.id === userId;

    const query = this.publicationRepo
      .createQueryBuilder("pub")
      .innerJoinAndSelect("pub.chapter", "chapter")
      .innerJoinAndSelect("pub.volume", "volume")
      .where("chapter.novelId = :novelId", { novelId: id });

    query.andWhere(
      new Brackets((qb) => {
        qb.where("pub.publicationStatus = :published", {
          published: PublicationStatus.PUBLISHED,
        });

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

    const items = publications.map((p) => ({
      id: p.chapterId,
      title: p.chapter.title,
      chapterOrder: p.orderIndex,
      volumeOrder: p.volume.orderIndex,
      volumeName: p.volume.name,
      volumeId: p.volumeId,
      publishedAt: p.publishedAt,
      isUnpublished: p.publicationStatus === PublicationStatus.UNPUBLISHED,
    }));

    return {
      items: items as any[],
      total,
      currentPage: page,
      lastPage: Math.ceil(total / limit),
      nextPage: page < Math.ceil(total / limit) ? page + 1 : null,
    };
  }

  async getChapterForReading(id: string) {
    const publication = await this.publicationRepo
      .createQueryBuilder("pub")
      .innerJoinAndSelect("pub.chapter", "chapter")
      .innerJoinAndSelect("chapter.novel", "novel")
      .innerJoinAndSelect("novel.author", "author")
      .leftJoin("author.user", "authorUser")
      .innerJoinAndSelect("pub.volume", "volume")
      .where("pub.chapterId = :id", { id })
      .andWhere("author.userId IS NULL OR authorUser.id IS NOT NULL")
      .getOne();

    if (!publication) return null;

    return {
      id: publication.chapterId,
      title: publication.chapter.title,
      content: publication.chapter.content,
      chapterOrder: publication.orderIndex,
      volumeOrder: publication.volume.orderIndex,
      volumeId: publication.volumeId,
      volumeTitle: publication.volume.name,
      authorId: publication.chapter.novel.author?.userId ?? null,
      publicationStatus: publication.publicationStatus,
      novelId: publication.chapter.novel.id,
      novelStatus: publication.chapter.novel.status,
    };
  }

  async getPublishedChaptersForDownload(novelId: string) {
    const publications = await this.publicationRepo
      .createQueryBuilder("pub")
      .innerJoinAndSelect("pub.chapter", "chapter")
      .innerJoinAndSelect("pub.volume", "volume")
      .where("chapter.novelId = :novelId", { novelId })
      .andWhere("pub.publicationStatus = :published", {
        published: PublicationStatus.PUBLISHED,
      })
      .orderBy("volume.orderIndex", "ASC")
      .addOrderBy("pub.orderIndex", "ASC")
      .getMany();

    return publications.map((publication) => ({
      id: publication.chapterId,
      title: publication.chapter.title,
      content: publication.chapter.content,
      chapterOrder: publication.orderIndex,
      volumeId: publication.volumeId,
      volumeName: publication.volume.name,
      volumeOrder: publication.volume.orderIndex,
      publishedAt: publication.publishedAt,
      updatedAt: publication.chapter.updatedAt,
    }));
  }

  async getPublishedChaptersManifest(novelId: string) {
    const publications = await this.publicationRepo
      .createQueryBuilder("pub")
      .innerJoinAndSelect("pub.chapter", "chapter")
      .innerJoinAndSelect("pub.volume", "volume")
      .where("chapter.novelId = :novelId", { novelId })
      .andWhere("pub.publicationStatus = :published", {
        published: PublicationStatus.PUBLISHED,
      })
      .orderBy("volume.orderIndex", "ASC")
      .addOrderBy("pub.orderIndex", "ASC")
      .getMany();

    return publications.map((publication) => ({
      id: publication.chapterId,
      title: publication.chapter.title,
      chapterOrder: publication.orderIndex,
      volumeId: publication.volumeId,
      volumeName: publication.volume.name,
      volumeOrder: publication.volume.orderIndex,
      publishedAt: publication.publishedAt,
      updatedAt: publication.chapter.updatedAt,
      wordCount: wordCounter(publication.chapter.content),
    }));
  }

  async getPublishedChapterForOffline(chapterId: string) {
    const publication = await this.publicationRepo
      .createQueryBuilder("pub")
      .innerJoinAndSelect("pub.chapter", "chapter")
      .innerJoinAndSelect("chapter.novel", "novel")
      .innerJoin("novel.author", "author")
      .leftJoin("author.user", "authorUser")
      .innerJoinAndSelect("pub.volume", "volume")
      .where("pub.chapterId = :chapterId", { chapterId })
      .andWhere("pub.publicationStatus = :published", {
        published: PublicationStatus.PUBLISHED,
      })
      .andWhere("author.userId IS NULL OR authorUser.id IS NOT NULL")
      .getOne();

    if (!publication) return null;

    return {
      id: publication.chapterId,
      novelId: publication.chapter.novelId,
      title: publication.chapter.title,
      content: publication.chapter.content,
      chapterOrder: publication.orderIndex,
      volumeId: publication.volumeId,
      volumeName: publication.volume.name,
      volumeOrder: publication.volume.orderIndex,
      publishedAt: publication.publishedAt,
      updatedAt: publication.chapter.updatedAt,
      wordCount: wordCounter(publication.chapter.content),
    };
  }

  async getPublishedChaptersByIdsForDownload(
    novelId: string,
    chapterIds: string[],
  ) {
    const publications = await this.publicationRepo.find({
      where: {
        chapterId: In(chapterIds),
        publicationStatus: PublicationStatus.PUBLISHED,
        chapter: { novelId },
      },
      relations: { volume: true, chapter: true },
    });

    return publications
      .map((publication) => ({
        id: publication.chapterId,
        novelId: publication.chapter.novelId,
        title: publication.chapter.title,
        content: publication.chapter.content,
        chapterOrder: publication.orderIndex,
        volumeId: publication.volumeId,
        volumeName: publication.volume.name,
        volumeOrder: publication.volume.orderIndex,
        publishedAt: publication.publishedAt,
        updatedAt: publication.chapter.updatedAt,
        wordCount: wordCounter(publication.chapter.content),
      }))
      .sort(
        (a, b) =>
          a.volumeOrder - b.volumeOrder || a.chapterOrder - b.chapterOrder,
      );
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
    currentOrderIndex: number,
    currentVolumeOrder: number,
  ) {
    const nextChapter = await this.publicationRepo
      .createQueryBuilder("pub")
      .innerJoin("pub.chapter", "chapter")
      .innerJoin("pub.volume", "vol")
      .where("chapter.novelId = :novelId", { novelId })
      .andWhere(
        new Brackets((qb) => {
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

    return nextChapter?.chapterId ?? null;
  }

  async getPreviousChapter(
    novelId: string,
    currentOrderIndex: number,
    currentVolumeOrder: number,
  ) {
    const previousChapter = await this.publicationRepo
      .createQueryBuilder("pub")
      .innerJoin("pub.chapter", "chapter")
      .innerJoin("pub.volume", "vol")
      .where("chapter.novelId = :novelId", { novelId })
      .andWhere(
        new Brackets((qb) => {
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

    return previousChapter?.chapterId ?? null;
  }
}
