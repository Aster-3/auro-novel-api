import { CreateTagDto } from "../schemas/create.tag.schema.js";

export interface ITagRepository {
  create(dto: CreateTagDto): Promise<void>;
  delete(id: string): Promise<void>;
}
