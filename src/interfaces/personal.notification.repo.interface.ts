import { FindAndCountType } from "../constants/findAndCountType.js";
import { NotificationType } from "../constants/notification.constants.js";
import { PersonalNotification } from "../entities/PersonalNotification.js";
import { GetNotificationsDto } from "../schemas/get.notifications.schema.js";

export interface IPersonalNotificationRepository {
  createNotification(dto: CreateNotificationDto): Promise<void>;
  getUserNotifications(
    dto: GetNotificationsDto,
  ): Promise<FindAndCountType<PersonalNotification>>;
  getUnreadCount(userId: string): Promise<number>;
  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  deleteNotification(notificationId: string, userId: string): Promise<number>;
}

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  /** * Bildirimle ilgili ek veriler.
   * Örn: { orderId: "123" } veya { senderId: "uuid" }
   */
  data?: Record<string, unknown>;
}
