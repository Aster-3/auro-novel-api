import { IVolumeService } from "../interfaces/volume.service.interface.js";

export class VolumeController {
  constructor(private volumeService: IVolumeService) {}

  createVolume = async (req: any, res: any) => {
    const isAdmin = req.user?.role === "admin";
    const userId = req.user?.id || "";
    console.log(
      "Milestone: Volume found, proceeding with update checks.",
      req.user,
      req.body,
      res.locals.validatedData,
    );

    await this.volumeService.createVolume(
      res.locals.validatedData,
      isAdmin,
      userId,
    );
    res.status(201).json({ message: "Cilt başarıyla oluşturuldu." });
  };

  deleteVolume = async (req: any, res: any) => {
    const { id } = req.params;
    const isAdmin = req.user?.role === "admin";
    const userId = req.user?.id || "";
    await this.volumeService.deleteVolume(id, isAdmin, userId);
    res.sendStatus(204);
  };

  getVolumeByNovelId = async (req: any, res: any) => {
    const { id } = req.params;
    const volumes = await this.volumeService.getVolumeByNovelId(id);
    res.json({ volumes });
  };

  updateVolume = async (req: any, res: any) => {
    const { id } = req.params;
    const isAdmin = req.user?.role === "admin";
    const userId = req.user?.id || "";

    await this.volumeService.updateVolume(
      id,
      res.locals.validatedData.name,
      isAdmin,
      userId,
    );
    res.json({ message: "Cilt başarıyla güncellendi." });
  };
}
