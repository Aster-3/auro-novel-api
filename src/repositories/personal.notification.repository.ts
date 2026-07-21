import { Repository } from "typeorm";
import { PersonalNotification } from "../entities/PersonalNotification.js";
import {
  CreateNotificationDto,
  IPersonalNotificationRepository,
} from "../interfaces/personal.notification.repo.interface.js";
import { FindAndCountType } from "../constants/findAndCountType.js";
import { GetNotificationsDto } from "../schemas/get.notifications.schema.js";
import { presentUser } from "../utils/deleted.user.presenter.js";

export class PersonalNotificationRepository implements IPersonalNotificationRepository {
  constructor(private notificationRepo: Repository<PersonalNotification>) {}

  async createNotification(dto: CreateNotificationDto): Promise<void> {
    const notification = this.notificationRepo.create({
      userId: dto.userId,
      actorUserId: dto.actorUserId ?? null,
      type: dto.type,
      targetType: dto.targetType,
      targetId: dto.targetId ?? null,
      targetUrl: dto.targetUrl ?? null,
      titleSnapshot: dto.titleSnapshot ?? null,
      bodySnapshot: dto.bodySnapshot ?? null,
      data: dto.data ? JSON.stringify(dto.data) : null,
    });

    await this.notificationRepo.save(notification);
  }

  async getUserNotifications(
    dto: GetNotificationsDto,
  ): Promise<FindAndCountType<PersonalNotification>> {
    const { userId, page, limit } = dto;
    const skip = (page - 1) * limit;

    const [notifications, totalCount] = await this.notificationRepo
      .createQueryBuilder("notification")
      .leftJoinAndSelect("notification.actorUser", "actorUser")
      .select([
        "notification",
        "actorUser.id",
        "actorUser.username",
        "actorUser.nickname",
        "actorUser.profileImageUrl",
      ])
      .where("notification.userId = :userId", { userId })
      .orderBy("notification.createdAt", "DESC")
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const nextPage = page + 1;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      items: notifications.map((notification) => ({
        ...notification,
        actorUser: notification.actorUserId
          ? presentUser(notification.actorUser)
          : null,
      })) as any[],
      total: totalCount,
      currentPage: page,
      nextPage: nextPage > totalPages ? null : nextPage,
      lastPage: totalPages,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepo.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<number> {
    const result = await this.notificationRepo.update(
      { id: notificationId, userId },
      { isRead: true, readAt: new Date() },
    );

    return result.affected || 0;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo
      .createQueryBuilder()
      .update(PersonalNotification)
      .set({ isRead: true, readAt: new Date() })
      .where("userId = :userId", { userId })
      .andWhere("isRead = :isRead", { isRead: false })
      .execute();
  }

  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<number> {
    const result = await this.notificationRepo.softDelete({
      id: notificationId,
      userId,
    });

    return result.affected || 0;
  }
}
