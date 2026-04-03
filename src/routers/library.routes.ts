import { Router } from "express";
import { validateSchema } from "../middlewares/validate.schema.js";
import { libraryCreateDeleteSchema } from "../schemas/library.create.delete.schema.js";
import { libraryController } from "../container.js";

const router = Router();

router.get("/", (req, res) => res.send("Hello from Library Routes"));

router.post(
  "/",
  validateSchema(libraryCreateDeleteSchema),
  libraryController.addNovelToLibrary,
);

router.delete(
  "/",
  validateSchema(libraryCreateDeleteSchema),
  libraryController.removeNovelFromLibrary,
);

export default router;
