import { Repository } from "typeorm";
import { Library } from "../entities/Library.js";
import { ILibraryRepository } from "../interfaces/library.repo.interface.js";

export class LibraryRepository implements ILibraryRepository {
  constructor(private libraryRepo: Repository<Library>) {}

  async addNovelToLibrary(novelId: string, userId: string): Promise<void> {
    await this.libraryRepo.save({ novelId, userId });
  }

  async removeNovelFromLibrary(novelId: string, userId: string): Promise<void> {
    await this.libraryRepo.delete({ novelId, userId });
  }
}
