import { IsNull, LessThan, MoreThan, Not, Repository } from "typeorm";
import { Volume } from "../entities/Volume.js";
import { IVolumeRepository } from "../interfaces/volume.repo.interface.js";
import { CreateVolumeDTO } from "../schemas/create.volume.schema.js";

export class VolumeRepository implements IVolumeRepository {
  constructor(private volumeRepo: Repository<Volume>) {}

  async create(dto: CreateVolumeDTO) {
    const volume = await this.volumeRepo.save(dto);
    return volume.id;
  }

  async update(volumeId: string, name: string | null) {
    await this.volumeRepo.update({ id: volumeId }, { name });
  }

  async delete(id: string) {
    await this.volumeRepo.delete(id);
  }

  async deleteAndCloseGap(
    volumeId: string,
    novelId: string,
    orderIndex: number,
  ) {
    await this.volumeRepo.manager.transaction(async (manager) => {
      await manager.delete(Volume, { id: volumeId });
      await manager
        .createQueryBuilder()
        .update(Volume)
        .set({ orderIndex: () => '"orderIndex" - 1' })
        .where('"novelId" = :novelId', { novelId })
        .andWhere('"orderIndex" > :orderIndex', { orderIndex })
        .execute();
    });
  }

  async getOneById(id: string) {
    return await this.volumeRepo.findOne({
      where: { id },
    });
  }

  async isVolumeEmpty(volumeId: string) {
    const hasChapters = await this.volumeRepo
      .createQueryBuilder("volume")
      .innerJoin("volume.chapters", "chapter")
      .where("volume.id = :volumeId", { volumeId })
      .getExists();
    return !hasChapters;
  }

  async checkIfLastVolume(novelId: string, volumeId: string): Promise<boolean> {
    const lastVolume = await this.volumeRepo.findOne({
      where: { novelId },
      order: { orderIndex: "DESC" },
      select: { id: true },
    });
    return lastVolume?.id === volumeId;
  }

  existControl(volumeId: string) {
    return this.volumeRepo.exists({
      where: { id: volumeId },
    });
  }

  async isVolumeInNovel(volumeId: string, novelId: string) {
    return await this.volumeRepo.exists({
      where: { id: volumeId, novelId },
    });
  }

  async isOwnerControl(volumeId: string, authorId: string) {
    const exist = await this.volumeRepo.exists({
      where: {
        id: volumeId,
        novel: { author: { userId: authorId } },
      },
      relations: {
        novel: { author: true },
      },
    });
    return exist;
  }

  async getLastVolume(novelId: string) {
    const lastVolume = await this.volumeRepo.findOne({
      where: { novelId },
      order: { orderIndex: "DESC" },
    });
    return lastVolume;
  }

  async duplicateControl(novelId: string, order: number) {
    const exist = await this.volumeRepo.exists({
      where: {
        novelId,
        orderIndex: order,
      },
    });
    return exist;
  }

  async getVolumeByNovelId(novelId: string) {
    return await this.volumeRepo.find({
      where: { novelId },
      order: { orderIndex: "ASC" },
    });
  }

  async hasAnyEmptyPreviousVolume(
    novelId: string,
    currentOrderIndex: number,
  ): Promise<boolean> {
    const emptyPrevious = await this.volumeRepo
      .createQueryBuilder("volume")
      .leftJoin("volume.chapters", "publication")
      .where("volume.novelId = :novelId", { novelId })
      .andWhere("volume.orderIndex < :currentOrderIndex", { currentOrderIndex })
      .groupBy("volume.id")
      .having('COUNT(publication."chapterId") = 0')
      .getOne();

    return !!emptyPrevious;
  }

  async hasUnpublishedPreviousVolume(
    novelId: string,
    currentOrderIndex: number,
  ): Promise<boolean> {
    return this.hasAnyEmptyPreviousVolume(novelId, currentOrderIndex);
  }

  async findOldestEmptyOrLatestVolume(novelId: string) {
    const emptyVolume = await this.volumeRepo
      .createQueryBuilder("volume")
      .leftJoin("volume.chapters", "chapter") // Bu artık ChapterPublication'a bağlanıyor
      .select(["volume.id", "volume.orderIndex"])
      .where("volume.novelId = :novelId", { novelId })
      .groupBy("volume.id")
      .addGroupBy("volume.orderIndex")
      // DİKKAT: chapter.id değil, senin entity'deki adıyla chapter.chapterId
      .having("COUNT(chapter.chapterId) = 0")
      .orderBy("volume.orderIndex", "ASC")
      .getOne();

    if (emptyVolume) return emptyVolume;

    return await this.volumeRepo.findOne({
      where: { novelId },
      order: { orderIndex: "DESC" },
    });
  }

  async hasPublishedInNextVolumes(novelId: string, currentOrderIndex: number) {
    const nextPublishedVolume = await this.volumeRepo
      .createQueryBuilder("volume")
      .innerJoin("volume.chapters", "publication")
      .where("volume.novelId = :novelId", { novelId })
      .andWhere("volume.orderIndex > :currentVolumeOrder", {
        currentVolumeOrder: currentOrderIndex,
      })
      .select("volume.id")
      .getOne();

    return !!nextPublishedVolume;
  }

  async isOwnerControlByNovelId(novelId: string, authorId: string) {
    const exist = await this.volumeRepo.exists({
      where: {
        novelId,
        novel: { author: { userId: authorId } },
      },
      relations: {
        novel: { author: true },
      },
    });
    return exist;
  }

  async hasAnyNextVolume(
    novelId: string,
    currentOrderIndex: number,
  ): Promise<boolean> {
    // innerJoin kullanarak sadece içinde bölüm (chapter) olan ciltleri filtreliyoruz
    const nextVolumeWithChapters = await this.volumeRepo
      .createQueryBuilder("volume")
      .innerJoin("volume.chapters", "chapter") // Ciltlerin bölümleriyle birleştir
      .where("volume.novelId = :novelId", { novelId })
      .andWhere("volume.orderIndex > :currentOrderIndex", { currentOrderIndex })
      .getExists();

    return nextVolumeWithChapters;
  }

  async isLastVolumeWithChapters(
    novelId: string,
    currentOrderIndex: number,
  ): Promise<boolean> {
    return !(await this.hasPopulatedVolumeAfter(novelId, currentOrderIndex));
  }

  async hasPopulatedVolumeAfter(
    novelId: string,
    currentOrderIndex: number,
  ): Promise<boolean> {
    return await this.volumeRepo.exists({
      where: {
        novelId,
        orderIndex: MoreThan(currentOrderIndex),
        chapters: { chapterId: Not(IsNull()) },
      },
    });
  }
}
