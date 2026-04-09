import { CreateVolumeDTO } from "../schemas/create.volume.schema.js";

export interface IVolumeService {
  createVolume(
    dto: CreateVolumeDTO,
    isAdmin: boolean,
    userId: string,
  ): Promise<void>;
  deleteVolume(id: string, isAdmin: boolean, userId: string): Promise<void>;
  getVolumeByNovelId(novelId: string): Promise<CreateVolumeDTO[]>;
  updateVolume(
    volumeId: string,
    name: string,
    isAdmin: boolean,
    userId: string,
  ): Promise<void>;
}
