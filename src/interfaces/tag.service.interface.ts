import { CreateTagDto } from "../schemas/create.tag.schema.js";
import { SearchTagDto } from "../schemas/search.tag.schema.js";
import { Tags } from "../entities/Tags.js";
import { FindAndCountType } from "../constants/findAndCountType.js";

export interface ITagService {
  createTag(dto: CreateTagDto): Promise<void>;
  deleteTag(id: string): Promise<void>;
  searchTags(dto: SearchTagDto): Promise<FindAndCountType<Tags>>;
}
