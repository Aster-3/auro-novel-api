import { ILike, Repository } from "typeorm";
import { ITagRepository } from "../interfaces/tag.repo.interface.js";
import { Tags } from "../entities/Tags.js";
import { CreateTagDto } from "../schemas/create.tag.schema.js";
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
    });
    return {
      data: result,
      count: total,
      currentPage: page,
      lastPage: Math.ceil(total / limit),
    };
  }
}
