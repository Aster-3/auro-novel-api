import { CoinType } from "../constants/transaction.contants.js";
import { ChapterPurchase } from "../entities/ChapterPurchase.js";
import { CreateChapterPurchaseDTO } from "../schemas/create.chapter.purchase.schema.js";

export interface IChapterPurchaseRepository {
  getAllChapterPurchases(): Promise<ChapterPurchase[]>;
  createChapterPurchase({
    userId,
    chapterId,
    amount,
    coinType,
  }: {
    userId: string;
    chapterId: string;
    amount: number;
    coinType: CoinType;
  }): Promise<string>;
  hasPurchasedChapterByUserId(
    userId: string,
    chapterId: string,
  ): Promise<boolean>;
  isChapterEverPurchased(chapterId: string): Promise<boolean>;
}
