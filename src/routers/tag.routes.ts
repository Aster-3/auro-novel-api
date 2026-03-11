import { Router } from "express";
import { getTagController } from "../factories/tag.factory.js";
import { validateSchema } from "../middlewares/validate.schema.js";
import { createTagSchema } from "../schemas/create.tag.schema.js";

const router = Router();
const tagController = getTagController();

router.get("/", (req, res) => res.send("Hello from Tag Routes"));

router.post("/", validateSchema(createTagSchema), tagController.createTag);

export default router;
