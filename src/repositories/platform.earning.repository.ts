import { Repository } from "typeorm";
import { Currency } from "../constants/transaction.contants.js";
import { IPlatformEarningRepository } from "../interfaces/platform.earning.repo.interface.js";
import { PlatformEarning } from "../entities/_index.js";

export class PlatformEarningRepository implements IPlatformEarningRepository {
  constructor(private earningRepo: Repository<PlatformEarning>) {}

  async createEarningRecord(earningData: {
    authorId: string;
    novelId: string;
    chapterId: string;
    purchaseId: string;
    coinAmount: number;
    coinUnitPrice: number;
    currency: Currency;
    grossAmount: number;
    platformCommissionRate: number;
    commissionAmount: number;
    netAmount: number;
  }): Promise<void> {
    const earning = this.earningRepo.create(earningData);
    await this.earningRepo.save(earning);
  }
}
