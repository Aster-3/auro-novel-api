import { FindAndCountType } from "../constants/findAndCountType.js";
import { Novel } from "../entities/Novel.js";
import { CreateNovelDTo } from "../schemas/create.novel.schema.js";

export interface INovelService {
  create(dto: CreateNovelDTo): Promise<Novel | null>;
  findAll(query: {
    filter?: Partial<Novel>;
    page?: number;
    limit?: number;
  }): Promise<FindAndCountType<Novel>>;
  findOneBy(criteria: Partial<Novel>): Promise<Novel | null>;
}
