import { CreateChapterDTO } from "../schemas/create.chapter.schema.js";
import { UpdateChapterDTO } from "../schemas/update.chapter.schema.js";

export interface IChapterService {
  getOneChapter(
    id: string,
    userId: string,
  ): Promise<{
    id: string;
    title: string;
    content: string;
    chapterOrder: number;
    volumeOrder: number;
    volumeId: string;
  }>;
  create(
    dto: CreateChapterDTO,
    isAdmin: boolean,
    authorId: string,
  ): Promise<boolean>;
  delete(id: string, userId: string): Promise<void>;
  updateChapter(
    dto: UpdateChapterDTO,
    authorId: string,
    isAdmin: boolean,
  ): Promise<void>;
  getSummary(
    novelId: string,
  ): Promise<{ total: number; lastPublishedAt: Date | null }>;
}
