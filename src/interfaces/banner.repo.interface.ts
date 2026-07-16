import { DeleteResult, UpdateResult } from "typeorm";
import { Banner } from "../entities/Banner.js";
import { CreateBannerDto } from "../schemas/create.banner.schema.js";
import { UpdateBannerDto } from "../schemas/update.banner.schema.js";

export interface IBannerRepository {
  create(dto: CreateBannerDto & { imageUrl: string; targetId?: string | null }): Promise<Banner>;
  findActiveForHome(limit: number): Promise<Banner[]>;
  findAll(): Promise<Banner[]>;
  findById(id: string): Promise<Banner | null>;
  update(
    id: string,
    dto: Partial<UpdateBannerDto> & { imageUrl?: string; targetId?: string | null },
  ): Promise<UpdateResult>;
  updateStatus(id: string, isActive: boolean): Promise<UpdateResult>;
  updateOrder(items: { id: string; orderIndex: number }[]): Promise<void>;
  delete(id: string): Promise<DeleteResult>;
}
