import { Repository } from "typeorm";
import { IReaderWalletRepository } from "../interfaces/reader.wallet.repository.interface.js";
import { ReaderWallet } from "../entities/ReaderWallet.js";
import { CoinType } from "../constants/transaction.contants.js";

export class ReaderWalletRepository implements IReaderWalletRepository {
  constructor(private walletRepo: Repository<ReaderWallet>) {}

  async create(
    userId: string,
    initialBalances = { moon: 0, sun: 0 },
  ): Promise<void> {
    const wallet = this.walletRepo.create({
      userId,
      sunCoins: initialBalances.sun,
      moonCoins: initialBalances.moon,
    });
    await this.walletRepo.save(wallet);
  }

  private async getOrCreateWallet(userId: string): Promise<ReaderWallet> {
    let wallet = await this.walletRepo.findOne({ where: { userId } });
    if (!wallet) {
      wallet = this.walletRepo.create({ userId, moonCoins: 0, sunCoins: 0 });
      return await this.walletRepo.save(wallet);
    }
    return wallet;
  }

  async getBalance(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    return {
      id: wallet.id,
      moonCoins: wallet.moonCoins,
      sunCoins: wallet.sunCoins,
    };
  }

  async addCoins(userId: string, coinType: CoinType, amount: number) {
    await this.getOrCreateWallet(userId);
    await this.walletRepo.increment({ userId }, coinType, amount);
  }

  async subtractCoins(userId: string, coinType: CoinType, amount: number) {
    await this.walletRepo.decrement({ userId }, coinType, amount);
  }
}
