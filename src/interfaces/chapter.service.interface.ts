import { FindAndCountType } from "../constants/findAndCountType.js";
import { Chapter } from "../entities/_index.js";
import { CreateChapterDTO } from "../schemas/create.chapter.schema.js";
import { GetChaptersDto } from "../schemas/get.chapters.schema.js";

export interface IChapterService {
  create(dto: CreateChapterDTO): Promise<boolean>;
  delete(id: string): Promise<void>;
  getChapterByNovelId(dto: GetChaptersDto): Promise<FindAndCountType<Chapter>>;
}
