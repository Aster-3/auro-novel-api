import { FindOptionsWhere, Repository } from "typeorm";
import { Novel } from "../entities/Novel.js";
import { INovelRepository } from "../interfaces/novel.repo.interface.js";
import { CreateNovelDTo } from "../schemas/create.novel.schema.js";

export class NovelRepository implements INovelRepository {
  constructor(private novelRepo: Repository<Novel>) {}

  create(novel: CreateNovelDTo) {
    return this.novelRepo.save(novel);
  }

  async findAll(options: { where: any; page: number; limit: number }) {
    const [novels, total] = await this.novelRepo.findAndCount({
      where: options.where,
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    });
    return {
      data: novels,
      count: total,
      currentPage: options.page,
      lastPage: Math.ceil(total / options.limit),
    };
  }

  async findOne(where: FindOptionsWhere<Novel>) {
    return this.novelRepo.findOne({
      where,
      relations: ["comments", "author", "categories", "tags"],
    });
  }
}
