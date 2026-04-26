import { ILibraryRepository } from "../interfaces/library.repo.interface.js";
import { ILibraryService } from "../interfaces/library.service.interface.js";
import { GetMyLibraryDto } from "../schemas/get.my.library.schema.js";

export class LibraryService implements ILibraryService {
  constructor(private libraryRepo: ILibraryRepository) {}

  async toggleNovelInLibrary(novelId: string, userId: string): Promise<void> {
    await this.libraryRepo.toggleNovelInLibrary(novelId, userId);
  }

  async getMyLibrary(dto: GetMyLibraryDto) {
    console.log("Service DTO:", dto);
    return await this.libraryRepo.getMyLibrary(dto);
  }

  async isNovelInLibrary(novelId: string, userId: string): Promise<boolean> {
    return await this.libraryRepo.existInLibrary(novelId, userId);
  }
}
