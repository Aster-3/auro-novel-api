import { DataSource, Repository } from "typeorm";
import { ChapterPurchase, Novel } from "../entities/_index.js";
import { IChapterPurchaseRepository } from "../interfaces/chapter.purchase.repo.interface.js";
import { CoinType } from "../constants/transaction.contants.js";

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
          novel: {
            id: true,
            name: true,
          },
        },
      },
      relations: {
        user: true,
        chapter: {
          novel: true,
        },
      },
    });
  }

  async createChapterPurchase({
    userId,
    chapterId,
    amount,
    coinType,
  }: {
    userId: string;
    chapterId: string;
    amount: number;
    coinType: CoinType;
  }) {
    const newPurchase = this.chapterPurchaseRepo.create({
      userId,
      chapterId,
      amount,
      coinType,
    });
    const savedPurchase = await this.chapterPurchaseRepo.save(newPurchase);
    return savedPurchase.id;
  }

  async hasPurchasedChapterByUserId(userId: string, chapterId: string) {
    return await this.chapterPurchaseRepo.exists({
      where: {
        userId: userId,
        chapterId: chapterId,
      },
    });
  }

  async isChapterEverPurchased(chapterId: string): Promise<boolean> {
    return await this.chapterPurchaseRepo.exists({
      where: {
        chapterId: chapterId,
      },
    });
  }
}
