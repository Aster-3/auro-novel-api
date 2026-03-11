import { Repository } from "typeorm";
import { ITagRepository } from "../interfaces/tag.repo.interface.js";
import { Tags } from "../entities/Tags.js";
import { CreateTagDto } from "../schemas/create.tag.schema.js";

export class TagRepository implements ITagRepository {
  constructor(private tagRepo: Repository<Tags>) {}

  async create(dto: CreateTagDto): Promise<void> {
    const tag = this.tagRepo.create(dto);
    await this.tagRepo.save(tag);
  }

  async delete(id: string): Promise<void> {
    await this.tagRepo.delete(id);
  }
}
