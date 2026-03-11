import { Router } from "express";
import { getTagController } from "../factories/tag.factory.js";
import { validateSchema } from "../middlewares/validate.schema.js";
import { createTagSchema } from "../schemas/create.tag.schema.js";
import { searchTagSchema } from "../schemas/search.tag.schema.js";
import { deleteTagSchema } from "../schemas/delete.tag.schema.js";

const router = Router();
const tagController = getTagController();

router.get("/", validateSchema(searchTagSchema), tagController.searchTags);

router.post("/", validateSchema(createTagSchema), tagController.createTag);

router.delete("/:id", validateSchema(deleteTagSchema), tagController.deleteTag);

export default router;
