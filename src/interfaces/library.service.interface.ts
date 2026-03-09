export interface ILibraryService {
  addNovelToLibrary(novelId: string, userId: string): Promise<void>;
  removeNovelFromLibrary(novelId: string, userId: string): Promise<void>;
}
