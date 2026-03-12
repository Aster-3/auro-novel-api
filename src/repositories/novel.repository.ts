import { FindOptionsWhere, ILike, Repository } from "typeorm";
import { Novel } from "../entities/Novel.js";
import { INovelRepository } from "../interfaces/novel.repo.interface.js";
import { CreateNovelDTo } from "../schemas/create.novel.schema.js";
import { GetNovelsDTo } from "../schemas/get.novels.schema.js";

export class NovelRepository implements INovelRepository {
  constructor(private novelRepo: Repository<Novel>) {}

  create(novel: CreateNovelDTo) {
    return this.novelRepo.save(novel);
  }

  async existControl(identifier: { id?: string; slug?: string }) {
    const { id, slug } = identifier;
    if (!id && !slug)
      throw new Error(
        "Sorgu hatası: 'id' veya 'slug' parametrelerinden en az biri tanımlı olmalıdır",
      );

    return await this.novelRepo.exists({
      where: id ? { id } : { slug },
    });
  }

  async getNovels(dto: GetNovelsDTo) {
    const { name, status, limit, page } = dto;
    const where: FindOptionsWhere<Novel> = {};
    if (name) where.name = ILike(`%${name}%`);
    if (status) where.status = status;

    const [novels, total] = await this.novelRepo.findAndCount({
      where: where,
      select: {
        id: true,
        name: true,
        coverImage: true,
      },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: novels,
      count: total,
      currentPage: page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOneById(id: string) {
    return this.novelRepo.findOne({
      where: { id },
      select: {
        id: true,
        name: true,
        coverImage: true,
        synopsis: true,
        status: true,
        positiveReviewsCount: true,
        totalReviewsCount: true,
        viewCount: true,
        author: { id: true, nickname: true },
        categories: { id: true, trName: true, enName: true },
        tags: { id: true, name: true },
      },
      relations: {
        author: true,
        tags: true,
        categories: true,
      },
    });
  }

  async updateNovelCategories(novelId: string, categoryIds: number[]) {
    const categories = categoryIds.map((id) => ({ id }));
    await this.novelRepo.save({
      id: novelId,
      categories: categories,
    } as any);
  }

  async updateNovelTags(novelId: string, tagIds: string[]) {
    const tags = tagIds.map((id) => ({ id }));
    await this.novelRepo.save({
      id: novelId,
      tags: tags,
    } as any);
  }

  updateGlobalPopularityScores() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  }

  async incrementViewCount(novelId: string) {
    await this.novelRepo.increment({ id: novelId }, "viewCount", 1);
  }
}
