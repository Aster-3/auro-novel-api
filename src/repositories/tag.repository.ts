import { ILike, Repository } from "typeorm";
import { ITagRepository } from "../interfaces/tag.repo.interface.js";
import { Tags } from "../entities/Tags.js";
import { Novel } from "../entities/Novel.js";
import { CreateTagDto } from "../schemas/create.tag.schema.js";
import { GetTagNovelsDto } from "../schemas/get.tag.novels.schema.js";
import { SearchTagDto } from "../schemas/search.tag.schema.js";

export class TagRepository implements ITagRepository {
  constructor(private tagRepo: Repository<Tags>) {}

  async create(dto: CreateTagDto & { slug: string }): Promise<void> {
    const { userId, ...rest } = dto;
    await this.tagRepo.save({ ...rest, createdById: userId });
  }

  async delete(id: string): Promise<void> {
    await this.tagRepo.delete(id);
  }

  async existBySlug(slug: string): Promise<boolean> {
    return await this.tagRepo.exists({ where: { slug } });
  }

  async search(dto: SearchTagDto) {
    const { name, page, limit } = dto;
    const where: any = {};

    if (name) where.name = ILike(`%${name}%`);
    const [result, total] = await this.tagRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: "DESC" },
    });
    const totalPage = Math.ceil(total / limit);
    const nextPage = page < totalPage ? page + 1 : null;
    return {
      items: result,
      total: total,
      currentPage: page,
      nextPage: nextPage,
      lastPage: totalPage,
    };
  }

  async getRandomTags(limit: number): Promise<Tags[]> {
    return await this.tagRepo
      .createQueryBuilder("tag")
      .innerJoin("tag.novels", "novel")
      .select(["tag.id", "tag.name"])
      .groupBy("tag.id")
      .having("COUNT(novel.id) >= 2")
      .orderBy("RANDOM()")
      .limit(limit)
      .getMany();
  }

  async getNovelsByTagId(dto: GetTagNovelsDto) {
    const { id, page, limit } = dto;

    const [result, total] = await this.tagRepo.manager
      .getRepository(Novel)
      .createQueryBuilder("novel")
      .innerJoin("novel.tags", "tag", "tag.id = :id", { id })
      .leftJoin("novel.author", "author")
      .leftJoin("author.user", "authorUser")
      .select([
        "novel.id",
        "novel.name",
        "novel.coverImage",
        "novel.rankingScore",
        "novel.totalReviewsCount",
        "novel.positiveReviewsCount",
        "novel.chapterCount",
        "novel.lastChapterDate",
        "novel.createdAt",
      ])
      .where("author.userId IS NULL OR authorUser.id IS NOT NULL")
      .orderBy("novel.rankingScore", "DESC")
      .addOrderBy("novel.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPage = Math.ceil(total / limit);
    const nextPage = page < totalPage ? page + 1 : null;

    return {
      items: result,
      total,
      currentPage: page,
      nextPage,
      lastPage: totalPage,
    };
  }
}
