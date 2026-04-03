import { Router } from "express";
import { validateSchema } from "../middlewares/validate.schema.js";
import { createCategorySchema } from "../schemas/create.category.schema.js";
import { deleteCategorySchema } from "../schemas/delete.category.schema.js";
import { searchCategorySchema } from "../schemas/search.category.schema.js";
import { updateCategorySchema } from "../schemas/update.category.schema.js";
import { categoryController } from "../container.js";

const router = Router();

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
