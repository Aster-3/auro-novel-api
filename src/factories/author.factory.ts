import { AuthorController } from "../controllers/author.controller.js";
import { AppDataSource } from "../database/data-source.js";
import { Author } from "../entities/Author.js";
import { User } from "../entities/User.js";
import { AuthorRepository } from "../repositories/author.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { AuthorService } from "../services/author.service.js";

export const getAuthorController = () => {
  const repo = AppDataSource.getRepository(Author);
  const authorRepo = new AuthorRepository(repo);
  const userRepo = new UserRepository(AppDataSource.getRepository(User));
  const authorService = new AuthorService(authorRepo, userRepo);
  const authorController = new AuthorController(authorService);
  return authorController;
};
