import { ConflictError } from "../errors/conflict.error.js";
import { IAuthorRepository } from "../interfaces/author.repo.interface.js";
import { IAuthorService } from "../interfaces/author.service.interface.js";
import { IAuthorWalletTransactionRepository } from "../interfaces/author.wallet.transaction.repo.interface.js";
import { IUnitOfWork } from "../interfaces/unit.of.work.interface.js";
import { CreateAuthorDto } from "../schemas/create.author.schmea.js";
import { GetAuthorTransactionsDto } from "../schemas/get.author.transactions.schema.js";

export class AuthorService implements IAuthorService {
  constructor(private uow: IUnitOfWork) {}

  async createAuthor(dto: CreateAuthorDto, isAdmin: boolean): Promise<void> {
    const isAuthorExist = await this.uow.authorRepository.findByUserId(
      dto.userId,
    );
    if (isAuthorExist && !isAdmin) {
      throw new ConflictError("author", "Yazar zaten mevcut");
    } else {
      await this.uow.startTransaction();
      try {
        const authorID = await this.uow.authorRepository.create(dto);
        await this.uow.authorWalletRepository.createWalletForAuthor(authorID);
      } catch (error) {
        await this.uow.rollback();
        throw error;
      } finally {
        await this.uow.release();
      }
    }
  }

  async deleteAuthor(id: string): Promise<void> {
    await this.uow.authorRepository.delete(id);
  }

  async getAuthors(dto: any): Promise<any> {
    return await this.uow.authorRepository.getAuthors(dto);
  }

  async getAuthorWallet(userId: string): Promise<{
    totalEarnings: number;
    withdrawableBalance: number;
    pendingWithdrawalBalance: number;
    canWithdrawAfter: Date;
  }> {
    const author =
      await this.uow.authorRepository.getAuthorWalletByUserId(userId);

    if (!author?.wallet) {
      throw new ConflictError("author_wallet", "Author wallet not found");
    }

    return {
      totalEarnings: author.wallet.totalEarnings / 100,
      withdrawableBalance: author.wallet.withdrawableBalance / 100,
      pendingWithdrawalBalance: author.wallet.pendingWithdrawalBalance / 100,
      canWithdrawAfter: author.wallet.canWithdrawAfter,
    };
  }
  async getAuthorTransactions(dto: GetAuthorTransactionsDto, userId: string) {
    const author =
      await this.uow.authorRepository.getAuthorWalletByUserId(userId);
    if (!author?.wallet) {
      throw new ConflictError("author_wallet", "Yazar cüzdanı bulunamadı");
    }
    return await this.uow.authorWalletTransactionRepository.getTransactionsByWalletId(
      {
        ...dto,
        walletId: author.wallet.id,
      },
    );
  }
}
