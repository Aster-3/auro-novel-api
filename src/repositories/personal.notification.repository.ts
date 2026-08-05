import { Repository } from "typeorm";
import { PersonalNotification } from "../entities/PersonalNotification.js";
import {
  CreateAggregatedNotificationDto,
  CreateNotificationDto,
  AggregatedNotificationResult,
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
      aggregationKey: null,
      actorCount: 1,
      titleSnapshot: dto.titleSnapshot ?? null,
      data: dto.data ? JSON.stringify(dto.data) : null,
      lastActivityAt: new Date(),
    });

    await this.notificationRepo.save(notification);
  }

  async createOrUpdateAggregatedNotification(
    dto: CreateAggregatedNotificationDto,
    pushThrottleMs: number,
  ): Promise<AggregatedNotificationResult> {
    const now = new Date();
    const existing = await this.notificationRepo
      .createQueryBuilder("notification")
      .addSelect("notification.userId")
      .addSelect("notification.aggregationKey")
      .addSelect("notification.lastPushedAt")
      .where("notification.userId = :userId", { userId: dto.userId })
      .andWhere("notification.aggregationKey = :aggregationKey", {
        aggregationKey: dto.aggregationKey,
      })
      .getOne();

    if (!existing) {
      const notification = this.notificationRepo.create({
        userId: dto.userId,
        actorUserId: dto.actorUserId ?? null,
        type: dto.type,
        targetType: dto.targetType,
        targetId: dto.targetId ?? null,
        targetUrl: dto.targetUrl ?? null,
        aggregationKey: dto.aggregationKey,
        actorCount: 1,
        titleSnapshot: dto.titleSnapshot ?? null,
        data: dto.data ? JSON.stringify(dto.data) : null,
        lastActivityAt: now,
        lastPushedAt: now,
      });

      return {
        notification: await this.notificationRepo.save(notification),
        shouldSendPush: true,
      };
    }

    const lastPushedAt = existing.lastPushedAt;
    const shouldSendPush =
      !lastPushedAt || now.getTime() - lastPushedAt.getTime() >= pushThrottleMs;

    existing.actorUserId = dto.actorUserId ?? null;
    existing.targetType = dto.targetType;
    existing.targetId = dto.targetId ?? null;
    existing.targetUrl = dto.targetUrl ?? null;
    existing.actorCount = (existing.actorCount || 1) + 1;
    existing.titleSnapshot = dto.titleSnapshot ?? null;
    existing.data = dto.data ? JSON.stringify(dto.data) : null;
    existing.isRead = false;
    existing.readAt = null;
    existing.lastActivityAt = now;
    if (shouldSendPush) {
      existing.lastPushedAt = now;
    }

    return {
      notification: await this.notificationRepo.save(existing),
      shouldSendPush,
    };
  }

  async updateNotificationSnapshots(
    notificationId: string,
    titleSnapshot: string,
  ): Promise<void> {
    await this.notificationRepo.update(
      { id: notificationId },
      { titleSnapshot },
    );
  }

  async getUserNotifications(
    dto: GetNotificationsDto,
  ): Promise<FindAndCountType<PersonalNotification>> {
    const { userId, page, limit } = dto;
    const skip = (page - 1) * limit;

    const recentRows = await this.notificationRepo
      .createQueryBuilder("notification")
      .select("notification.id", "id")
      .where("notification.userId = :userId", { userId })
      .orderBy("notification.lastActivityAt", "DESC")
      .addOrderBy("notification.createdAt", "DESC")
      .limit(200)
      .getRawMany<{ id: string }>();

    const totalCount = recentRows.length;
    const pageIds = recentRows.slice(skip, skip + limit).map((row) => row.id);
    const notifications = pageIds.length
      ? await this.notificationRepo
          .createQueryBuilder("notification")
          .leftJoinAndSelect("notification.actorUser", "actorUser")
          .select([
            "notification",
            "actorUser.id",
            "actorUser.username",
            "actorUser.nickname",
            "actorUser.profileImageUrl",
          ])
          .where("notification.id IN (:...pageIds)", { pageIds })
          .orderBy("notification.lastActivityAt", "DESC")
          .addOrderBy("notification.createdAt", "DESC")
          .getMany()
      : [];
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
