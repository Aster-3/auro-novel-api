import { FindAndCountType } from "../constants/findAndCountType.js";
import { GetMyLibraryDto } from "../schemas/get.my.library.schema.js";
import { GetUserLibraryShowcaseDto } from "../schemas/get.user.showcase.schema.js";

export interface ILibraryRepository {
  getMyLibrary(dto: GetMyLibraryDto): Promise<
    FindAndCountType<{
      novelId: string;
      title: string;
      authorName: string;
      coverImageUrl?: string | null;
      isHidden: boolean;
      addedAt: Date;
    }>
  >;
  getPublicUserLibrary(dto: GetUserLibraryShowcaseDto): Promise<
    FindAndCountType<{
      novelId: string;
      title: string;
      authorName: string;
      coverImageUrl?: string | null;
      isHidden: boolean;
      addedAt: Date;
      lastChapterProgress: number | null;
      totalReadTime: number | null;
      lastReadAt: Date | null;
      lastReadChapter: {
        id: string;
        title: string;
      } | null;
      readChapterCount: number;
      totalChapterCount: number;
      readingProgressPercent: number;
    }>
  >;
  addNovelToLibrary(novelId: string, userId: string): Promise<void>;
  removeNovelFromLibrary(novelId: string, userId: string): Promise<void>;
  toggleNovelInLibrary(novelId: string, userId: string): Promise<void>;
  existInLibrary(novelId: string, userId: string): Promise<boolean>;
}
