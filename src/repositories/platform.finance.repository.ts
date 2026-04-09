import { Repository } from "typeorm";
import { PlatformFinance } from "../entities/PlatformFinance.js";
import { IPlatformFinanceRepository } from "../interfaces/platform.finance.repo.interface.js";

export class PlatformFinanceRepository implements IPlatformFinanceRepository {
  constructor(private readonly financeRepo: Repository<PlatformFinance>) {}

  async getOrCreateFinance(): Promise<PlatformFinance> {
    let finance = await this.financeRepo.findOne({ where: {} });

    if (!finance) {
      finance = this.financeRepo.create({
        totalEarnings: 0,
        totalPayouts: 0,
        balance: 0,
      });
      await this.financeRepo.save(finance);
    }
    return finance;
  }

  async recordIncome(amount: number): Promise<number> {
    const finance = await this.getOrCreateFinance();

    const result = await this.financeRepo
      .createQueryBuilder()
      .update(PlatformFinance)
      .set({
        totalEarnings: () => `totalEarnings + :amount`,
        balance: () => `balance + :amount`,
      })
      .setParameter("amount", amount)
      .where("id = :id", { id: finance.id })
      .returning("balance")
      .execute();

    return Number(result.raw[0].balance);
  }

  async recordWithdrawal(amount: number): Promise<number> {
    const finance = await this.getOrCreateFinance();

    if (finance.balance < amount) {
      throw new Error("Yetersiz çekilebilir bakiye.");
    }

    const result = await this.financeRepo
      .createQueryBuilder()
      .update(PlatformFinance)
      .set({
        balance: () => `balance - :amount`,
        totalPayouts: () => `totalPayouts + :amount`,
      })
      .setParameter("amount", amount)
      .where("id = :id", { id: finance.id })
      .returning("balance")
      .execute();

    return Number(result.raw[0].balance);
  }
}
