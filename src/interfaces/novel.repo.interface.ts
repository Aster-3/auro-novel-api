import { Novel } from "../entities/Novel.js";
import { FindAndCountType } from "../constants/findAndCountType.js";
import { CreateNovelDTo } from "../schemas/create.novel.schema.js";
import { GetNovelsDTo } from "../schemas/get.novels.schema.js";
import { UpdateNovelDTO } from "../schemas/update.novel.schema.js";

export interface INovelRepository {
  create(novel: CreateNovelDTo): Promise<Novel>;
  getNovels(dto: GetNovelsDTo): Promise<FindAndCountType<Novel>>;
  findOneById(id: string): Promise<Novel | null>;
  existControl(identifier: { id?: string; slug?: string }): Promise<boolean>;
  updateNovelCategories(novelId: string, categoryIds: number[]): Promise<void>;
  updateNovelTags(novelId: string, tagIds: string[]): Promise<void>;
  incrementViewCount(novelId: string): Promise<void>;
  updateNovel(dto: UpdateNovelDTO): Promise<void>;
  isOwnerControl(novelId: string, authorId: string): Promise<boolean>;
}
