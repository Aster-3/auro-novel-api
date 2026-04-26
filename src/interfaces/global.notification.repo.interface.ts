import { FindAndCountType } from "../constants/findAndCountType.js";
import { GetNotificationsDto } from "../schemas/get.notifications.schema.js";
import { GlobalNotification } from "../entities/GlobalNotification.js";

export interface IGlobalNotificationRepository {
  createGlobalNotification(dto: CreateGlobalNotificationDto): Promise<void>;
  getGlobalNotifications(
    dto: GetNotificationsDto,
    lastSeenDate: Date,
  ): Promise<FindAndCountType<GlobalNotification>>;
  deleteNotification(notificationId: string): Promise<number>;
  getTotalUnreadCount(lastSeenDate: Date): Promise<number>;
}

export interface CreateGlobalNotificationDto {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}
