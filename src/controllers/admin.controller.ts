import { IAdminService } from "../interfaces/admin.service.interface.js";

export class AdminController {
  constructor(private adminService: IAdminService) {}

  createAnnouncement = async (req: any, res: any, next: any) => {
    await this.adminService.createAnnouncement(req.body);
    res.status(201).json({ message: "Duyuru başarıyla oluşturuldu." });
  };
}
