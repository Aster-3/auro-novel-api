import { Repository } from "typeorm";
import { IAuthorWalletRepository } from "../interfaces/author.wallet.repo.interface.js";
import { AuthorWallet } from "../entities/AuthorWallet.js";

export class AuthorWalletRepository implements IAuthorWalletRepository {
  constructor(private walletRepo: Repository<AuthorWallet>) {}

  async incrementTotalEarningsAndBalance(
    authorId: string,
    amount: number,
  ): Promise<number> {
    const result = await this.walletRepo
      .createQueryBuilder() // Alias vermene gerek yok
      .update(AuthorWallet) // Hangi entity olduğunu garantiye alalım
      .set({
        totalEarnings: () => `"totalEarnings" + ${amount}`,
        withdrawableBalance: () => `"withdrawableBalance" + ${amount}`,
      })
      .where("authorId = :authorId", { authorId }) // "wallet.authorId" yerine sadece "authorId"
      .returning("withdrawableBalance")
      .execute();

    if (result.affected === 0) {
      const newWallet = this.walletRepo.create({
        authorId,
        totalEarnings: amount,
        withdrawableBalance: amount,
        totalWithdrawn: 0,
      });

      const savedWallet = await this.walletRepo.save(newWallet);
      return Number(savedWallet.withdrawableBalance);
    }

    return Number(result.raw[0].withdrawableBalance);
  }

  async getWalletByAuthorId(authorId: string): Promise<AuthorWallet> {
    let wallet = await this.walletRepo.findOne({
      where: { authorId },
    });

    if (!wallet) {
      wallet = this.walletRepo.create({
        authorId,
        totalEarnings: 0,
        withdrawableBalance: 0,
        totalWithdrawn: 0,
      });
      wallet = await this.walletRepo.save(wallet);
    }

    return wallet;
  }

  async createWalletForAuthor(authorId: string): Promise<void> {
    const newWallet = this.walletRepo.create({
      authorId,
      totalEarnings: 0,
      withdrawableBalance: 0,
      totalWithdrawn: 0,
    });
    await this.walletRepo.save(newWallet);
  }
}
