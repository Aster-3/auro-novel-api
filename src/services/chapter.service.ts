import { ConflictError } from "../errors/conflict.error.js";
import { IChapterRepository } from "../interfaces/chapter.repo.interface.js";
import { IChapterService } from "../interfaces/chapter.service.interface.js";
import { INovelRepository } from "../interfaces/novel.repo.interface.js";
import { IVolumeRepository } from "../interfaces/volume.repo.interface.js";
import { CreateChapterDTO } from "../schemas/create.chapter.schema.js";
import { GetChaptersDto } from "../schemas/get.chapters.schema.js";
import { UpdateChapterDTO } from "../schemas/update.chapter.schema.js";

export class ChapterService implements IChapterService {
  constructor(
    private chapterRepo: IChapterRepository,
    private volumeRepo: IVolumeRepository,
    private novelRepo: INovelRepository,
  ) {}

  async create(dto: CreateChapterDTO) {
    const lastChapterOrder = await this.chapterRepo.getLastChapterOrder(
      dto.novelId,
    );

    if (dto.volumeId) {
      const volumeExist = await this.volumeRepo.existControl(dto.volumeId);
      console.log("Volume Exist:", volumeExist);
      if (!volumeExist) {
        throw new ConflictError("VolumeId", "Cilt mevcut değil.");
      }
    }

    const novelExist = await this.novelRepo.existControl({ id: dto.novelId });
    if (!novelExist) {
      throw new ConflictError("NovelId", "Böyle bir novel mevcut değil.");
    }
    return await this.chapterRepo.create({
      ...dto,
      order: lastChapterOrder + 1,
    });
  }

  async delete(id: string) {
    await this.chapterRepo.delete(id);
  }

  async getChapterByNovelId(dto: GetChaptersDto) {
    return await this.chapterRepo.getChapterByNovelId(dto);
  }

  async updateChapter(dto: UpdateChapterDTO) {
    if (dto.volumeId) {
      const volumeExist = await this.volumeRepo.existControl(dto.volumeId);
      console.log("Volume Exist:", volumeExist);
      if (!volumeExist) {
        throw new ConflictError("VolumeId", "Cilt mevcut değil.");
      }
    }
    await this.chapterRepo.updateChapter(dto);
  }

  async getSummary(novelId: string) {
    return await this.chapterRepo.getSummary(novelId);
  }
}
