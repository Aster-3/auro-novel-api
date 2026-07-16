import { Router } from "express";
import { bannerController } from "../container.js";

const router = Router();

router.get("/", bannerController.getHomeBanners);

export default router;
