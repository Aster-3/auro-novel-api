import { CoinType } from "../constants/transaction.contants.js";

export interface IReaderWalletRepository {
  create(
    userId: string,
    initialBalances: { moon: number; sun: number },
  ): Promise<void>;
  getBalance(
    userId: string,
  ): Promise<{ id: string; moonCoins: number; sunCoins: number }>;
  addCoins(userId: string, coinType: CoinType, amount: number): Promise<void>;
  subtractCoins(
    userId: string,
    coinType: CoinType,
    amount: number,
  ): Promise<void>;
}
