import { Repository } from "typeorm";
import { PasswordReset } from "../entities/_index.js";
import { IPasswordResetRepository } from "../interfaces/password.reset.repo.interface.js";

export class PasswordResetRepository implements IPasswordResetRepository {
  constructor(private passwordResetRepo: Repository<PasswordReset>) {}

  async findByEmail(email: string) {
    return await this.passwordResetRepo.findOne({
      where: { user: { email } },
      relations: ["user"],
    });
  }

  async createOrReplace(userId: string, codeHash: string, expiry: Date) {
    return await this.passwordResetRepo.manager.transaction(async (manager) => {
      await manager.delete(PasswordReset, { user: { id: userId } });

      const passwordReset = manager.create(PasswordReset, {
        codeHash,
        expiry,
        lastSentAt: new Date(),
        user: { id: userId },
        attempts: 0,
      });

      return await manager.save(PasswordReset, passwordReset);
    });
  }

  async incrementAttempts(id: string) {
    await this.passwordResetRepo.increment({ id }, "attempts", 1);
  }

  async deleteById(id: string) {
    await this.passwordResetRepo.delete({ id });
  }

  async deleteByUserId(userId: string) {
    await this.passwordResetRepo.delete({ userId });
  }
}
