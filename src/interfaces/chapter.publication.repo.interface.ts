import { PublicationStatus } from "../constants/chapter.constants.js";
import { FindAndCountType } from "../constants/findAndCountType.js";
import { SeriesStatus } from "../constants/series.constants.js";
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
    volumeTitle: string | null;
    authorId: string | null;
    publicationStatus: PublicationStatus;
    novelId: string;
    novelStatus: SeriesStatus;
  } | null>;
  getPublishedChaptersForDownload(novelId: string): Promise<
    {
      id: string;
      title: string;
      content: string;
      chapterOrder: number;
      volumeId: string;
      volumeName: string | null;
      volumeOrder: number;
      publishedAt: Date;
      updatedAt: Date;
    }[]
  >;
  getPublishedChaptersManifest(novelId: string): Promise<
    {
      id: string;
      title: string;
      chapterOrder: number;
      volumeId: string;
      volumeName: string | null;
      volumeOrder: number;
      publishedAt: Date;
      updatedAt: Date;
      wordCount: number;
    }[]
  >;
  getPublishedChapterForOffline(chapterId: string): Promise<{
    id: string;
    novelId: string;
    title: string;
    content: string;
    chapterOrder: number;
    volumeId: string;
    volumeName: string | null;
    volumeOrder: number;
    publishedAt: Date;
    updatedAt: Date;
    wordCount: number;
  } | null>;
  getPublishedChaptersByIdsForDownload(
    novelId: string,
    chapterIds: string[],
  ): Promise<
    {
      id: string;
      novelId: string;
      title: string;
      content: string;
      chapterOrder: number;
      volumeId: string;
      volumeName: string | null;
      volumeOrder: number;
      publishedAt: Date;
      updatedAt: Date;
      wordCount: number;
    }[]
  >;
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
  changePublicationStatus(
    chapterId: string,
    publicationStatus: PublicationStatus,
  ): Promise<void>;
  getNextChapter(
    novelId: string,
    chapterOrder: number,
    volumeOrder: number,
  ): Promise<string | null>;
  getPreviousChapter(
    novelId: string,
    chapterOrder: number,
    volumeOrder: number,
  ): Promise<string | null>;
}
