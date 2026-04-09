import { Repository } from "typeorm";
import { ReaderWalletTransaction } from "../entities/_index.js";
import {
  CoinType,
  ReaderTransactionType,
} from "../constants/transaction.contants.js";
import { IReaderWalletTransactionRepository } from "../interfaces/reader.wallet.transaction.repo.interface.js";
import { FindAndCountType } from "../constants/findAndCountType.js";

export class ReaderWalletTransactionRepository implements IReaderWalletTransactionRepository {
  constructor(
    private walletTransactionRepo: Repository<ReaderWalletTransaction>,
  ) {}

  async createTransaction(dto: {
    walletId: string;
    coinType: CoinType;
    transactionType: ReaderTransactionType;
    amount: number;
    description: string;
  }): Promise<void> {
    await this.walletTransactionRepo.save(dto);
  }

  async getTransactions(
    walletId: string,
    page: number,
    limit: number,
  ): Promise<FindAndCountType<ReaderWalletTransaction>> {
    const [result, total] = await this.walletTransactionRepo.findAndCount({
      where: { walletId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: "DESC" },
    });
    const totalPages = Math.ceil(total / limit);
    const nextPage = page < totalPages ? page + 1 : null;
    return {
      items: result,
      total: total,
      currentPage: page,
      lastPage: totalPages,
      nextPage: nextPage,
    };
  }
}
