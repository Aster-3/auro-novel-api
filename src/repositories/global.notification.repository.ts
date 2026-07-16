import {
  Brackets,
  IsNull,
  LessThanOrEqual,
  MoreThan,
  Repository,
} from "typeorm";
import {
  CreateGlobalNotificationDto,
  IGlobalNotificationRepository,
} from "../interfaces/global.notification.repo.interface.js";
import { GetNotificationsDto } from "../schemas/get.notifications.schema.js";
import { GlobalNotification } from "../entities/GlobalNotification.js";

export class GlobalNotificationRepository implements IGlobalNotificationRepository {
  constructor(private notificationRepo: Repository<GlobalNotification>) {}

  async createGlobalNotification(
    dto: CreateGlobalNotificationDto,
  ): Promise<GlobalNotification> {
    const notification = this.notificationRepo.create({
      ...dto,
      isPublished: dto.isPublished ?? true,
      priority: dto.priority ?? 0,
      publishedAt:
        dto.publishedAt ?? (dto.isPublished === false ? null : new Date()),
    });

    return await this.notificationRepo.save(notification);
  }

  async getGlobalNotifications(dto: GetNotificationsDto, lastSeenDate: Date) {
    const { page, limit } = dto;
    const skip = (page - 1) * limit;
    const now = new Date();

    const query = this.notificationRepo
      .createQueryBuilder("notification")
      .where("notification.isPublished = :isPublished", { isPublished: true })
      .andWhere("notification.publishedAt <= :now", { now })
      .andWhere(
        new Brackets((qb) => {
          qb.where("notification.expiresAt IS NULL").orWhere(
            "notification.expiresAt > :now",
            { now },
          );
        }),
      )
      .orderBy("notification.priority", "DESC")
      .addOrderBy("notification.publishedAt", "DESC")
      .addOrderBy("notification.createdAt", "DESC")
      .skip(skip)
      .take(limit);

    const [notifications, totalCount] = await query.getManyAndCount();
    const totalPages = Math.ceil(totalCount / limit);
    const nextPage = page + 1;

    const itemsWithFlag = notifications.map((notification) => ({
      ...notification,
      isNew: notification.createdAt > lastSeenDate,
    }));

    return {
      items: itemsWithFlag,
      total: totalCount,
      currentPage: page,
      nextPage: nextPage > totalPages ? null : nextPage,
      lastPage: totalPages,
    };
  }

  async getGlobalNotificationById(
    notificationId: string,
    lastSeenDate: Date,
  ) {
    const now = new Date();
    const notification = await this.notificationRepo
      .createQueryBuilder("notification")
      .where("notification.id = :notificationId", { notificationId })
      .andWhere("notification.isPublished = :isPublished", {
        isPublished: true,
      })
      .andWhere("notification.publishedAt <= :now", { now })
      .andWhere(
        new Brackets((qb) => {
          qb.where("notification.expiresAt IS NULL").orWhere(
            "notification.expiresAt > :now",
            { now },
          );
        }),
      )
      .getOne();

    if (!notification) {
      return null;
    }

    return {
      ...notification,
      isNew: notification.createdAt > lastSeenDate,
    };
  }

  async deleteNotification(notificationId: string) {
    const deleteResult = await this.notificationRepo.delete({
      id: notificationId,
    });
    return deleteResult.affected || 0;
  }

  async getTotalUnreadCount(lastSeenDate: Date): Promise<number> {
    const now = new Date();

    return await this.notificationRepo.count({
      where: [
        {
          isPublished: true,
          publishedAt: LessThanOrEqual(now),
          expiresAt: MoreThan(now),
          createdAt: MoreThan(lastSeenDate),
        },
        {
          isPublished: true,
          publishedAt: LessThanOrEqual(now),
          expiresAt: IsNull(),
          createdAt: MoreThan(lastSeenDate),
        },
      ],
    });
  }
}
