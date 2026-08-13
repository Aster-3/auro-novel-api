import { Repository } from "typeorm";
import { PersonalNotification } from "../entities/PersonalNotification.js";
import {
  CreateAggregatedNotificationDto,
  CreateNotificationDto,
  AggregatedNotificationResult,
  IPersonalNotificationRepository,
  PersonalNotificationResponse,
  SyncAggregatedNotificationOptions,
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
    const result = await this.syncAggregatedNotification(dto, pushThrottleMs);
    if (!result) {
      throw new Error("Aggregated notification could not be created.");
    }
    return result;
  }

  async syncAggregatedNotification(
    dto: CreateAggregatedNotificationDto,
    pushThrottleMs: number,
    options: SyncAggregatedNotificationOptions = {},
  ): Promise<AggregatedNotificationResult | null> {
    const { createIfMissing = true, allowPush = true } = options;
    const now = new Date();
    const actorCount = Math.max(dto.actorCount ?? 1, 1);
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
      if (!createIfMissing) {
        return null;
      }

      const notification = this.notificationRepo.create({
        userId: dto.userId,
        actorUserId: dto.actorUserId ?? null,
        type: dto.type,
        targetType: dto.targetType,
        targetId: dto.targetId ?? null,
        targetUrl: dto.targetUrl ?? null,
        aggregationKey: dto.aggregationKey,
        actorCount,
        titleSnapshot: dto.titleSnapshot ?? null,
        data: dto.data ? JSON.stringify(dto.data) : null,
        lastActivityAt: now,
        lastPushedAt: allowPush ? now : null,
      });

      return {
        notification: await this.notificationRepo.save(notification),
        shouldSendPush: allowPush,
      };
    }

    const lastPushedAt = existing.lastPushedAt;
    const shouldSendPush =
      allowPush &&
      (!lastPushedAt || now.getTime() - lastPushedAt.getTime() >= pushThrottleMs);

    existing.actorUserId = dto.actorUserId ?? null;
    existing.targetType = dto.targetType;
    existing.targetId = dto.targetId ?? null;
    existing.targetUrl = dto.targetUrl ?? null;
    existing.actorCount = actorCount;
    existing.titleSnapshot = dto.titleSnapshot ?? null;
    existing.data = dto.data ? JSON.stringify(dto.data) : null;
    if (allowPush) {
      existing.isRead = false;
      existing.readAt = null;
      existing.lastActivityAt = now;
    }
    if (shouldSendPush) {
      existing.lastPushedAt = now;
    }

    return {
      notification: await this.notificationRepo.save(existing),
      shouldSendPush,
    };
  }

  async softDeleteAggregatedNotification(
    userId: string,
    aggregationKey: string,
  ): Promise<number> {
    const result = await this.notificationRepo.softDelete({
      userId,
      aggregationKey,
    });

    return result.affected || 0;
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
  ): Promise<FindAndCountType<PersonalNotificationResponse>> {
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
      items: notifications.map((notification) =>
        this.mapNotificationResponse(notification),
      ),
      total: totalCount,
      currentPage: page,
      nextPage: nextPage > totalPages ? null : nextPage,
      lastPage: totalPages,
    };
  }

  private mapNotificationResponse(
    notification: PersonalNotification,
  ): PersonalNotificationResponse {
    const actorUser = notification.actorUserId
      ? presentUser(notification.actorUser)
      : null;

    return {
      id: notification.id,
      type: notification.type,
      actorCount: notification.actorCount,
      actorUser: actorUser
        ? {
            id: actorUser.id ?? null,
            nickname: actorUser.nickname ?? "Silinmis Kullanici",
            profileImageUrl: actorUser.profileImageUrl,
            isDeletedUser: actorUser.isDeletedUser,
          }
        : null,
      navigation: notification.data ?? null,
      isRead: notification.isRead,
      readAt: notification.readAt ?? null,
      lastActivityAt: notification.lastActivityAt,
      createdAt: notification.createdAt,
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
