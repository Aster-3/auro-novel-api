import { CreateTagDto } from "../schemas/create.tag.schema.js";
import { SearchTagDto } from "../schemas/search.tag.schema.js";
import { GetTagNovelsDto } from "../schemas/get.tag.novels.schema.js";
import { Novel } from "../entities/Novel.js";
import { Tags } from "../entities/Tags.js";
import { FindAndCountType } from "../constants/findAndCountType.js";

export interface ITagService {
  createTag(dto: CreateTagDto): Promise<void>;
  deleteTag(id: string): Promise<void>;
  searchTags(dto: SearchTagDto): Promise<FindAndCountType<Tags>>;
  getRandomTags(limit?: number): Promise<Tags[]>;
  getNovelsByTagId(
    dto: GetTagNovelsDto,
    allowAdultContent?: boolean,
  ): Promise<FindAndCountType<Novel>>;
}
