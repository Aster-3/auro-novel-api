import { UserVerification } from "../entities/UserVerification.js";
import { CreateVerificationDto } from "../schemas/create.user.verify.shema.js";

export interface IUserVerificationRepository {
  createVerification(dto: CreateVerificationDto): Promise<void>;
  findByEmail(email: string): Promise<UserVerification | null>;
  incrementAttempts(id: string): Promise<void>;
  deleteVerification(userId: string): Promise<void>;
  getAll(): Promise<UserVerification[]>;
  refreshVerificationCode(
    userId: string,
    newCode: string,
    newExpiry: Date,
  ): Promise<UserVerification>;
}
