import { Router } from "express";
import { getCategoryController } from "../factories/category.factory.js";
import { validateSchema } from "../middlewares/validate.schema.js";
import { createCategorySchema } from "../schemas/create.category.schema.js";
import { deleteCategorySchema } from "../schemas/delete.category.schema.js";
import { searchCategorySchema } from "../schemas/search.category.schema.js";
import { updateCategorySchema } from "../schemas/update.category.schema.js";

const router = Router();
const categoryController = getCategoryController();

router.get(
  "/",
  validateSchema(searchCategorySchema),
  categoryController.searchCategories,
); //OKEY

router.post(
  "/",
  validateSchema(createCategorySchema),
  categoryController.createCategory,
); //OKEY

router.delete(
  "/:id",
  validateSchema(deleteCategorySchema),
  categoryController.deleteCategory,
); //OKEY

router.patch(
  "/:id",
  validateSchema(updateCategorySchema),
  categoryController.updateCategory,
); //OKEY

export default router;
