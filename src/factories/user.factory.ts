import { UserController } from "../controllers/user.controller.js";
import { AppDataSource } from "../database/data-source.js";
import { UserVerification } from "../entities/_index.js";
import { User } from "../entities/User.js";
import { UserRepository } from "../repositories/user.repository.js";
import { UserVerificationRepository } from "../repositories/user.verification.repository.js";
import { UserService } from "../services/user.service.js";

export const getUserController = () => {
  const userRepo = new UserRepository(AppDataSource.getRepository(User));
  const userVerificationRepo = new UserVerificationRepository(
    AppDataSource.getRepository(UserVerification),
  );
  const userService = new UserService(userRepo, userVerificationRepo);
  const userController = new UserController(userService);
  return userController;
};
