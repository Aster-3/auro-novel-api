import { CreateVolumeDTO } from "../schemas/create.volume.schema.js";

export interface IVolumeRepository {
  create(dto: CreateVolumeDTO): Promise<boolean>;
  delete(id: string): Promise<void>;
}
