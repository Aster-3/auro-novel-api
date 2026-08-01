import { Repository } from "typeorm";
import { Library } from "../entities/Library.js";
import { ILibraryRepository } from "../interfaces/library.repo.interface.js";
import { GetMyLibraryDto } from "../schemas/get.my.library.schema.js";
import { LibrarySortOption } from "../constants/series.constants.js";
import { Novel } from "../entities/Novel.js";
import { GetUserLibraryShowcaseDto } from "../schemas/get.user.showcase.schema.js";
import { applyAdultContentFilter } from "../utils/adult.content.visibility.js";
import { presentAuthor } from "../utils/deleted.user.presenter.js";
import { applyBlockedUserVisibilityFilter } from "../utils/user.block.visibility.js";

export class LibraryRepository implements ILibraryRepository {
  constructor(private libraryRepo: Repository<Library>) {}

  async toggleNovelInLibrary(novelId: string, userId: string) {
    await this.libraryRepo.manager.transaction(async (manager) => {
      const existingEntry = await manager.findOne(Library, {
        where: { novelId, userId },
      });

      if (existingEntry) {
        await manager.remove(existingEntry);
        await manager
          .createQueryBuilder()
          .update(Novel)
          .set({
            totalLibraryCount: () => `GREATEST("totalLibraryCount" - 1, 0)`,
          })
          .where("id = :id", { id: novelId })
          .execute();
      } else {
        await manager.save(Library, { novelId, userId });
        await manager.increment(Novel, { id: novelId }, "totalLibraryCount", 1);
      }
    });
  }

  async addNovelToLibrary(novelId: string, userId: string) {
    await this.libraryRepo.manager.transaction(async (manager) => {
      const existingEntry = await manager.findOne(Library, {
        where: { novelId, userId },
      });

      if (existingEntry) return;

      await manager.save(Library, { novelId, userId });
      await manager.increment(Novel, { id: novelId }, "totalLibraryCount", 1);
    });
  }

  async removeNovelFromLibrary(novelId: string, userId: string) {
    await this.libraryRepo.manager.transaction(async (manager) => {
      const existingEntry = await manager.findOne(Library, {
        where: { novelId, userId },
      });

      if (!existingEntry) return;

      await manager.remove(existingEntry);
      await manager
        .createQueryBuilder()
        .update(Novel)
        .set({
          totalLibraryCount: () => `GREATEST("totalLibraryCount" - 1, 0)`,
        })
        .where("id = :id", { id: novelId })
        .execute();
    });
  }

  async getMyLibrary(dto: GetMyLibraryDto, viewerId = dto.userId) {
    const { userId, sortBy, limit, page, search } = dto;
    const skip = (page - 1) * limit;

    const query = this.libraryRepo
      .createQueryBuilder("library")
      .leftJoinAndSelect("library.novel", "novel")
      .leftJoinAndSelect("novel.author", "author")
      .leftJoinAndSelect("author.user", "authorUser")
      .leftJoin(
        "ReadingStats",
        "stats",
        "stats.userId = :userId AND stats.novelId = library.novelId",
        { userId },
      )
      .where("library.userId = :userId", { userId });
    query.andWhere("library.isHidden = false");
    applyBlockedUserVisibilityFilter(query, viewerId, "authorUser");

    if (search) {
      query.andWhere("novel.name ILIKE :search", { search: `%${search}%` });
    }

    if (sortBy === LibrarySortOption.LAST_READED) {
      query.addSelect("stats.lastReadAt", "stats_lastReadAt");
      query.orderBy("stats.lastReadAt", "DESC", "NULLS LAST");
    } else if (sortBy === LibrarySortOption.TITLE_ASC) {
      query.orderBy("novel.name", "ASC");
    } else {
      query.orderBy("library.createdAt", "DESC");
    }

    const [libraryEntries, total] = await query
      .take(limit)
      .skip(skip)
      .getManyAndCount();

    const items = libraryEntries.map((entry) => {
      const author = presentAuthor(entry.novel?.author);

      return {
        novelId: entry.novelId,
        title: entry.novel.name,
        authorName: author.authorName,
        authorIsDeleted: author.isDeletedUser,
        coverImageUrl: entry.novel.coverImage,
        isHidden: entry.isHidden,
        addedAt: entry.createdAt,
      };
    });

    const lastPage = Math.ceil(total / limit);
    return {
      items: items as any,
      total,
      currentPage: page,
      lastPage,
      nextPage: page < lastPage ? page + 1 : null,
    };
  }

  async getPublicUserLibrary(
    dto: GetUserLibraryShowcaseDto,
    allowAdultContent = false,
    viewerId?: string,
  ) {
    const { userId, sortBy, limit, page } = dto;
    const skip = (page - 1) * limit;

    const query = this.libraryRepo
      .createQueryBuilder("library")
      .leftJoinAndSelect("library.novel", "novel")
      .leftJoinAndSelect("novel.author", "author")
      .leftJoinAndSelect("author.user", "authorUser")
      .leftJoin(
        "ReadingStats",
        "stats",
        "stats.userId = :userId AND stats.novelId = library.novelId",
        { userId },
      )
      .leftJoin(
        "Chapter",
        "lastReadChapter",
        "lastReadChapter.id = stats.lastReadChapterId AND lastReadChapter.novelId = library.novelId",
      )
      .where("library.userId = :userId", { userId })
      .andWhere("library.isHidden = false");
    applyAdultContentFilter(query, allowAdultContent);
    applyBlockedUserVisibilityFilter(query, viewerId, "authorUser");

    query
      .addSelect("stats.lastChapterProgress", "stats_lastChapterProgress")
      .addSelect("stats.totalReadTime", "stats_totalReadTime")
      .addSelect("stats.lastReadAt", "stats_lastReadAt")
      .addSelect("lastReadChapter.id", "lastReadChapter_id")
      .addSelect("lastReadChapter.title", "lastReadChapter_title")
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT("readChapter"."chapterId")', "readChapterCount")
          .from("user_read_chapter", "readChapter")
          .where('"readChapter"."userId" = :userId', { userId })
          .andWhere('"readChapter"."novelId" = "library"."novelId"');
      }, "readChapterCount");

    if (sortBy === LibrarySortOption.LAST_READED) {
      query.orderBy("stats.lastReadAt", "DESC", "NULLS LAST");
    } else if (sortBy === LibrarySortOption.TITLE_ASC) {
      query.orderBy("novel.name", "ASC");
    } else {
      query.orderBy("library.createdAt", "DESC");
    }

    const { entities: libraryEntries, raw } = await query
      .take(limit)
      .skip(skip)
      .getRawAndEntities();
    const total = await query.getCount();

    const items = libraryEntries.map((entry, index) => {
      const rawItem = raw[index] ?? {};
      const readChapterCount = Number(rawItem.readChapterCount ?? 0);
      const totalChapterCount = entry.novel.chapterCount ?? 0;
      const author = presentAuthor(entry.novel?.author);
      const readingProgressPercent =
        totalChapterCount > 0
          ? Math.min(
              100,
              Math.round((readChapterCount / totalChapterCount) * 100),
            )
          : 0;

      return {
        novelId: entry.novelId,
        title: entry.novel.name,
        authorName: author.authorName,
        authorIsDeleted: author.isDeletedUser,
        coverImageUrl: entry.novel.coverImage,
        isHidden: entry.isHidden,
        addedAt: entry.createdAt,
        lastChapterProgress:
          rawItem.stats_lastChapterProgress === null ||
          rawItem.stats_lastChapterProgress === undefined
            ? null
            : Number(rawItem.stats_lastChapterProgress),
        totalReadTime:
          rawItem.stats_totalReadTime === null ||
          rawItem.stats_totalReadTime === undefined
            ? null
            : Number(rawItem.stats_totalReadTime),
        lastReadAt: rawItem.stats_lastReadAt ?? null,
        lastReadChapter: rawItem.lastReadChapter_id
          ? {
              id: rawItem.lastReadChapter_id,
              title: rawItem.lastReadChapter_title,
            }
          : null,
        readChapterCount,
        totalChapterCount,
        readingProgressPercent,
      };
    });

    const lastPage = Math.ceil(total / limit);
    return {
      items,
      total,
      currentPage: page,
      lastPage,
      nextPage: page < lastPage ? page + 1 : null,
    };
  }

  async existInLibrary(novelId: string, userId: string): Promise<boolean> {
    const exists = await this.libraryRepo.exists({
      where: { novelId, userId },
    });
    return exists;
  }
}
