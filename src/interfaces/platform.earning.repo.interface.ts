import { Currency } from "../constants/transaction.contants.js";

export interface IPlatformEarningRepository {
  createEarningRecord(params: {
    authorId: string;
    novelId: string;
    chapterId: string;
    purchaseId: string;
    grossAmount: number;
    platformCommissionRate: number;
    coinAmount: number;
    coinUnitPrice: number;
    currency: Currency;
    netAmount: number;
  }): Promise<void>;
}
