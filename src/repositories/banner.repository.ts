import { DeleteResult, IsNull, Not, Repository, UpdateResult } from "typeorm";
import { Banner } from "../entities/Banner.js";
import { IBannerRepository } from "../interfaces/banner.repo.interface.js";
import { CreateBannerDto } from "../schemas/create.banner.schema.js";
import { UpdateBannerDto } from "../schemas/update.banner.schema.js";

export class BannerRepository implements IBannerRepository {
  constructor(private bannerRepo: Repository<Banner>) {}

  async create(dto: CreateBannerDto & { imageUrl: string; targetId?: string | null }) {
    return this.bannerRepo.save(dto);
  }

  async findActiveForHome(limit: number) {
    return this.bannerRepo.find({
      where: {
        isActive: true,
        imageUrl: Not(IsNull()),
      },
      order: { orderIndex: "ASC", createdAt: "DESC" },
      take: limit,
    });
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
