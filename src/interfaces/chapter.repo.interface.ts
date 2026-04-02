import { FindAndCountType } from "../constants/findAndCountType.js";
import { Chapter } from "../entities/_index.js";
import { CreateChapterDTO } from "../schemas/create.chapter.schema.js";
import { GetChaptersDto } from "../schemas/get.chapters.schema.js";
import { UpdateChapterDTO } from "../schemas/update.chapter.schema.js";
export interface IChapterRepository {
  create(dto: CreateChapterDTO): Promise<boolean>;
  delete(id: string): Promise<void>;
  getOneChapter(id: string): Promise<Chapter | null>;
  getChapters(dto: GetChaptersDto): Promise<
    FindAndCountType<{
      id: string;
      title: string;
      chapterOrder: number;
      volumeOrder: number;
      volumeName: string | null;
      volumeId: string;
      isLocked: boolean;
      createdAt: Date;
    }>
  >;
  getDraftChapterByNovelId(dto: GetChaptersDto): Promise<
    FindAndCountType<{
      id: string;
      title: string;
      chapterOrder: number;
      volumeOrder: number;
      volumeName: string | null;
      createdAt: Date;
    }>
  >;
  duplicateControl(volumeId: string, order: number): Promise<boolean>;
  updateChapter(dto: UpdateChapterDTO): Promise<void>;
  getLastChapterInVolume(
    novelId: string,
    volumeId: string,
  ): Promise<Chapter | null>;
  getSummary(
    novelId: string,
  ): Promise<{ total: number; lastPublishedAt: Date | null }>;
  existControl(id: string): Promise<boolean>;
  getMaxOrderIndexInVolume(volumeId: string): Promise<number>;
  closeGapInVolume(volumeId: string, orderIndex: number): Promise<void>;
  getNovelIdByChapterId(chapterId: string): Promise<string | null>;
  isPurchased(chapterId: string): Promise<boolean>;
  getShortInfoById(chapterId: string): Promise<{
    id: string;
    novelId: string;
    volumeId: string;
    orderIndex: number;
    publishedAt: Date | null;
    isPublished: boolean;
    novel: {
      id: string;
      author: {
        userId?: string;
      };
    };
    volume: {
      orderIndex: number;
    };
  } | null>;
  getLastPublishedChapterIndexInVolume(volumeId: string): Promise<number>;
  hasPublishedAfterInVolume(
    volumeId: string,
    orderIndex: number,
  ): Promise<boolean>;
  hasOtherPublishedInVolume(
    chapterId: string,
    volumeId: string,
  ): Promise<boolean>;

  hasAnyAfterInVolume(volumeId: string, orderIndex: number): Promise<boolean>;
  hasOtherChaptersInVolume(
    chapterId: string,
    volumeId: string,
  ): Promise<boolean>;
}
