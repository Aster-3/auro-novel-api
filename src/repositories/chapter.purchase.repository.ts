import { Repository } from "typeorm";
import { ChapterPurchase } from "../entities/_index.js";
import { CreateChapterPurchaseDTO } from "../schemas/create.chapter.purchase.schema.js";
import { IChapterPurchaseRepository } from "../interfaces/chapter.purchase.repo.interface.js";

export class ChapterPurchaseRepository implements IChapterPurchaseRepository {
  constructor(private chapterPurchaseRepo: Repository<ChapterPurchase>) {}

  async getAllChapterPurchases() {
    return await this.chapterPurchaseRepo.find({
      select: {
        id: true,
        userId: true,
        chapterId: true,
        user: {
          id: true,
          nickname: true,
        },
        chapter: {
          id: true,
          title: true,
          order: true,
        },
      },
      relations: {
        user: true,
        chapter: true,
      },
    });
  }

  async createChapterPurchase(dto: CreateChapterPurchaseDTO) {
    const result = await this.chapterPurchaseRepo.save(dto);
    return !!result;
  }

  async hasPurchasedChapter(userId: string, chapterId: string) {
    return await this.chapterPurchaseRepo.exists({
      where: {
        userId: userId,
        chapterId: chapterId,
      },
    });
  }
}
