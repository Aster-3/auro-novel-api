import { LessThan, MoreThan, Repository } from "typeorm";
import { Volume } from "../entities/Volume.js";
import { IVolumeRepository } from "../interfaces/volume.repo.interface.js";
import { CreateVolumeDTO } from "../schemas/create.volume.schema.js";

export class VolumeRepository implements IVolumeRepository {
  constructor(private volumeRepo: Repository<Volume>) {}

  async create(dto: CreateVolumeDTO) {
    const volume = await this.volumeRepo.save(dto);
    return volume.id;
  }

  async delete(id: string) {
    await this.volumeRepo.delete(id);
  }

  async getOneById(id: string) {
    return await this.volumeRepo.findOne({
      where: { id },
    });
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
      .where("volume.novelId = :novelId", { novelId })
      .andWhere("volume.orderIndex < :currentOrderIndex", { currentOrderIndex })
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select("1")
          .from("chapter", "chapter")
          .where("chapter.volumeId = volume.id")
          .getQuery();
        return "NOT EXISTS " + subQuery;
      })
      .getOne();

    return !!emptyPrevious;
  }

  async hasUnpublishedPreviousVolume(
    novelId: string,
    currentOrderIndex: number,
  ): Promise<boolean> {
    const unpublishedVolume = await this.volumeRepo
      .createQueryBuilder("volume")
      // Sadece yayınlanmış bölümleri joinle
      .leftJoin("volume.chapters", "chapter", "chapter.isPublished = :pub", {
        pub: true,
      })
      .where("volume.novelId = :novelId", { novelId })
      .andWhere("volume.orderIndex < :currentOrderIndex", { currentOrderIndex })
      .groupBy("volume.id")
      // Yayınlanmış bölüm sayısı 0 olan bir cilt varsa
      .having("COUNT(chapter.id) = 0")
      .getOne();

    return !!unpublishedVolume;
  }

  async findOldestEmptyOrLatestVolume(novelId: string) {
    const emptyVolume = await this.volumeRepo
      .createQueryBuilder("volume")
      .leftJoin("volume.chapters", "chapter")
      .select(["volume.id", "volume.orderIndex"])
      .where("volume.novelId = :novelId", { novelId })
      .groupBy("volume.id")
      .having("COUNT(chapter.id) = 0")
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
      .innerJoin("volume.chapters", "chapter")
      .where("volume.novelId = :novelId", { novelId })
      .andWhere("volume.orderIndex > :currentVolumeOrder", {
        currentVolumeOrder: currentOrderIndex,
      })
      .andWhere("chapter.isPublished = :pub", { pub: true })
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
    const nextVolumeWithChapters = await this.volumeRepo
      .createQueryBuilder("volume")
      .innerJoin("volume.chapters", "chapter")
      .where("volume.novelId = :novelId", { novelId })
      .andWhere("volume.orderIndex > :currentOrderIndex", { currentOrderIndex })
      .getExists();

    return nextVolumeWithChapters;
  }
}
