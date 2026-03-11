import { Repository } from "typeorm";
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

  async search(dto: SearchTagDto): Promise<Tags[]> {
    const query = this.tagRepo.createQueryBuilder("tag");
    if (dto.name) {
      query.where("tag.name ILIKE :name", { name: `%${dto.name}%` });
    }
    return await query.getMany();
  }
}
