import { FindOptionsWhere, ILike, Like } from "typeorm";
import { Novel } from "../entities/Novel.js";
import { INovelRepository } from "../interfaces/novel.repo.interface.js";
import { INovelService } from "../interfaces/novel.service.interface.js";
import { CreateNovelDTo } from "../schemas/create.novel.schema.js";
import { ConflictError } from "../errors/conflict.error.js";
import { GetNovelsDTo } from "../schemas/get.novels.schema.js";
import { NotFoundError } from "../errors/not.found.error.js";

export class NovelService implements INovelService {
  constructor(private novelRepo: INovelRepository) {}

  async create(dto: CreateNovelDTo) {
    const novel = await this.novelRepo.existControl({ slug: dto.slug });
    if (novel) throw new ConflictError("slug", "Bu slug zaten kullanımda.");
    return this.novelRepo.create(dto);
  }

  async getNovels(dto: GetNovelsDTo) {
    return this.novelRepo.getNovels(dto);
  }

  async getNovelDetailWithId(id: string) {
    const novel = await this.novelRepo.findOneById(id);
    if (!novel) throw new NotFoundError("Aradığınız novel bulunamadı.");
    return novel;
  }

  async updateNovelCategories(novelId: string, categoryIds: number[]) {
    await this.novelRepo.updateNovelCategories(novelId, categoryIds);
  }

  async checkNovelExists(id: string): Promise<boolean> {
    return await this.novelRepo.existControl({ id });
  }

  incrementViewCount(novelId: string) {
    return this.novelRepo.incrementViewCount(novelId);
  }
}
