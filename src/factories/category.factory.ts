import { CategoryController } from "../controllers/category.controller.js";
import { AppDataSource } from "../database/data-source.js";
import { Category } from "../entities/Category.js";
import { CategoryRepository } from "../repositories/category.repository.js";
import { CategoryService } from "../services/category.service.js";

export const getCategoryController = () => {
  const repo = AppDataSource.getRepository(Category);
  const categoryRepo = new CategoryRepository(repo);
  const categoryService = new CategoryService(categoryRepo);
  const categoryController = new CategoryController(categoryService);
  return categoryController;
};
