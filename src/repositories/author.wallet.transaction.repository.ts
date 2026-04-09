import { MoreThanOrEqual, Repository } from "typeorm";
import { AuthorWalletTransaction } from "../entities/AuthorWalletTransaction.js";
import { IAuthorWalletTransactionRepository } from "../interfaces/author.wallet.transaction.repo.interface.js";
import { AuthorTransactionType } from "../constants/transaction.contants.js";
import { GetAuthorTransactionsDto } from "../schemas/get.author.transactions.schema.js";

export class AuthorWalletTransactionRepository implements IAuthorWalletTransactionRepository {
  constructor(private walletRepo: Repository<AuthorWalletTransaction>) {}

  async createTransaction({
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
  }) {
    const transaction = this.walletRepo.create({
      walletId,
      transactionType,
      amount,
      balanceAfterTransaction,
      balanceBeforeTransaction,
      description,
      referenceId,
    });
    await this.walletRepo.save(transaction);
  }

  async getTransactionsByWalletId(dto: GetAuthorTransactionsDto) {
    const { walletId, page, limit, filterBy, since } = dto;

    const [transactions, total] = await this.walletRepo.findAndCount({
      where: {
        walletId,
        transactionType: filterBy,
        createdAt: since ? MoreThanOrEqual(since) : undefined,
      },
      select: {
        id: true,
        transactionType: true,
        amount: true,
        balanceAfterTransaction: true,
        description: true,
        createdAt: true,
      },
      order: { createdAt: "DESC" },
      take: limit,
      skip: (page - 1) * limit,
    });

    const formattedTransactions = transactions.map((transaction) => ({
      ...transaction,
      amount: transaction.amount / 100,
      balanceAfterTransaction: transaction.balanceAfterTransaction / 100,
    }));

    const totalPages = Math.ceil(total / limit);
    const nextPage = page < totalPages ? page + 1 : null;

    return {
      items: formattedTransactions,
      total: total,
      currentPage: page,
      nextPage,
      lastPage: totalPages,
    };
  }
}
