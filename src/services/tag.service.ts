import { ConflictError } from "../errors/conflict.error.js";
import { ITagRepository } from "../interfaces/tag.repo.interface.js";
import { ITagService } from "../interfaces/tag.service.interface.js";
import { CreateTagDto } from "../schemas/create.tag.schema.js";
import { GetTagNovelsDto } from "../schemas/get.tag.novels.schema.js";
import { SearchTagDto } from "../schemas/search.tag.schema.js";
import { tagSlugify } from "../utils/tag.slugify.js";

export class TagService implements ITagService {
  constructor(private tagRepo: ITagRepository) {}

  async createTag(dto: CreateTagDto): Promise<void> {
    const slug = tagSlugify(dto.name);
    const isTagExist = await this.tagRepo.existBySlug(slug);
    if (isTagExist) {
      throw new ConflictError("name", "Bu isimde bir etiket zaten mevcut.");
    }
    await this.tagRepo.create({ ...dto, slug });
  }

  async deleteTag(id: string): Promise<void> {
    await this.tagRepo.delete(id);
  }

  async searchTags(dto: SearchTagDto) {
    return await this.tagRepo.search(dto);
  }

  async getRandomTags(limit: number = 10) {
    if (limit > 20) limit = 20; // Maksimum 20 tag döndür
    return await this.tagRepo.getRandomTags(limit);
  }
  async getNovelsByTagId(dto: GetTagNovelsDto, allowAdultContent = false) {
    return await this.tagRepo.getNovelsByTagId(dto, allowAdultContent);
  }
}
