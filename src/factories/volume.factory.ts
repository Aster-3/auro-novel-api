import { VolumeController } from "../controllers/volume.controller.js";
import { AppDataSource } from "../database/data-source.js";
import { Volume } from "../entities/Volume.js";
import { VolumeRepository } from "../repositories/volume.repository.js";
import { VolumeService } from "../services/volume.service.js";

export const getVolumeController = () => {
  const volumeRepo = new VolumeRepository(AppDataSource.getRepository(Volume));
  const volumeService = new VolumeService(volumeRepo);
  const volumeController = new VolumeController(volumeService);
  return volumeController;
};
