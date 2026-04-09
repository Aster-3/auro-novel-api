import { FindAndCountType } from "../constants/findAndCountType.js";
import { AuthorTransactionType } from "../constants/transaction.contants.js";
import { AuthorWalletTransaction } from "../entities/AuthorWalletTransaction.js";
import { GetAuthorTransactionsDto } from "../schemas/get.author.transactions.schema.js";

export interface IAuthorWalletTransactionRepository {
  createTransaction({
    walletId,
    transactionType,
    amount,
    balanceAfterTransaction,
    balanceBeforeTransaction,
    description,
    referenceId,
  }: {
    walletId: string;
    transactionType: AuthorTransactionType;
    amount: number;
    balanceAfterTransaction: number;
    balanceBeforeTransaction: number;
    description?: string;
    referenceId?: string;
  }): Promise<void>;
  getTransactionsByWalletId(
    dto: GetAuthorTransactionsDto,
  ): Promise<FindAndCountType<AuthorWalletTransaction>>;
}
