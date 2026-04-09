import { ChapterPurchase } from "../entities/ChapterPurchase.js";

export interface IChapterPurchaseService {
  getAllChapterPurchases(): Promise<ChapterPurchase[]>;
}
