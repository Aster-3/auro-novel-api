import { CreateVolumeDTO } from "../schemas/create.volume.schema.js";

export interface IVolumeRepository {
  create(dto: CreateVolumeDTO): Promise<boolean>;
  existControl(volumeId: string): Promise<boolean>;
  duplicateControl(novelId: string, order: number): Promise<boolean>;
  delete(id: string): Promise<void>;
  getLastVolumeOrder(novelId: string): Promise<number>;
  getVolumeByNovelId(novelId: string): Promise<CreateVolumeDTO[]>;
}
