import { ChapterPurchase } from "../entities/ChapterPurchase.js";
import { CreateChapterPurchaseDTO } from "../schemas/create.chapter.purchase.schema.js";

export interface IChapterPurchaseRepository {
  getAllChapterPurchases(): Promise<ChapterPurchase[]>;
  createChapterPurchase(dto: CreateChapterPurchaseDTO): Promise<boolean>;
  hasPurchasedChapterByUserId(
    userId: string,
    chapterId: string,
  ): Promise<boolean>;
  isChapterEverPurchased(chapterId: string): Promise<boolean>;
}
