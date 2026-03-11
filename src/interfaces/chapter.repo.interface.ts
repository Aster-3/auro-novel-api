export interface IChapterRepository {
  create(dto: CreateChapterDto): Promise<boolean>;
  existById(id: number): Promise<boolean>;
  delete(id: number): Promise<void>;
}
