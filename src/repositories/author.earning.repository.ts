import { Repository } from "typeorm";
import { IAuthorEarningRepository } from "../interfaces/author.earning.repo.interface.js";
import { AuthorEarning } from "../entities/AuthorEarning.js";
import { Currency } from "../constants/transaction.contants.js";

export class AuthorEarningRepository implements IAuthorEarningRepository {
  constructor(private earningRepo: Repository<AuthorEarning>) {}

  async createEarningRecord(earningData: {
    authorId: string;
    novelId: string;
    chapterId: string;
    purchaseId: string;
    coinAmount: number;
    coinUnitPrice: number;
    currency: Currency;
    grossAmount: number;
    authorSharePercent: number;
    platformCommissionAmount: number;
    netAmount: number;
  }): Promise<string> {
    const earning = this.earningRepo.create(earningData);
    const savedEarning = await this.earningRepo.save(earning);
    return savedEarning.id;
  }
}
