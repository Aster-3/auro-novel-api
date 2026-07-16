import { PasswordReset } from "../entities/PasswordReset.js";

export interface IPasswordResetRepository {
  findByEmail(email: string): Promise<PasswordReset | null>;
  createOrReplace(
    userId: string,
    codeHash: string,
    expiry: Date,
  ): Promise<PasswordReset>;
  incrementAttempts(id: string): Promise<void>;
  deleteById(id: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}
