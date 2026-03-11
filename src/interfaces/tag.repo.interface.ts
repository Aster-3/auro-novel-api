import { Tags } from "../entities/Tags.js";
import { CreateTagDto } from "../schemas/create.tag.schema.js";
import { SearchTagDto } from "../schemas/search.tag.schema.js";

export interface ITagRepository {
  create(dto: CreateTagDto & { slug: string }): Promise<void>;
  delete(id: string): Promise<void>;
  existBySlug(slug: string): Promise<boolean>;
  search(dto: SearchTagDto): Promise<Tags[]>;
}
