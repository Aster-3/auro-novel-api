import { FindAndCountType } from "../constants/findAndCountType.js";
import { CreateChapterDTO } from "../schemas/create.chapter.schema.js";
import { GetChaptersDto } from "../schemas/get.chapters.schema.js";
import { UpdateChapterDTO } from "../schemas/update.chapter.schema.js";
export interface IChapterRepository {
  create(dto: CreateChapterDTO): Promise<boolean>;
  delete(id: string): Promise<void>;
  getChapterByNovelId(dto: GetChaptersDto): Promise<
    FindAndCountType<{
      id: string;
      title: string;
      order: number;
      isUnlocked: boolean;
    }>
  >;
  duplicateControl(novelId: string, order: number): Promise<boolean>;
  updateChapter(dto: UpdateChapterDTO): Promise<void>;
  getLastChapterOrder(novelId: string): Promise<number>;
  getSummary(
    novelId: string,
  ): Promise<{ total: number; lastPublishedAt: Date | null }>;
  existControl(id: string): Promise<boolean>;
  getLockStatus(chapterId: string): Promise<boolean | null>;
}
