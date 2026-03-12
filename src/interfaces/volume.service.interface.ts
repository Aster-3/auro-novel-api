import { CreateVolumeDTO } from "../schemas/create.volume.schema.js";

export interface IVolumeService {
  createVolume(dto: CreateVolumeDTO): Promise<boolean>;
  deleteVolume(id: string): Promise<void>;
  getVolumeByNovelId(novelId: string): Promise<CreateVolumeDTO[]>;
}
