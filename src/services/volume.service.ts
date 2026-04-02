import { ConflictError } from "../errors/conflict.error.js";
import { IVolumeRepository } from "../interfaces/volume.repo.interface.js";
import { IVolumeService } from "../interfaces/volume.service.interface.js";
import { CreateVolumeDTO } from "../schemas/create.volume.schema.js";

export class VolumeService implements IVolumeService {
  constructor(private volumeRepo: IVolumeRepository) {}

  async createVolume(dto: CreateVolumeDTO, isAdmin: boolean, userId: string) {
    const isOwner = await this.volumeRepo.isOwnerControlByNovelId(
      dto.novelId,
      userId,
    );
    if (!isAdmin && !isOwner) {
      throw new ConflictError(
        "invalid_access",
        "Bu romanın sahibi değilsiniz.",
      );
    }
    const lastVolume = await this.volumeRepo.getLastVolume(dto.novelId);
    const currentMaxInteger = Math.floor(lastVolume?.orderIndex ?? 0);

    if (!isAdmin || dto.orderIndex === undefined || dto.orderIndex === null) {
      const nextOrder = lastVolume ? Math.floor(lastVolume.orderIndex) + 1 : 1;

      await this.volumeRepo.create({
        novelId: dto.novelId,
        orderIndex: nextOrder,
        name: dto.name ?? null,
      });
      return;
    }

    const incomingOrder = dto.orderIndex!;

    if (incomingOrder > currentMaxInteger + 1) {
      throw new ConflictError(
        "Cilt Sırası",
        `Sıradaki cilt en fazla ${currentMaxInteger + 1} olabilir. Arada boşluk bırakamazsınız.`,
      );
    }

    const exists = await this.volumeRepo.duplicateControl(
      dto.novelId,
      incomingOrder,
    );

    if (exists) {
      throw new ConflictError(
        "Cilt Sırası",
        `${incomingOrder} numaralı cilt zaten mevcut.`,
      );
    }

    await this.volumeRepo.create({
      novelId: dto.novelId,
      orderIndex: incomingOrder,
      name: dto.name ?? null,
    });
  }

  async deleteVolume(id: string) {
    await this.volumeRepo.delete(id);
  }

  async getVolumeByNovelId(novelId: string) {
    return await this.volumeRepo.getVolumeByNovelId(novelId);
  }
}
