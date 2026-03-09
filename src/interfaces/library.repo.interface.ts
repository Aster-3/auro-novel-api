export interface ILibraryRepository {
  addNovelToLibrary(novelId: string, userId: string): Promise<void>;
  removeNovelFromLibrary(novelId: string, userId: string): Promise<void>;
}
