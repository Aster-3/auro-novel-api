import { FindOptionsWhere, ILike, Like } from "typeorm";
import { Novel } from "../entities/Novel.js";
import { INovelRepository } from "../interfaces/novel.repo.interface.js";
import { INovelService } from "../interfaces/novel.service.interface.js";
import { NotFoundError } from "../errors/not.found.error.js";
import { CreateNovelDTo } from "../schemas/create.novel.schema.js";
import { ConflictError } from "../errors/conflict.error.js";

export class NovelService implements INovelService {
  constructor(private novelRepo: INovelRepository) {}

  async create(dto: CreateNovelDTo) {
    const novel = await this.novelRepo.findOne({ slug: dto.slug });
    if (novel) throw new ConflictError("slug", "Bu slug zaten kullanımda.");
    return this.novelRepo.create(dto);
  }

  async findAll({
    filter,
    page = 1,
    limit = 20,
  }: {
    filter?: Partial<Novel>;
    page?: number;
    limit?: number;
  }) {
    const where: FindOptionsWhere<Novel> = {};

    if (filter?.name) where.name = ILike(`%${filter?.name}%`);

    if (filter?.author) where.author = filter.author;

    if (filter?.status) where.status = filter.status;

    return this.novelRepo.findAll({ where, page, limit });
  }

  async findOneBy(criteria: Partial<Novel>) {
    const novel = await this.novelRepo.findOne(criteria);
    if (!novel) throw new NotFoundError("Novel bulunamadı.");
    return novel;
  }
}
