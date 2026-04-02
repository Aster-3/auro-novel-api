import { ILibraryRepository } from "../interfaces/library.repo.interface.js";
import { ILibraryService } from "../interfaces/library.service.interface.js";

export class LibraryService implements ILibraryService {
  constructor(private libraryRepo: ILibraryRepository) {}

  async addNovelToLibrary(novelId: string, userId: string): Promise<void> {
    await this.libraryRepo.addNovelToLibrary(novelId, userId);
  }
  async removeNovelFromLibrary(novelId: string, userId: string): Promise<void> {
    await this.libraryRepo.removeNovelFromLibrary(novelId, userId);
  }
}
