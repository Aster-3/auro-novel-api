import { Repository } from "typeorm";
import { UserVerification } from "../entities/_index.js";
import { IUserVerificationRepository } from "../interfaces/user.verification.repo.interface.js";
import { CreateVerificationDto } from "../schemas/create.user.verify.shema.js";

export class UserVerificationRepository implements IUserVerificationRepository {
  constructor(private userVerificationRepo: Repository<UserVerification>) {}

  async createVerification(dto: CreateVerificationDto) {
    const verification = this.userVerificationRepo.create(dto);
    await this.userVerificationRepo.save(verification);
  }

  getAll() {
    return this.userVerificationRepo.find({ relations: ["user"] });
  }

  async findByEmail(email: string) {
    const verification = await this.userVerificationRepo.findOne({
      where: { user: { email } },
      relations: ["user"],
    });
    if (!verification) {
      return null;
    }
    return verification;
  }

  async incrementAttempts(id: string) {
    await this.userVerificationRepo.increment({ id }, "attempts", 1);
  }

  async deleteVerification(userId: string) {
    await this.userVerificationRepo.delete({ userId });
  }

  async refreshVerificationCode(
    userId: string,
    newCode: string,
    newExpiry: Date,
  ) {
    return await this.userVerificationRepo.manager.transaction(
      async (manager) => {
        await manager.delete(UserVerification, { user: { id: userId } });

        const newVerification = manager.create(UserVerification, {
          code: newCode,
          expiry: newExpiry,
          user: { id: userId },
          attempts: 0,
        });

        return await manager.save(UserVerification, newVerification);
      },
    );
  }
}
