import { IChapterPurchaseRepository } from "../interfaces/chapter.purchase.repo.interface.js";
import { IChapterPurchaseService } from "../interfaces/chapter.purchase.service.interface.js";

export class ChapterPurchaseService implements IChapterPurchaseService {
  constructor(private chapterPurchaseRepository: IChapterPurchaseRepository) {}

  async getAllChapterPurchases() {
    return await this.chapterPurchaseRepository.getAllChapterPurchases();
  }
}
