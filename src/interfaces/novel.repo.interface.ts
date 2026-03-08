import { DeepPartial } from "typeorm";
import { Novel } from "../entities/Novel.js";
import { FindAndCountType } from "../constants/findAndCountType.js";
import { CreateNovelDTo } from "../schemas/create.novel.schema.js";

export interface INovelRepository {
  create(novel: CreateNovelDTo): Promise<Novel | null>;
  findAll(options: {
    where: any;
    page: number;
    limit: number;
  }): Promise<FindAndCountType<Novel>>;
  findOne(criteria: Partial<Novel>): Promise<Novel | null>;
}
