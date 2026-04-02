import { IVolumeService } from "../interfaces/volume.service.interface.js";

export class VolumeController {
  constructor(private volumeService: IVolumeService) {}

  createVolume = async (req: any, res: any) => {
    const isAdmin = req.user?.role === "admin";
    const userId = req.user?.id || "";
    await this.volumeService.createVolume(
      res.locals.validatedData,
      isAdmin,
      userId,
    );
    res.status(201).json({ message: "Cilt başarıyla oluşturuldu." });
  };

  deleteVolume = async (req: any, res: any) => {
    const { id } = req.params;
    await this.volumeService.deleteVolume(id);
    res.sendStatus(204);
  };

  getVolumeByNovelId = async (req: any, res: any) => {
    const { id } = req.params;
    const volumes = await this.volumeService.getVolumeByNovelId(id);
    res.json({ volumes });
  };
}
