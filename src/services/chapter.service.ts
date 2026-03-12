import { ConflictError } from "../errors/conflict.error.js";
import { IChapterRepository } from "../interfaces/chapter.repo.interface.js";
import { IChapterService } from "../interfaces/chapter.service.interface.js";
import { CreateChapterDTO } from "../schemas/create.chapter.schema.js";
import { GetChaptersDto } from "../schemas/get.chapters.schema.js";

export class ChapterService implements IChapterService {
  constructor(private chapterRepo: IChapterRepository) {}

  async create(dto: CreateChapterDTO) {
    const isDuplicate = await this.chapterRepo.duplicateControl(
      dto.novelId,
      dto.order,
    );
    if (isDuplicate) {
      throw new ConflictError(
        "Order",
        "Bu sıraya sahip bir bölüm zaten mevcut.",
      );
    }
    return await this.chapterRepo.create(dto);
  }

  async delete(id: string) {
    await this.chapterRepo.delete(id);
  }

  async getChapterByNovelId(dto: GetChaptersDto) {
    return await this.chapterRepo.getChapterByNovelId(dto);
  }
}
