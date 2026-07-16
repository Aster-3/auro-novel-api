import { BannerTargetType } from "../constants/banner.constants.js";
import { BadRequestError } from "../errors/bad.request.js";
import { NotFoundError } from "../errors/not.found.error.js";
import { IBannerRepository } from "../interfaces/banner.repo.interface.js";
import { INovelRepository } from "../interfaces/novel.repo.interface.js";
import { IBannerService } from "../interfaces/banner.service.interface.js";
import { CreateBannerDto } from "../schemas/create.banner.schema.js";
import { ReorderBannersDto } from "../schemas/reorder.banners.schema.js";
import { UpdateBannerDto } from "../schemas/update.banner.schema.js";
import { uploadToS3 } from "./s3.service.js";

export class BannerService implements IBannerService {
  constructor(
    private bannerRepository: IBannerRepository,
    private novelRepository: INovelRepository,
  ) {}

  async getHomeBanners() {
    return this.bannerRepository.findActiveForHome(10);
  }

  async getAdminBanners() {
    return this.bannerRepository.findAll();
  }

  async createBanner(dto: CreateBannerDto, file?: Express.Multer.File) {
    await this.validateTarget(dto.targetType, dto.targetId ?? undefined);

    if (!file) {
      throw new BadRequestError("Banner gorseli zorunludur.");
    }

    const imageUrl = await uploadToS3(file, "banners");
    return this.bannerRepository.create({
      ...dto,
      targetId:
        dto.targetType === BannerTargetType.DISPLAY_ONLY ? null : dto.targetId,
      imageUrl,
    });
  }

  async updateBanner(
    id: string,
    dto: UpdateBannerDto,
    file?: Express.Multer.File,
  ) {
    const banner = await this.bannerRepository.findById(id);
    if (!banner) {
      throw new NotFoundError("Banner bulunamadi.");
    }

    if (Object.keys(dto).length === 0 && !file) {
      throw new BadRequestError("Guncellenecek en az bir alan gonderilmelidir.");
    }

    const targetType = dto.targetType ?? banner.targetType;
    const targetId = dto.targetId ?? banner.targetId;

    await this.validateTarget(targetType, targetId ?? undefined);

    const imageUrl = file ? await uploadToS3(file, "banners") : undefined;
    const updateData: UpdateBannerDto & {
      imageUrl?: string;
      targetId?: string | null;
    } = {
      ...dto,
    };
    if (targetType === BannerTargetType.DISPLAY_ONLY) {
      updateData.targetId = null;
    }
    if (imageUrl) updateData.imageUrl = imageUrl;

    const result = await this.bannerRepository.update(id, updateData);

    if (result.affected === 0) {
      throw new NotFoundError("Banner bulunamadi.");
    }
  }

  async updateBannerStatus(id: string, isActive: boolean) {
    const result = await this.bannerRepository.updateStatus(id, isActive);
    if (result.affected === 0) {
      throw new NotFoundError("Banner bulunamadi.");
    }
  }

  async reorderBanners(dto: ReorderBannersDto) {
    await this.bannerRepository.updateOrder(dto.items);
  }

  async deleteBanner(id: string) {
    const result = await this.bannerRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundError("Banner bulunamadi.");
    }
  }

  private async validateTarget(
    targetType: BannerTargetType,
    targetId?: string,
  ) {
    if (targetType === BannerTargetType.DISPLAY_ONLY) {
      return;
    }

    if (targetType !== BannerTargetType.NOVEL) {
      throw new BadRequestError(
        "Bu surumde sadece novel veya yonlendirmesiz banner desteklenir.",
      );
    }

    if (!targetId) {
      throw new BadRequestError("Novel banner icin hedef id zorunludur.");
    }

    const novelExists = await this.novelRepository.existControl({ id: targetId });
    if (!novelExists) {
      throw new NotFoundError("Banner hedefi olan novel bulunamadi.");
    }
  }
}
