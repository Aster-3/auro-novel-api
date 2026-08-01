import { FindAndCountType } from "../constants/findAndCountType.js";
import { GetMyLibraryDto } from "../schemas/get.my.library.schema.js";
import { GetUserLibraryShowcaseDto } from "../schemas/get.user.showcase.schema.js";

export interface ILibraryService {
  toggleNovelInLibrary(novelId: string, userId: string): Promise<void>;
  getMyLibrary(dto: GetMyLibraryDto, viewerId?: string): Promise<
    FindAndCountType<{
      novelId: string;
      title: string;
      authorName: string;
      authorIsDeleted: boolean;
      coverImageUrl?: string | null;
      isHidden: boolean;
      addedAt: Date;
    }>
  >;
  getPublicUserLibrary(
    dto: GetUserLibraryShowcaseDto,
    allowAdultContent?: boolean,
    viewerId?: string,
  ): Promise<
    FindAndCountType<{
      novelId: string;
      title: string;
      authorName: string;
      authorIsDeleted: boolean;
      coverImageUrl?: string | null;
      isHidden: boolean;
      addedAt: Date;
    }>
  >;
  addNovelToLibrary(novelId: string, userId: string): Promise<void>;
  removeNovelFromLibrary(novelId: string, userId: string): Promise<void>;
  isNovelInLibrary(novelId: string, userId: string): Promise<boolean>;
}
