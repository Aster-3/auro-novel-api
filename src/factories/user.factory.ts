import { UserController } from "../controllers/user.controller.js";
import { AppDataSource } from "../database/data-source.js";
import { User } from "../entities/User.js";
import { UserRepository } from "../repositories/user.repository.js";
import { UserService } from "../services/user.service.js";

export const getUserController = () => {
  const repo = AppDataSource.getRepository(User);
  const userRepo = new UserRepository(repo);
  const userService = new UserService(userRepo);
  const userController = new UserController(userService);
  return userController;
};
