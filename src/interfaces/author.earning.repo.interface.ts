import { Currency } from "../constants/transaction.contants.js";

export interface IAuthorEarningRepository {
  createEarningRecord(params: {
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
  }): Promise<string>;
}
