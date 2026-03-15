import { AuthController } from "../controllers/auth.controller.js";
import { AppDataSource } from "../database/data-source.js";
import { UserVerification } from "../entities/_index.js";
import { User } from "../entities/User.js";
import { UserRepository } from "../repositories/user.repository.js";
import { UserVerificationRepository } from "../repositories/user.verification.repository.js";
import { MailService } from "../services/mail.service.js";
import { UserService } from "../services/user.service.js";

export const getAuthController = () => {
  const repo = AppDataSource.getRepository(User);
  const userRepo = new UserRepository(repo);
  const userVerificationRepo = new UserVerificationRepository(
    AppDataSource.getRepository(UserVerification),
  );
  const mailService = new MailService();
  const userService = new UserService(
    userRepo,
    userVerificationRepo,
    mailService,
  );
  const authController = new AuthController(userService);
  return authController;
};
