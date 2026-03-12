import { FindAndCountType } from "../constants/findAndCountType.js";
import { Chapter } from "../entities/Chapter.js";
import { CreateChapterDTO } from "../schemas/create.chapter.schema.js";
import { GetChaptersDto } from "../schemas/get.chapters.schema.js";
import { UpdateChapterDTO } from "../schemas/update.chapter.schema.js";
export interface IChapterRepository {
  create(dto: CreateChapterDTO): Promise<boolean>;
  delete(id: string): Promise<void>;
  getChapterByNovelId(dto: GetChaptersDto): Promise<FindAndCountType<Chapter>>;
  duplicateControl(novelId: string, order: number): Promise<boolean>;
  updateChapter(dto: UpdateChapterDTO): Promise<void>;
}
