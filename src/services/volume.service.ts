import { ConflictError } from "../errors/conflict.error.js";
import { INovelRepository } from "../interfaces/novel.repo.interface.js";
import { IVolumeRepository } from "../interfaces/volume.repo.interface.js";
import { IVolumeService } from "../interfaces/volume.service.interface.js";
import { CreateVolumeDTO } from "../schemas/create.volume.schema.js";

export class VolumeService implements IVolumeService {
  constructor(
    private volumeRepo: IVolumeRepository,
    private novelRepo: INovelRepository,
  ) {}

  async createVolume(dto: CreateVolumeDTO, isAdmin: boolean, userId: string) {
    const isOwner = await this.novelRepo.isOwnerControl(dto.novelId, userId);

    if (!isOwner) {
      throw new ConflictError(
        "invalid_access",
        "Bu romanin sahibi degilsiniz.",
      );
    }

    const lastVolume = await this.volumeRepo.getLastVolume(dto.novelId);
    const nextOrder = lastVolume ? Math.floor(lastVolume.orderIndex) + 1 : 1;

    await this.volumeRepo.create({
      novelId: dto.novelId,
      orderIndex: nextOrder,
      name: dto.name ?? null,
    });
  }

  async deleteVolume(volumeId: string, isAdmin: boolean, userId: string) {
    const volume = await this.volumeRepo.getOneById(volumeId);

    if (!volume) {
      throw new ConflictError(
        "volume_not_found",
        "Silinmek istenen cilt mevcut degil.",
      );
    }

    const isOwner = await this.volumeRepo.isOwnerControl(volumeId, userId);

    if (!isOwner) {
      throw new ConflictError(
        "invalid_access",
        "Bu romanin sahibi degilsiniz.",
      );
    }

    await this.ensureVolumeCanBeDeleted(volumeId);
    await this.volumeRepo.deleteAndCloseGap(
      volumeId,
      volume.novelId,
      volume.orderIndex,
    );
  }

  async getVolumeByNovelId(novelId: string) {
    return await this.volumeRepo.getVolumeByNovelId(novelId);
  }

  async updateVolume(
    volumeId: string,
    name: string,
    isAdmin: boolean,
    userId: string,
  ) {
    const exist = await this.volumeRepo.existControl(volumeId);
    if (!exist) {
      throw new ConflictError(
        "volume_not_found",
        "Guncellenmek istenen cilt mevcut degil.",
      );
    }

    const isOwner = await this.volumeRepo.isOwnerControl(volumeId, userId);

    if (!isOwner) {
      throw new ConflictError(
        "invalid_access",
        "Bu romanin sahibi degilsiniz.",
      );
    }

    await this.volumeRepo.update(volumeId, name);
  }

  private async ensureVolumeCanBeDeleted(volumeId: string) {
    const isEmpty = await this.volumeRepo.isVolumeEmpty(volumeId);
    if (!isEmpty) {
      throw new ConflictError(
        "volume_not_empty",
        "Bu cilt bos degil, silmeden once icindeki bolumleri silmeniz gerekiyor.",
      );
    }
  }
}
