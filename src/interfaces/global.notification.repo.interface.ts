import { FindAndCountType } from "../constants/findAndCountType.js";
import { GetNotificationsDto } from "../schemas/get.notifications.schema.js";
import { GlobalNotification } from "../entities/GlobalNotification.js";

export interface IGlobalNotificationRepository {
  createGlobalNotification(
    dto: CreateGlobalNotificationDto,
  ): Promise<GlobalNotification>;
  getGlobalNotifications(
    dto: GetNotificationsDto,
    lastSeenDate: Date,
  ): Promise<FindAndCountType<GlobalNotification>>;
  getGlobalNotificationById(
    notificationId: string,
    lastSeenDate: Date,
  ): Promise<(GlobalNotification & { isNew: boolean }) | null>;
  deleteNotification(notificationId: string): Promise<number>;
  getTotalUnreadCount(lastSeenDate: Date): Promise<number>;
}

export interface CreateGlobalNotificationDto {
  title: string;
  summary: string;
  content: string;
  priority?: number;
  isPublished?: boolean;
  publishedAt?: Date | null;
  expiresAt?: Date | null;
}
