import { FindAndCountType } from "../constants/findAndCountType.js";
import { GetMyLibraryDto } from "../schemas/get.my.library.schema.js";

export interface ILibraryService {
  toggleNovelInLibrary(novelId: string, userId: string): Promise<void>;
  getMyLibrary(dto: GetMyLibraryDto): Promise<
    FindAndCountType<
      {
        novelId: string;
        title: string;
        authorName: string;
        isHidden: boolean;
        addedAt: Date;
      }[]
    >
  >;
  isNovelInLibrary(novelId: string, userId: string): Promise<boolean>;
}
