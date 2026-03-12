import { Repository } from "typeorm";
import { Chapter } from "../entities/_index.js";
import { CreateChapterDTO } from "../schemas/create.chapter.schema.js";
import { IChapterRepository } from "../interfaces/chapter.repo.interface.js";
import { GetChaptersDto } from "../schemas/get.chapters.schema.js";
import { UpdateChapterDTO } from "../schemas/update.chapter.schema.js";

export class ChapterRepository implements IChapterRepository {
  constructor(private chapterRepo: Repository<Chapter>) {}

  async create(dto: CreateChapterDTO) {
    const chapter = await this.chapterRepo.save(dto);
    if (!chapter) return false;
    return true;
  }

  async delete(id: string) {
    await this.chapterRepo.delete(id);
  }

  async getChapterByNovelId(dto: GetChaptersDto) {
    const { id, page, limit } = dto;

    const [result, total] = await this.chapterRepo.findAndCount({
      where: { novelId: id },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: result,
      count: total,
      currentPage: page,
      lastPage: Math.ceil(total / limit),
    };
  }

  duplicateControl(novelId: string, order: number) {
    return this.chapterRepo.exists({
      where: {
        novelId: novelId,
        order: order,
      },
    });
  }

  async existControl(id: string) {
    return await this.chapterRepo.exists({
      where: {
        id: id,
      },
    });
  }

  async updateChapter(dto: UpdateChapterDTO) {
    await this.chapterRepo.update({ id: dto.id }, dto);
  }
}
