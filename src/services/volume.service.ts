import { ConflictError } from "../errors/conflict.error.js";
import { IVolumeRepository } from "../interfaces/volume.repo.interface.js";
import { IVolumeService } from "../interfaces/volume.service.interface.js";
import { CreateVolumeDTO } from "../schemas/create.volume.schema.js";

export class VolumeService implements IVolumeService {
  constructor(private volumeRepo: IVolumeRepository) {}

  async createVolume(dto: CreateVolumeDTO) {
    console.log("Volume:", dto);
    const lastOrder = await this.volumeRepo.getLastVolumeOrder(dto.novelId);
    const currentMaxInteger = Math.floor(lastOrder);
    const incomingOrder = dto.order;
    console.log("Last Order:", lastOrder, currentMaxInteger, incomingOrder);
    if (incomingOrder > currentMaxInteger + 1) {
      throw new ConflictError(
        "Cilt Id",
        `Sıradaki cilt en fazla ${currentMaxInteger + 1} olabilir. Arada boşluk bırakamazsınız.`,
      );
    }

    const exists = await this.volumeRepo.duplicateControl(
      dto.novelId,
      incomingOrder,
    );
    if (exists) {
      throw new ConflictError(
        "Cilt Id",
        `${incomingOrder} numaralı cilt zaten mevcut.`,
      );
    }

    return await this.volumeRepo.create(dto);
  }

  async deleteVolume(id: string) {
    await this.volumeRepo.delete(id);
  }

  async getVolumeByNovelId(novelId: string) {
    return await this.volumeRepo.getVolumeByNovelId(novelId);
  }
}
