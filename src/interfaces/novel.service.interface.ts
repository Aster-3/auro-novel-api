import { FindAndCountType } from "../constants/findAndCountType.js";
import { Novel } from "../entities/Novel.js";
import { CreateNovelDTo } from "../schemas/create.novel.schema.js";
import { GetNovelsDTo } from "../schemas/get.novels.schema.js";
import { UpdateNovelDTO } from "../schemas/update.novel.schema.js";

export interface INovelService {
  create(dto: CreateNovelDTo, file?: Express.Multer.File): Promise<Novel>;
  getNovels(dto: GetNovelsDTo): Promise<FindAndCountType<Novel>>;
  getNovelDetailWithId(id: string): Promise<Novel>;
  updateNovelCategories(novelId: string, categoryIds: number[]): Promise<void>;
  updateNovelTags(novelId: string, tagIds: string[]): Promise<void>;
  checkNovelExists(id: string): Promise<boolean>;
  incrementViewCount(novelId: string): Promise<void>;
  updateNovel(dto: UpdateNovelDTO): Promise<void>;
  deleteNovel(novelId: string): Promise<void>;
  isOwnerControl(novelId: string, authorId: string): Promise<boolean>;
}
