import { Repository } from "typeorm";
import { Volume } from "../entities/Volume.js";
import { IVolumeRepository } from "../interfaces/volume.repo.interface.js";
import { CreateVolumeDTO } from "../schemas/create.volume.schema.js";

export class VolumeRepository implements IVolumeRepository {
  constructor(private volumeRepo: Repository<Volume>) {}

  async create(dto: CreateVolumeDTO) {
    const volume = await this.volumeRepo.save(dto);
    if (!volume) return false;
    return true;
  }

  async delete(id: string) {
    await this.volumeRepo.delete(id);
  }

  async existControl(volumeId: string) {
    const exist = await this.volumeRepo.exists({
      where: {
        id: volumeId,
      },
    });
    return exist;
  }

  async getLastVolumeOrder(novelId: string) {
    const lastVolume = await this.volumeRepo.findOne({
      where: { novelId },
      order: { order: "DESC" },
    });
    return lastVolume ? lastVolume.order : 0;
  }

  async duplicateControl(novelId: string, order: number) {
    const exist = await this.volumeRepo.exists({
      where: {
        novelId,
        order,
      },
    });
    return exist;
  }

  async getVolumeByNovelId(novelId: string) {
    return await this.volumeRepo.find({
      where: { novelId },
      order: { order: "ASC" },
    });
  }
}
