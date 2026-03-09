import { FindOptionsWhere, Repository } from "typeorm";
import { Novel } from "../entities/Novel.js";
import { INovelRepository } from "../interfaces/novel.repo.interface.js";
import { CreateNovelDTo } from "../schemas/create.novel.schema.js";
import { tr } from "zod/locales";

export class NovelRepository implements INovelRepository {
  constructor(private novelRepo: Repository<Novel>) {}

  create(novel: CreateNovelDTo) {
    return this.novelRepo.save(novel);
  }

  async findAll(options: { where: any; page: number; limit: number }) {
    const [novels, total] = await this.novelRepo.findAndCount({
      where: options.where,
      select: {
        id: true,
        name: true,
        coverImage: true,
        synopsis: true,
        status: true,
        author: { id: true, nickname: true, profileImageUrl: true },
      },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
      relations: {
        author: true,
        tags: true,
        categories: true,
        comments: true,
      },
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
      select: {
        id: true,
        name: true,
        coverImage: true,
        synopsis: true,
        status: true,
        author: { id: true, nickname: true, profileImageUrl: true },
      },
      relations: {
        author: true,
        tags: true,
        categories: true,
        comments: true,
        chapters: true,
      },
    });
  }

  updateGlobalPopularityScores() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  }
}
