import { FindAndCountType } from "../constants/findAndCountType.js";
import { GetNotificationsDto } from "../schemas/get.notifications.schema.js";
import { GlobalNotification } from "../entities/GlobalNotification.js";

export type GlobalNotificationWithSeenState = GlobalNotification & {
  isNew: boolean;
};

export interface IGlobalNotificationRepository {
  createGlobalNotification(
    dto: CreateGlobalNotificationDto,
  ): Promise<GlobalNotification>;
  getGlobalNotifications(
    dto: GetNotificationsDto,
    lastSeenDate: Date,
  ): Promise<FindAndCountType<GlobalNotificationWithSeenState>>;
  getGlobalNotificationById(
    notificationId: string,
    lastSeenDate: Date,
  ): Promise<GlobalNotificationWithSeenState | null>;
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
