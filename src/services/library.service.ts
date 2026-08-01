import { ILibraryRepository } from "../interfaces/library.repo.interface.js";
import { ILibraryService } from "../interfaces/library.service.interface.js";
import { GetMyLibraryDto } from "../schemas/get.my.library.schema.js";
import { GetUserLibraryShowcaseDto } from "../schemas/get.user.showcase.schema.js";

export class LibraryService implements ILibraryService {
  constructor(private libraryRepo: ILibraryRepository) {}

  async toggleNovelInLibrary(novelId: string, userId: string): Promise<void> {
    await this.libraryRepo.toggleNovelInLibrary(novelId, userId);
  }

  async addNovelToLibrary(novelId: string, userId: string): Promise<void> {
    await this.libraryRepo.addNovelToLibrary(novelId, userId);
  }

  async removeNovelFromLibrary(novelId: string, userId: string): Promise<void> {
    await this.libraryRepo.removeNovelFromLibrary(novelId, userId);
  }

  async getMyLibrary(dto: GetMyLibraryDto, viewerId?: string) {
    console.log("Service DTO:", dto);
    return await this.libraryRepo.getMyLibrary(dto, viewerId);
  }

  async getPublicUserLibrary(
    dto: GetUserLibraryShowcaseDto,
    allowAdultContent = false,
    viewerId?: string,
  ) {
    return await this.libraryRepo.getPublicUserLibrary(
      dto,
      allowAdultContent,
      viewerId,
    );
  }

  async isNovelInLibrary(novelId: string, userId: string): Promise<boolean> {
    return await this.libraryRepo.existInLibrary(novelId, userId);
  }
}
