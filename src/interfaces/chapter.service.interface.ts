import { PublicationStatus } from "../constants/chapter.constants.js";
import { FindAndCountType } from "../constants/findAndCountType.js";
import { Chapter } from "../entities/Chapter.js";
import { CreateChapterDTO } from "../schemas/create.chapter.schema.js";
import { GetChaptersDto } from "../schemas/get.chapters.schema.js";
import { CreatePublicationDTO } from "../schemas/publish.chapter.schema.js";
import { UpdateChapterDTO } from "../schemas/update.chapter.schema.js";

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

  changePublicationStatus({
    chapterId,
    publicationStatus,
    authorId,
    isAdmin,
  }: {
    chapterId: string;
    publicationStatus: PublicationStatus;
    authorId: string;
    isAdmin: boolean;
  }): Promise<void>;

  getChapterForReading(
    id: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<{
    id: string;
    title: string;
    content: string;
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

  getNovelDownloadPackage(novelId: string): Promise<{
    novel: {
      id: string;
      name: string;
      coverImage: string | null;
      synopsis: string | null;
      status: string;
      chapterCount: number;
      lastChapterDate: Date | null;
    };
    generatedAt: string;
    chapters: {
      id: string;
      title: string;
      content: string;
      chapterOrder: number;
      volumeId: string;
      volumeName: string | null;
      volumeOrder: number;
      publishedAt: Date;
      updatedAt: Date;
    }[];
  }>;

  getOfflineManifest(novelId: string): Promise<{
    novel: {
      id: string;
      name: string;
      slug: string;
      coverImage: string | null;
      synopsis: string | null;
      status: string;
      chapterCount: number;
      lastChapterDate: Date | null;
      updatedAt: Date;
    };
    generatedAt: string;
    totalPublishedChapters: number;
    chapters: {
      id: string;
      title: string;
      chapterOrder: number;
      volumeId: string;
      volumeName: string | null;
      volumeOrder: number;
      publishedAt: Date;
      updatedAt: Date;
      wordCount: number;
    }[];
  }>;

  getChapterOfflinePackage(chapterId: string): Promise<{
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
  }>;

  getOfflineChaptersPackage(
    novelId: string,
    chapterIds: string[],
  ): Promise<{
    novel: {
      id: string;
      name: string;
      slug: string;
      coverImage: string | null;
      synopsis: string | null;
      status: string;
      chapterCount: number;
      lastChapterDate: Date | null;
      updatedAt: Date;
    };
    requestedChapterCount: number;
    returnedChapterCount: number;
    skippedChapterIds: string[];
    generatedAt: string;
    chapters: {
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
    }[];
  }>;
}
