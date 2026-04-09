import { PlatformFinance } from "../entities/PlatformFinance.js";

export interface IPlatformFinanceRepository {
  recordIncome(amount: number): Promise<number>;

  recordWithdrawal(amount: number): Promise<number>;

  getOrCreateFinance(): Promise<PlatformFinance>;
}
