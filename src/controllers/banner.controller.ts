import { Request, Response } from "express";
import { IBannerService } from "../interfaces/banner.service.interface.js";

export class BannerController {
  constructor(private bannerService: IBannerService) {}

  getHomeBanners = async (req: Request, res: Response) => {
    const banners = await this.bannerService.getHomeBanners();
    res.status(200).json(banners);
  };

  getAdminBanners = async (req: Request, res: Response) => {
    const banners = await this.bannerService.getAdminBanners();
    res.status(200).json(banners);
  };

  createBanner = async (req: Request, res: Response) => {
    const banner = await this.bannerService.createBanner(
      res.locals.validatedData,
      req.file,
    );
    res.status(201).json(banner);
  };

  updateBanner = async (req: Request, res: Response) => {
    const { id, ...dto } = res.locals.validatedData;
    await this.bannerService.updateBanner(id, dto, req.file);
    res.sendStatus(204);
  };

  updateBannerStatus = async (req: Request, res: Response) => {
    const { id, isActive } = res.locals.validatedData;
    await this.bannerService.updateBannerStatus(id, isActive);
    res.sendStatus(204);
  };

  reorderBanners = async (req: Request, res: Response) => {
    await this.bannerService.reorderBanners(res.locals.validatedData);
    res.sendStatus(204);
  };

  deleteBanner = async (req: Request, res: Response) => {
    const { id } = res.locals.validatedData;
    await this.bannerService.deleteBanner(id);
    res.sendStatus(204);
  };
}
