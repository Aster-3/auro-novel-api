import { ConflictError } from "../errors/conflict.error.js";
import { ForbiddenError } from "../errors/forbidden.error.js";
import { NotFoundError } from "../errors/not.found.error.js";
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
    await this.ensureNovelCanBeModified(dto.novelId, isAdmin);

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
    await this.ensureNovelCanBeModified(volume.novelId, isAdmin);

    await this.ensureVolumeCanBeDeleted(volumeId);
    await this.volumeRepo.deleteAndCloseGap(
      volumeId,
      volume.novelId,
      volume.orderIndex,
    );
  }

  async getVolumeByNovelId(
    novelId: string,
    userId?: string,
    isAdmin = false,
  ) {
    const novel = await this.novelRepo.findOneById(novelId, userId, {
      includeBanned: true,
    });
    if (!novel) {
      throw new NotFoundError("Roman bulunamadi.");
    }

    if (
      novel.bannedUntil &&
      novel.bannedUntil > new Date() &&
      !isAdmin &&
      novel.author?.userId !== userId
    ) {
      throw new NotFoundError("Roman bulunamadi.");
    }

    return await this.volumeRepo.getVolumeByNovelId(novelId);
  }

  async updateVolume(
    volumeId: string,
    name: string,
    isAdmin: boolean,
    userId: string,
  ) {
    const volume = await this.volumeRepo.getOneById(volumeId);
    if (!volume) {
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
    await this.ensureNovelCanBeModified(volume.novelId, isAdmin);

    await this.volumeRepo.update(volumeId, name);
  }

  private async ensureNovelCanBeModified(novelId: string, isAdmin: boolean) {
    if (isAdmin) return;

    const novel = await this.novelRepo.findOneById(novelId, undefined, {
      includeBanned: true,
    });

    if (!novel) {
      throw new NotFoundError("Roman bulunamadi.");
    }

    if (novel.bannedUntil && novel.bannedUntil > new Date()) {
      throw new ForbiddenError("Banli roman uzerinde islem yapilamaz.");
    }
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
