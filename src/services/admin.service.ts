import { IAdminService } from "../interfaces/admin.service.interface.js";
import { CreateGlobalNotificationDto } from "../interfaces/global.notification.repo.interface.js";
import { UnitOfWork } from "../unit-of-work/unit.of.work.js";

export class AdminService implements IAdminService {
  constructor(private uow: UnitOfWork) {}

  async createAnnouncement(dto: CreateGlobalNotificationDto): Promise<void> {
    await this.uow.globalNotificationRepository.createGlobalNotification(dto);
  }

  async deleteAnnouncement(id: string) {
    await this.uow.globalNotificationRepository.deleteNotification(id);
  }
}
