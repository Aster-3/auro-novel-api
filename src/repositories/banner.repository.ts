import { DeleteResult, Repository, UpdateResult } from "typeorm";
import { Banner } from "../entities/Banner.js";
import { Novel } from "../entities/Novel.js";
import { IBannerRepository } from "../interfaces/banner.repo.interface.js";
import { CreateBannerDto } from "../schemas/create.banner.schema.js";
import { UpdateBannerDto } from "../schemas/update.banner.schema.js";
import { BannerTargetType } from "../constants/banner.constants.js";

export class BannerRepository implements IBannerRepository {
  constructor(private bannerRepo: Repository<Banner>) {}

  async create(dto: CreateBannerDto & { imageUrl: string; targetId?: string | null }) {
    return this.bannerRepo.save(dto);
  }

  async findActiveForHome(limit: number) {
    return this.bannerRepo
      .createQueryBuilder("banner")
      .leftJoin(
        Novel,
        "target_novel",
        "banner.targetType = :novelTargetType AND target_novel.id = banner.targetId",
        { novelTargetType: BannerTargetType.NOVEL },
      )
      .where("banner.isActive = true")
      .andWhere("banner.imageUrl IS NOT NULL")
      .andWhere(
        `(
          banner.targetType != :novelTargetType OR
          target_novel.id IS NOT NULL AND
          (target_novel."bannedUntil" IS NULL OR target_novel."bannedUntil" <= NOW())
        )`,
        { novelTargetType: BannerTargetType.NOVEL },
      )
      .orderBy("banner.orderIndex", "ASC")
      .addOrderBy("banner.createdAt", "DESC")
      .take(limit)
      .getMany();
  }

  async findAll() {
    return this.bannerRepo.find({
      order: { orderIndex: "ASC", createdAt: "DESC" },
    });
  }

  async findById(id: string) {
    return this.bannerRepo.findOne({ where: { id } });
  }

  async update(
    id: string,
    dto: Partial<UpdateBannerDto> & { imageUrl?: string; targetId?: string | null },
  ): Promise<UpdateResult> {
    return this.bannerRepo.update({ id }, dto);
  }

  async updateStatus(id: string, isActive: boolean): Promise<UpdateResult> {
    return this.bannerRepo.update({ id }, { isActive });
  }

  async updateOrder(items: { id: string; orderIndex: number }[]) {
    await this.bannerRepo.manager.transaction(async (manager) => {
      await Promise.all(
        items.map((item) =>
          manager.update(
            Banner,
            { id: item.id },
            { orderIndex: item.orderIndex },
          ),
        ),
      );
    });
  }

  async delete(id: string): Promise<DeleteResult> {
    return this.bannerRepo.delete({ id });
  }
}
