import { FindAndCountType } from "../constants/findAndCountType.js";
import { ChapterPublication } from "../entities/ChapterPublication.js";
import { GetChaptersDto } from "../schemas/get.chapters.schema.js";
import { CreatePublicationDTO } from "../schemas/publish.chapter.schema.js";

export interface IChapterPublicationRepository {
  create(entity: Partial<ChapterPublication>): Promise<void>;
  getChaptersByNovelId(
    dto: GetChaptersDto,
    userId: string,
    isAdmin: boolean,
  ): Promise<
    FindAndCountType<{
      id: string;
      title: string;
      chapterOrder: number;
      volumeOrder: number;
      volumeName: string | null;
      volumeId: string;
      isLocked: boolean;
      createdAt: Date;
      isUnpublished?: boolean;
    }>
  >;
  getChapterForReading(id: string): Promise<{
    id: string;
    title: string;
    content: string;
    chapterOrder: number;
    volumeOrder: number;
    volumeId: string;
    paywallStartChapter: number | null;
    paywallStartVolume: number | null;
    authorId: string | null;
  } | null>;
  getChapterForMeta(id: string): Promise<{
    id: string;
    title: string;
    chapterOrder: number;
    volumeOrder: number;
    volumeId: string;
    authorId: string | null;
    novelId: string;
  } | null>;
  getLastChapterOrderInVolume(volumeId: string): Promise<number>;
  otherChaptersExistInVolume(
    chapterId: string,
    volumeId: string,
  ): Promise<boolean>;
  closeGapInVolume(volumeId: string, from: number): Promise<void>;
}
