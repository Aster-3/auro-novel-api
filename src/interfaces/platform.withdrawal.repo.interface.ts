export interface IPlatformWithdrawalRepository {
  createWithdrawalRecord(params: {
    amount: number;
    balanceBeforeWithdrawal: number;
    balanceAfterWithdrawal: number;
  }): Promise<string>;
}
