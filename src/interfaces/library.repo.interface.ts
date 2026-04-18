import { FindAndCountType } from "../constants/findAndCountType.js";
import { GetMyLibraryDto } from "../schemas/get.my.library.schema.js";

export interface ILibraryRepository {
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
  toggleNovelInLibrary(novelId: string, userId: string): Promise<void>;
  existInLibrary(novelId: string, userId: string): Promise<boolean>;
}
