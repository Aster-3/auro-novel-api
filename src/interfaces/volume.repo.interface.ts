export interface IVolumeRepository {
  existById(id: number): Promise<boolean>;
  delete(id: number): Promise<void>;
}
