import { Banner } from "../entities/Banner.js";
import { CreateBannerDto } from "../schemas/create.banner.schema.js";
import { ReorderBannersDto } from "../schemas/reorder.banners.schema.js";
import { UpdateBannerDto } from "../schemas/update.banner.schema.js";

export interface IBannerService {
  getHomeBanners(): Promise<Banner[]>;
  getAdminBanners(): Promise<Banner[]>;
  createBanner(dto: CreateBannerDto, file?: Express.Multer.File): Promise<Banner>;
  updateBanner(
    id: string,
    dto: UpdateBannerDto,
    file?: Express.Multer.File,
  ): Promise<void>;
  updateBannerStatus(id: string, isActive: boolean): Promise<void>;
  reorderBanners(dto: ReorderBannersDto): Promise<void>;
  deleteBanner(id: string): Promise<void>;
}
