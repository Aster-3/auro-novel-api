import { FindAndCountType } from "../constants/findAndCountType.js";
import {
  CoinType,
  ReaderTransactionType,
} from "../constants/transaction.contants.js";
import { ReaderWalletTransaction } from "../entities/ReaderWalletTransaction.js";

export interface IReaderWalletTransactionRepository {
  createTransaction(dto: {
    walletId: string;
    coinType: CoinType;
    amount: number;
    transactionType: ReaderTransactionType;
    description: string;
  }): Promise<void>;

  getTransactions(
    walletId: string,
    page: number,
    limit: number,
  ): Promise<FindAndCountType<ReaderWalletTransaction>>;
}
