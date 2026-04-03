import { FindAndCountType } from "../constants/findAndCountType.js";
import { Volume } from "../entities/Volume.js";
import { CreateVolumeDTO } from "../schemas/create.volume.schema.js";

export interface IVolumeRepository {
  create(dto: CreateVolumeDTO): Promise<string>;
  getOneById(id: string): Promise<Volume | null>;
  existControl(volumeId: string): Promise<boolean>;
  isOwnerControl(volumeId: string, authorId: string): Promise<boolean>;
  duplicateControl(novelId: string, order: number): Promise<boolean>;
  delete(id: string): Promise<void>;
  getLastVolume(novelId: string): Promise<Volume | null>;
  getVolumeByNovelId(novelId: string): Promise<CreateVolumeDTO[]>;
  hasAnyEmptyPreviousVolume(
    novelId: string,
    currentOrderIndex: number,
  ): Promise<boolean>;
  hasUnpublishedPreviousVolume(
    novelId: string,
    currentOrderIndex: number,
  ): Promise<boolean>;
  findOldestEmptyOrLatestVolume(novelId: string): Promise<Volume | null>;
  isVolumeInNovel(volumeId: string, novelId: string): Promise<boolean>;
  hasPublishedInNextVolumes(
    novelId: string,
    currentOrderIndex: number,
  ): Promise<boolean>;
  hasAnyNextVolume(
    novelId: string,
    currentOrderIndex: number,
  ): Promise<boolean>;
  isOwnerControlByNovelId(novelId: string, authorId: string): Promise<boolean>;
  // This method is used to check if there are any published chapters in the next volumes of the current volume.
  isLastVolumeWithChapters(
    novelId: string,
    currentOrderIndex: number,
  ): Promise<boolean>;
}
