import { FindAndCountType } from "../constants/findAndCountType.js";
import { SeriesStatus } from "../constants/series.constants.js";
import { ChapterPublication } from "../entities/ChapterPublication.js";
import { GetChaptersDto } from "../schemas/get.chapters.schema.js";

export interface ChapterListItem {
  id: string;
  title: string;
  chapterOrder: number;
  globalDisplayOrder: number;
  volumeDisplayOrder: number;
  volumeOrder: number;
  volumeName: string | null;
  volumeId: string;
  publishedAt: Date;
}

export interface ChapterPublicationMeta {
  id: string;
  title: string;
  sortKey: number;
  chapterOrder: number;
  globalDisplayOrder: number;
  volumeDisplayOrder: number;
  volumeOrder: number;
  volumeId: string;
  authorId: string | null;
  novelId: string;
}

export interface IChapterPublicationRepository {
  create(entity: Partial<ChapterPublication>): Promise<void>;
  getChaptersByNovelId(
    dto: GetChaptersDto,
    userId: string,
    isAdmin: boolean,
  ): Promise<FindAndCountType<ChapterListItem>>;
  getChapterForReading(id: string): Promise<{
    id: string;
    title: string;
    content: string;
    sortKey: number;
    chapterOrder: number;
    globalDisplayOrder: number;
    volumeDisplayOrder: number;
    volumeOrder: number;
    volumeId: string;
    volumeTitle: string | null;
    authorId: string | null;
    novelId: string;
    novelStatus: SeriesStatus;
  } | null>;
  getPublishedChaptersForDownload(novelId: string): Promise<
    {
      id: string;
      title: string;
      content: string;
      chapterOrder: number;
      globalDisplayOrder: number;
      volumeDisplayOrder: number;
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
      globalDisplayOrder: number;
      volumeDisplayOrder: number;
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
    globalDisplayOrder: number;
    volumeDisplayOrder: number;
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
      globalDisplayOrder: number;
      volumeDisplayOrder: number;
      volumeId: string;
      volumeName: string | null;
      volumeOrder: number;
      publishedAt: Date;
      updatedAt: Date;
      wordCount: number;
    }[]
  >;
  getChapterForMeta(id: string): Promise<ChapterPublicationMeta | null>;
  getLastSortKeyInVolume(
    volumeId: string,
    excludedChapterId?: string,
  ): Promise<number>;
  otherChaptersExistInVolume(
    chapterId: string,
    volumeId: string,
  ): Promise<boolean>;
  getFirstSortKeyInVolume(
    volumeId: string,
    excludedChapterId?: string,
  ): Promise<number | null>;
  getPreviousSortKeyInVolume(
    volumeId: string,
    sortKey: number,
    excludedChapterId?: string,
  ): Promise<number | null>;
  getNextSortKeyInVolume(
    volumeId: string,
    sortKey: number,
    excludedChapterId?: string,
  ): Promise<number | null>;
  getSortKeyByChapterIdInVolume(
    chapterId: string,
    volumeId: string,
  ): Promise<number | null>;
  updatePlacement(
    chapterId: string,
    volumeId: string,
    sortKey: number,
  ): Promise<void>;
  rebalanceVolume(volumeId: string): Promise<void>;
  getNextChapter(
    novelId: string,
    sortKey: number,
    volumeOrder: number,
  ): Promise<string | null>;
  getPreviousChapter(
    novelId: string,
    sortKey: number,
    volumeOrder: number,
  ): Promise<string | null>;
}
