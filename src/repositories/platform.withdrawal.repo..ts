import { Repository } from "typeorm";
import { IPlatformWithdrawalRepository } from "../interfaces/platform.withdrawal.repo.interface.js";
import { PlatformWithdrawal } from "../entities/_index.js";

export class PlatformWithdrawalRepository implements IPlatformWithdrawalRepository {
  constructor(private withdrawalRepo: Repository<PlatformWithdrawal>) {}

  async createWithdrawalRecord(params: {
    amount: number;
    balanceBeforeWithdrawal: number;
    balanceAfterWithdrawal: number;
  }): Promise<string> {
    const withdrawalRecord = this.withdrawalRepo.create({
      amount: params.amount,
      balanceBeforeWithdrawal: params.balanceBeforeWithdrawal,
      balanceAfterWithdrawal: params.balanceAfterWithdrawal,
    });
    const savedRecord = await this.withdrawalRepo.save(withdrawalRecord);
    return savedRecord.id;
  }
}
