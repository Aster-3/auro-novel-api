import { UserController } from "../controllers/user.controller.js";
import { AppDataSource } from "../database/data-source.js";
import { Library } from "../entities/Library.js";
import { User } from "../entities/User.js";
import { LibraryRepository } from "../repositories/library.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { UserService } from "../services/user.service.js";

export const getUserController = () => {
  const userRepo = new UserRepository(AppDataSource.getRepository(User));
  const userService = new UserService(userRepo);
  const userController = new UserController(userService);
  return userController;
};
