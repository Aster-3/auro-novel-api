import { FindAndCountType } from "../constants/findAndCountType.js";
import { Chapter } from "../entities/Chapter.js";
import { CreateChapterDTO } from "../schemas/create.chapter.schema.js";
import { GetChaptersDto } from "../schemas/get.chapters.schema.js";
import { UpdateChapterDTO } from "../schemas/update.chapter.schema.js";
export interface IChapterRepository {
  createChapter(dto: CreateChapterDTO): Promise<void>;
  updateChapter(dto: UpdateChapterDTO): Promise<void>;
  deleteChapter(id: string): Promise<void>;
  getDraftChaptersByNovelId(
    dto: GetChaptersDto,
  ): Promise<FindAndCountType<Chapter>>;
  getOneDraftChapterById(id: string): Promise<Chapter | null>;
  getAuthorIdByChapterId(chapterId: string): Promise<string | null>;
}
