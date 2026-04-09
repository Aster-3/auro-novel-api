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
    console.log(
      "Milestone: Ownership check completed. isAdmin:",
      isAdmin,
      isOwner,
      userId,
      dto.novelId,
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

  async deleteVolume(volumeId: string, isAdmin: boolean, userId: string) {
    const volume = await this.volumeRepo.getOneById(volumeId);

    if (!volume) {
      throw new ConflictError(
        "Cilt bulunamadı",
        "Silinmek istenen cilt mevcut değil.",
      );
    }

    const isOwner = await this.volumeRepo.isOwnerControl(volumeId, userId);

    if (!isAdmin && !isOwner) {
      throw new ConflictError(
        "invalid_access",
        "Bu romanın sahibi değilsiniz.",
      );
    }

    const isEmpty = await this.volumeRepo.isVolumeEmpty(volumeId);
    if (!isEmpty) {
      throw new ConflictError(
        "Cilt boş değil",
        "Bu cilt boş değil, silmeden önce içindeki bölümleri silmeniz gerekiyor.",
      );
    }

    const isLastVolume = await this.volumeRepo.checkIfLastVolume(
      volume.novelId,
      volumeId,
    );
    if (!isLastVolume) {
      throw new ConflictError(
        "Son cilt değil",
        "Sadece son cilt silinebilir. Sırayı korumak için önce diğer ciltleri silmeniz gerekiyor.",
      );
    }

    await this.volumeRepo.delete(volumeId);
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
        "Cilt bulunamadı",
        "Güncellenmek istenen cilt mevcut değil.",
      );
    }

    const isOwner = await this.volumeRepo.isOwnerControl(volumeId, userId);

    if (!isAdmin && !isOwner) {
      throw new ConflictError(
        "invalid_access",
        "Bu romanın sahibi değilsiniz.",
      );
    }
    await this.volumeRepo.update(volumeId, name);
  }
}
