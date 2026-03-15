import { ChapterPurchase } from "../entities/ChapterPurchase.js";
import { CreateChapterPurchaseDTO } from "../schemas/create.chapter.purchase.schema.js";
import { CreateChapterDTO } from "../schemas/create.chapter.schema.js";

export interface IChapterPurchaseService {
  getAllChapterPurchases(): Promise<ChapterPurchase[]>;
  createChapterPurchase(dto: CreateChapterPurchaseDTO): Promise<boolean>;
  // hasPurchasedChapter(userId: string, chapterId: string): Promise<boolean>;
  // getPurchasedChaptersByUserId(userId: string): Promise<string[]>;
}
