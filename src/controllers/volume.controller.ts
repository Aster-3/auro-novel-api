import { IVolumeService } from "../interfaces/volume.service.interface.js";

export class VolumeController {
  constructor(private volumeService: IVolumeService) {}

  createVolume = async (req: any, res: any) => {
    console.log(res.locals.validatedData);
    console.log("BOdy:", req.body);
    await this.volumeService.createVolume(res.locals.validatedData);
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
    res.json(volumes);
  };
}
