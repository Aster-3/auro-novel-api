import { Repository } from "typeorm";
import { Library } from "../entities/Library.js";
import { ILibraryRepository } from "../interfaces/library.repo.interface.js";
import { GetMyLibraryDto } from "../schemas/get.my.library.schema.js";
import { LibrarySortOption } from "../constants/series.constants.js";
import { Novel } from "../entities/Novel.js";
import { GetUserLibraryShowcaseDto } from "../schemas/get.user.showcase.schema.js";

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

  async getMyLibrary(dto: GetMyLibraryDto) {
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
    query.andWhere("(author.userId IS NULL OR authorUser.id IS NOT NULL)");

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
      return {
        novelId: entry.novelId,
        title: entry.novel.name,
        authorName:
          entry.novel?.author?.nickname ||
          entry.novel?.author?.user?.nickname ||
          "Unknown Author",
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

  async getPublicUserLibrary(dto: GetUserLibraryShowcaseDto) {
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
      .where("library.userId = :userId", { userId })
      .andWhere("library.isHidden = false")
      .andWhere("(author.userId IS NULL OR authorUser.id IS NOT NULL)");

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
      return {
        novelId: entry.novelId,
        title: entry.novel.name,
        authorName:
          entry.novel?.author?.nickname ||
          entry.novel?.author?.user?.nickname ||
          "Unknown Author",
        coverImageUrl: entry.novel.coverImage,
        isHidden: entry.isHidden,
        addedAt: entry.createdAt,
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
