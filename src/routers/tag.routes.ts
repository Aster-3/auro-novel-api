import { Router } from "express";
import { validateSchema } from "../middlewares/validate.schema.js";
import { createTagSchema } from "../schemas/create.tag.schema.js";
import { searchTagSchema } from "../schemas/search.tag.schema.js";
import { deleteTagSchema } from "../schemas/delete.tag.schema.js";
import { tagController } from "../container.js";

const router = Router();

router.get("/", validateSchema(searchTagSchema), tagController.searchTags);

router.post("/", validateSchema(createTagSchema), tagController.createTag);

router.delete("/:id", validateSchema(deleteTagSchema), tagController.deleteTag);

router.get("/random", tagController.getRandomTags);

export default router;
