import { CreateTagDto } from "../schemas/create.tag.schema.js";

export interface ITagService {
  createTag(dto: CreateTagDto): Promise<void>;
  deleteTag(id: string): Promise<void>;
}
