import { Repository } from "typeorm";
import { Library } from "../entities/Library.js";
import { ILibraryRepository } from "../interfaces/library.repo.interface.js";
import { GetMyLibraryDto } from "../schemas/get.my.library.schema.js";

export class LibraryRepository implements ILibraryRepository {
  constructor(private libraryRepo: Repository<Library>) {}

  async toggleNovelInLibrary(novelId: string, userId: string) {
    const existingEntry = await this.libraryRepo.findOne({
      where: { novelId, userId },
    });

    if (existingEntry) {
      await this.libraryRepo.remove(existingEntry);
    } else {
      await this.libraryRepo.save({ novelId, userId });
    }
  }

  async getMyLibrary(dto: GetMyLibraryDto) {
    const { userId, sortBy, limit = 10, page = 1 } = dto;

    const skip = (page - 1) * limit;

    const [libraryEntries, total] = await this.libraryRepo.findAndCount({
      where: { userId },
      select: {
        userId: true,
        novelId: true,
        isHidden: true,
        createdAt: true,
        novel: {
          name: true,
          author: {
            nickname: true,
            user: {
              nickname: true,
            },
          },
          coverImage: true,
        },
      },
      relations: {
        novel: {
          author: {
            user: true,
          },
        },
      },
      // order: sortBy ? { [sortBy]: 'DESC' } : { createdAt: 'DESC' },
      take: limit,
      skip: skip,
    });

    const items = libraryEntries.map((entry) => {
      // Yazar ismini her entry için ayrı hesaplamak daha doğru olur
      const authorName =
        entry.novel?.author?.nickname ||
        entry.novel?.author?.user?.nickname ||
        "Unknown Author";

      return {
        novelId: entry.novelId,
        title: entry.novel.name,
        authorName: authorName,
        coverImageUrl: entry.novel.coverImage,
        isHidden: entry.isHidden,
        addedAt: entry.createdAt,
      };
    });

    // 4. Sayfalama meta bilgilerini hesaplıyoruz
    const lastPage = Math.ceil(total / limit);
    const nextPage = page < lastPage ? page + 1 : null;

    return {
      items: items as any[],
      total,
      currentPage: page,
      lastPage,
      nextPage,
    };
  }

  async existInLibrary(novelId: string, userId: string): Promise<boolean> {
    const exists = await this.libraryRepo.exists({
      where: { novelId, userId },
    });
    return exists;
  }
}
