import { FindAndCountType } from "../constants/findAndCountType.js";
import {
  NotificationTargetType,
  PersonalNotificationType,
} from "../constants/notification.constants.js";
import { PersonalNotification } from "../entities/PersonalNotification.js";
import { GetNotificationsDto } from "../schemas/get.notifications.schema.js";

export interface IPersonalNotificationRepository {
  createNotification(dto: CreateNotificationDto): Promise<void>;
  getUserNotifications(
    dto: GetNotificationsDto,
  ): Promise<FindAndCountType<PersonalNotification>>;
  getUnreadCount(userId: string): Promise<number>;
  markAsRead(notificationId: string, userId: string): Promise<number>;
  markAllAsRead(userId: string): Promise<void>;
  deleteNotification(notificationId: string, userId: string): Promise<number>;
}

export interface CreateNotificationDto {
  userId: string;
  actorUserId?: string | null;
  type: PersonalNotificationType;
  targetType: NotificationTargetType;
  targetId?: string | null;
  targetUrl?: string | null;
  titleSnapshot?: string | null;
  bodySnapshot?: string | null;
  data?: Record<string, unknown>;
}
