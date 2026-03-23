import { Router } from "express";
import { getNovelDailyStatsController } from "../factories/novel.daily.stats.factory.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validate.schema.js";
import { getNovelStatsSchema } from "../schemas/get.novel.stats.schema.js";

const router = Router();
const novelDailyStatsController = getNovelDailyStatsController();

router.get(
  "/novels/:novelId/stats",
  authMiddleware,
  validateSchema(getNovelStatsSchema),
  novelDailyStatsController.getDashboardStats,
);

export default router;
