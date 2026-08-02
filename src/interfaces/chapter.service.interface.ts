import { FindAndCountType } from "../constants/findAndCountType.js";
import { Chapter } from "../entities/Chapter.js";
import { CreateChapterDTO } from "../schemas/create.chapter.schema.js";
import { GetChaptersDto } from "../schemas/get.chapters.schema.js";
import { MoveChapterDTO } from "../schemas/move.chapter.schema.js";
import { CreatePublicationDTO } from "../schemas/publish.chapter.schema.js";
import { UpdateChapterDTO } from "../schemas/update.chapter.schema.js";
import { ChapterListItem } from "./chapter.publication.repo.interface.js";

export interface IChapterService {
  createChapter(
    dto: CreateChapterDTO,
    authorId: string,
    isAdmin: boolean,
  ): Promise<void>;

  publishChapter(
    dto: CreatePublicationDTO,
    authorId: string,
    isAdmin: boolean,
  ): Promise<void>;

  moveChapter(
    dto: MoveChapterDTO,
    authorId: string,
    isAdmin: boolean,
  ): Promise<void>;

  updateChapter(
    dto: UpdateChapterDTO,
    authorId: string,
    isAdmin: boolean,
  ): Promise<void>;

  deleteChapter(
    chapterId: string,
    authorId: string,
    isAdmin: boolean,
  ): Promise<void>;

  getChapterForReading(
    id: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<{
    id: string;
    title: string;
    content: string;
    volumeOrder: number;
    volumeTitle: string | null;
    novelId: string;
    nextChapterId: string | null;
    previousChapterId: string | null;
    novelStatus: string;
  }>;

  getOneDraftChapter(
    id: string,
    authorId: string,
    isAdmin: boolean,
  ): Promise<Chapter | null>;

  getDraftChaptersByNovelId(
    dto: GetChaptersDto,
    userId: string,
    isAdmin: boolean,
  ): Promise<FindAndCountType<Chapter>>;

  getChaptersByNovelId(
    dto: GetChaptersDto,
    userId: string,
    isAdmin: boolean,
  ): Promise<FindAndCountType<ChapterListItem>>;

  getNovelDownloadPackage(novelId: string): Promise<any>;
  getOfflineManifest(novelId: string): Promise<any>;
  getChapterOfflinePackage(chapterId: string): Promise<any>;
  getOfflineChaptersPackage(
    novelId: string,
    chapterIds: string[],
  ): Promise<any>;
}
