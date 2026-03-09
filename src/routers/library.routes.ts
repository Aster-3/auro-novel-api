import { Router } from "express";
import { getLibraryController } from "../factories/library.factory.js";
import { validateSchema } from "../middlewares/validate.schema.js";
import { libraryCreateDeleteSchema } from "../schemas/library.create.delete.schema.js";

const libraryController = getLibraryController();
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
