import { Router } from "express";
import { getNovelController } from "../factories/novel.factory.js";
import { validateSchema } from "../middlewares/validate.schema.js";
import { getAllNovelsSchema } from "../schemas/get.all.novels.schema.js";
import { getOneWithUuid } from "../schemas/get.one.with.uuid.schema.js";
import { createNovelSchema } from "../schemas/create.novel.schema.js";
const router = Router();
const novelController = getNovelController();

router.get(
  "/",
  validateSchema(getAllNovelsSchema),
  novelController.getAllNovels,
);

router.post(
  "/",
  validateSchema(createNovelSchema),
  novelController.createNovel,
);

router.get("/:id", validateSchema(getOneWithUuid), novelController.getOneNovel);

router.get("/:id/comments", novelController.getNovelComments);

router.post("/:id/comments", novelController.addNovelComment);

export default router;
