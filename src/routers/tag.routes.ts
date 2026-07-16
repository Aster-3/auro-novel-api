import { Router } from "express";
import { validateSchema } from "../middlewares/validate.schema.js";
import { createTagSchema } from "../schemas/create.tag.schema.js";
import { searchTagSchema } from "../schemas/search.tag.schema.js";
import { deleteTagSchema } from "../schemas/delete.tag.schema.js";
import { getTagNovelsSchema } from "../schemas/get.tag.novels.schema.js";
import { tagController } from "../container.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";

const router = Router();

router.get("/", validateSchema(searchTagSchema), tagController.searchTags);

router.get("/random", tagController.getRandomTags);

router.get(
  "/:id",
  validateSchema(getTagNovelsSchema),
  tagController.getNovelsByTagId,
);

router.post(
  "/",
  authMiddleware,
  validateSchema(createTagSchema),
  tagController.createTag,
);

router.delete(
  "/:id",
  adminMiddleware,
  validateSchema(deleteTagSchema),
  tagController.deleteTag,
);

export default router;
