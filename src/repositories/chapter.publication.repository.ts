import { Not, Repository } from "typeorm";
import { ChapterPublication } from "../entities/ChapterPublication.js";
import { NotFoundError } from "../errors/not.found.error.js";
import {
  ChapterListItem,
  IChapterPublicationRepository,
} from "../interfaces/chapter.publication.repo.interface.js";
import { INovelRepository } from "../interfaces/novel.repo.interface.js";
import { GetChaptersDto } from "../schemas/get.chapters.schema.js";
import { wordCounter } from "../utils/wordCounter.js";

const SORT_KEY_STEP = 1000;

export class ChapterPublicationRepository
  implements IChapterPublicationRepository
{
  constructor(
    private publicationRepo: Repository<ChapterPublication>,
    private novelRepo: INovelRepository,
  ) {}

  async create(dto: Partial<ChapterPublication>) {
    await this.publicationRepo.save(dto);
  }

  private async getOrderedPublications(novelId: string) {
    return await this.publicationRepo
      .createQueryBuilder("pub")
      .innerJoinAndSelect("pub.chapter", "chapter")
      .innerJoinAndSelect("pub.volume", "volume")
      .where("chapter.novelId = :novelId", { novelId })
      .orderBy("volume.orderIndex", "ASC")
      .addOrderBy("pub.sortKey", "ASC")
      .getMany();
  }

  private withDisplayOrders(publications: ChapterPublication[]) {
    const volumeCounters = new Map<string, number>();

    return publications.map((publication, index) => {
      const currentVolumeOrder =
        (volumeCounters.get(publication.volumeId) ?? 0) + 1;
      volumeCounters.set(publication.volumeId, currentVolumeOrder);

      return {
        publication,
        globalDisplayOrder: index + 1,
        volumeDisplayOrder: currentVolumeOrder,
      };
    });
  }

  async getChaptersByNovelId(
    dto: GetChaptersDto,
    userId: string,
    isAdmin: boolean,
  ) {
    const { id, page, limit, sort } = dto;

    const novel = await this.novelRepo.findOneById(id);
    if (!novel) throw new NotFoundError("Roman bulunamadi.");

    const ordered = this.withDisplayOrders(await this.getOrderedPublications(id));
    const sorted = sort === "desc" ? [...ordered].reverse() : ordered;
    const total = sorted.length;
    const pageItems = sorted.slice((page - 1) * limit, page * limit);

    const items: ChapterListItem[] = pageItems.map(
      ({ publication, globalDisplayOrder, volumeDisplayOrder }) => ({
        id: publication.chapterId,
        title: publication.chapter.title,
        chapterOrder: globalDisplayOrder,
        globalDisplayOrder,
        volumeDisplayOrder,
        volumeOrder: publication.volume.orderIndex,
        volumeName: publication.volume.name,
        volumeId: publication.volumeId,
        publishedAt: publication.publishedAt,
      }),
    );

    return {
      items,
      total,
      currentPage: page,
      lastPage: Math.ceil(total / limit),
      nextPage: page < Math.ceil(total / limit) ? page + 1 : null,
    };
  }

  async getChapterForReading(id: string) {
    const publication = await this.publicationRepo.findOne({
      where: { chapterId: id },
      relations: {
        volume: true,
        chapter: { novel: { author: true } },
      },
    });

    if (!publication) return null;

    const ordered = this.withDisplayOrders(
      await this.getOrderedPublications(publication.chapter.novelId),
    );
    const display = ordered.find((item) => item.publication.chapterId === id);

    return {
      id: publication.chapterId,
      title: publication.chapter.title,
      content: publication.chapter.content,
      sortKey: publication.sortKey,
      chapterOrder: display?.globalDisplayOrder ?? 0,
      globalDisplayOrder: display?.globalDisplayOrder ?? 0,
      volumeDisplayOrder: display?.volumeDisplayOrder ?? 0,
      volumeOrder: publication.volume.orderIndex,
      volumeId: publication.volumeId,
      volumeTitle: publication.volume.name,
      authorId: publication.chapter.novel.author?.userId ?? null,
      novelId: publication.chapter.novel.id,
      novelStatus: publication.chapter.novel.status,
    };
  }

  async getPublishedChaptersForDownload(novelId: string) {
    const ordered = this.withDisplayOrders(await this.getOrderedPublications(novelId));

    return ordered.map(
      ({ publication, globalDisplayOrder, volumeDisplayOrder }) => ({
        id: publication.chapterId,
        title: publication.chapter.title,
        content: publication.chapter.content,
        chapterOrder: globalDisplayOrder,
        globalDisplayOrder,
        volumeDisplayOrder,
        volumeId: publication.volumeId,
        volumeName: publication.volume.name,
        volumeOrder: publication.volume.orderIndex,
        publishedAt: publication.publishedAt,
        updatedAt: publication.chapter.updatedAt,
      }),
    );
  }

  async getPublishedChaptersManifest(novelId: string) {
    const ordered = this.withDisplayOrders(await this.getOrderedPublications(novelId));

    return ordered.map(
      ({ publication, globalDisplayOrder, volumeDisplayOrder }) => ({
        id: publication.chapterId,
        title: publication.chapter.title,
        chapterOrder: globalDisplayOrder,
        globalDisplayOrder,
        volumeDisplayOrder,
        volumeId: publication.volumeId,
        volumeName: publication.volume.name,
        volumeOrder: publication.volume.orderIndex,
        publishedAt: publication.publishedAt,
        updatedAt: publication.chapter.updatedAt,
        wordCount: wordCounter(publication.chapter.content),
      }),
    );
  }

  async getPublishedChapterForOffline(chapterId: string) {
    const publication = await this.publicationRepo.findOne({
      where: { chapterId },
      relations: {
        volume: true,
        chapter: { novel: true },
      },
    });

    if (!publication) return null;

    const ordered = this.withDisplayOrders(
      await this.getOrderedPublications(publication.chapter.novelId),
    );
    const display = ordered.find((item) => item.publication.chapterId === chapterId);

    return {
      id: publication.chapterId,
      novelId: publication.chapter.novelId,
      title: publication.chapter.title,
      content: publication.chapter.content,
      chapterOrder: display?.globalDisplayOrder ?? 0,
      globalDisplayOrder: display?.globalDisplayOrder ?? 0,
      volumeDisplayOrder: display?.volumeDisplayOrder ?? 0,
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
    const requested = new Set(chapterIds);
    const ordered = this.withDisplayOrders(
      await this.getOrderedPublications(novelId),
    ).filter(({ publication }) => requested.has(publication.chapterId));

    return ordered.map(
      ({ publication, globalDisplayOrder, volumeDisplayOrder }) => ({
        id: publication.chapterId,
        novelId: publication.chapter.novelId,
        title: publication.chapter.title,
        content: publication.chapter.content,
        chapterOrder: globalDisplayOrder,
        globalDisplayOrder,
        volumeDisplayOrder,
        volumeId: publication.volumeId,
        volumeName: publication.volume.name,
        volumeOrder: publication.volume.orderIndex,
        publishedAt: publication.publishedAt,
        updatedAt: publication.chapter.updatedAt,
        wordCount: wordCounter(publication.chapter.content),
      }),
    );
  }

  async getChapterForMeta(id: string) {
    const publication = await this.publicationRepo.findOne({
      where: { chapterId: id },
      relations: { volume: true, chapter: { novel: { author: true } } },
    });

    if (!publication) return null;

    const ordered = this.withDisplayOrders(
      await this.getOrderedPublications(publication.chapter.novelId),
    );
    const display = ordered.find((item) => item.publication.chapterId === id);

    return {
      id: publication.chapterId,
      title: publication.chapter.title,
      sortKey: publication.sortKey,
      chapterOrder: display?.globalDisplayOrder ?? 0,
      globalDisplayOrder: display?.globalDisplayOrder ?? 0,
      volumeDisplayOrder: display?.volumeDisplayOrder ?? 0,
      volumeOrder: publication.volume.orderIndex,
      volumeId: publication.volumeId,
      novelId: publication.chapter.novel.id,
      authorId: publication.chapter.novel?.author?.userId ?? null,
    };
  }

  async getLastSortKeyInVolume(volumeId: string, excludedChapterId?: string) {
    const query = this.publicationRepo
      .createQueryBuilder("pub")
      .where("pub.volumeId = :volumeId", { volumeId });

    if (excludedChapterId) {
      query.andWhere("pub.chapterId != :excludedChapterId", {
        excludedChapterId,
      });
    }

    const lastChapter = await query.orderBy("pub.sortKey", "DESC").getOne();
    return lastChapter ? lastChapter.sortKey : 0;
  }

  async otherChaptersExistInVolume(chapterId: string, volumeId: string) {
    return await this.publicationRepo.exists({
      where: {
        volumeId,
        chapterId: Not(chapterId),
      },
    });
  }

  async getFirstSortKeyInVolume(volumeId: string, excludedChapterId?: string) {
    const query = this.publicationRepo
      .createQueryBuilder("pub")
      .where("pub.volumeId = :volumeId", { volumeId });

    if (excludedChapterId) {
      query.andWhere("pub.chapterId != :excludedChapterId", {
        excludedChapterId,
      });
    }

    const firstChapter = await query.orderBy("pub.sortKey", "ASC").getOne();
    return firstChapter?.sortKey ?? null;
  }

  async getPreviousSortKeyInVolume(
    volumeId: string,
    sortKey: number,
    excludedChapterId?: string,
  ) {
    const query = this.publicationRepo
      .createQueryBuilder("pub")
      .where("pub.volumeId = :volumeId", { volumeId })
      .andWhere("pub.sortKey < :sortKey", { sortKey });

    if (excludedChapterId) {
      query.andWhere("pub.chapterId != :excludedChapterId", {
        excludedChapterId,
      });
    }

    const previous = await query.orderBy("pub.sortKey", "DESC").getOne();

    return previous?.sortKey ?? null;
  }

  async getNextSortKeyInVolume(
    volumeId: string,
    sortKey: number,
    excludedChapterId?: string,
  ) {
    const query = this.publicationRepo
      .createQueryBuilder("pub")
      .where("pub.volumeId = :volumeId", { volumeId })
      .andWhere("pub.sortKey > :sortKey", { sortKey });

    if (excludedChapterId) {
      query.andWhere("pub.chapterId != :excludedChapterId", {
        excludedChapterId,
      });
    }

    const next = await query.orderBy("pub.sortKey", "ASC").getOne();

    return next?.sortKey ?? null;
  }

  async getSortKeyByChapterIdInVolume(chapterId: string, volumeId: string) {
    const publication = await this.publicationRepo.findOne({
      where: { chapterId, volumeId },
      select: { sortKey: true },
    });
    return publication?.sortKey ?? null;
  }

  async updatePlacement(chapterId: string, volumeId: string, sortKey: number) {
    await this.publicationRepo.update(chapterId, { volumeId, sortKey });
  }

  async rebalanceVolume(volumeId: string) {
    const publications = await this.publicationRepo.find({
      where: { volumeId },
      order: { sortKey: "ASC" },
      select: { chapterId: true, sortKey: true },
    });

    await Promise.all(
      publications.map((publication, index) =>
        this.publicationRepo.update(publication.chapterId, {
          sortKey: (index + 1) * SORT_KEY_STEP,
        }),
      ),
    );
  }

  async getNextChapter(
    novelId: string,
    currentSortKey: number,
    currentVolumeOrder: number,
  ) {
    const nextChapter = await this.publicationRepo
      .createQueryBuilder("pub")
      .innerJoin("pub.chapter", "chapter")
      .innerJoin("pub.volume", "vol")
      .where("chapter.novelId = :novelId", { novelId })
      .andWhere(
        `(vol.orderIndex > :currentVolumeOrder OR
          (vol.orderIndex = :currentVolumeOrder AND pub.sortKey > :currentSortKey))`,
        { currentVolumeOrder, currentSortKey },
      )
      .orderBy("vol.orderIndex", "ASC")
      .addOrderBy("pub.sortKey", "ASC")
      .select(["pub.chapterId", "chapter.title"])
      .getOne();

    return nextChapter?.chapterId ?? null;
  }

  async getPreviousChapter(
    novelId: string,
    currentSortKey: number,
    currentVolumeOrder: number,
  ) {
    const previousChapter = await this.publicationRepo
      .createQueryBuilder("pub")
      .innerJoin("pub.chapter", "chapter")
      .innerJoin("pub.volume", "vol")
      .where("chapter.novelId = :novelId", { novelId })
      .andWhere(
        `(vol.orderIndex < :currentVolumeOrder OR
          (vol.orderIndex = :currentVolumeOrder AND pub.sortKey < :currentSortKey))`,
        { currentVolumeOrder, currentSortKey },
      )
      .orderBy("vol.orderIndex", "DESC")
      .addOrderBy("pub.sortKey", "DESC")
      .select(["pub.chapterId", "chapter.title"])
      .getOne();

    return previousChapter?.chapterId ?? null;
  }
}
