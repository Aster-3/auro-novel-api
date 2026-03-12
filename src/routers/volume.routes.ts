import { Router } from "express";
import { getVolumeController } from "../factories/volume.factory.js";
import { validateSchema } from "../middlewares/validate.schema.js";
import { createVolumeSchema } from "../schemas/create.volume.schema.js";
import { deleteVolumeSchema } from "../schemas/delete.volume.schema.js";
import { uuidControlSchema } from "../schemas/uuid.control.schema.js";

const router = Router();
const volumeController = getVolumeController();

router.get(
  "/:id",
  validateSchema(uuidControlSchema),
  volumeController.getVolumeByNovelId,
);

router.post(
  "/",
  validateSchema(createVolumeSchema),
  volumeController.createVolume,
);
router.delete(
  "/:id",
  validateSchema(deleteVolumeSchema),
  volumeController.deleteVolume,
);

export default router;
