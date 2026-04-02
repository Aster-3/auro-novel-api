import { CreateVolumeDTO } from "../schemas/create.volume.schema.js";

export interface IVolumeService {
  createVolume(
    dto: CreateVolumeDTO,
    isAdmin: boolean,
    userId: string,
  ): Promise<void>;
  deleteVolume(id: string): Promise<void>;
  getVolumeByNovelId(novelId: string): Promise<CreateVolumeDTO[]>;
}
