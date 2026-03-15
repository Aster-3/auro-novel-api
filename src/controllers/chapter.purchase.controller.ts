import { Request, Response } from "express";
import { IChapterPurchaseService } from "../interfaces/chapter.purchase.service.interface.js";

export class ChapterPurchaseController {
  constructor(private chapterPurchaseService: IChapterPurchaseService) {}

  getAllChapterPurchases = async (req: Request, res: Response) => {
    const purchases =
      await this.chapterPurchaseService.getAllChapterPurchases();
    res.status(200).json(purchases);
  };

  createChapterPurchase = async (req: Request, res: Response) => {
    const purchase = await this.chapterPurchaseService.createChapterPurchase(
      req.body,
    );
    res.status(201).json({ success: purchase });
  };
}
