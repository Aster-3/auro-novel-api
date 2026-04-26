import { CreateGlobalNotificationDto } from "./global.notification.repo.interface.js";

export interface IAdminService {
  createAnnouncement(dto: CreateGlobalNotificationDto): Promise<void>;
  deleteAnnouncement(id: string): Promise<void>;
}
