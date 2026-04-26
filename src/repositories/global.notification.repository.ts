import { MoreThan, Repository } from "typeorm";
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
  ): Promise<void> {
    const notification = this.notificationRepo.create(dto);
    await this.notificationRepo.save(notification);
  }

  async getGlobalNotifications(dto: GetNotificationsDto, lastSeenDate: Date) {
    const { page, limit } = dto;
    const skip = (page - 1) * limit;

    const [notifications, totalCount] =
      await this.notificationRepo.findAndCount({
        order: { createdAt: "DESC" },
        skip,
        take: limit,
      });

    const totalPages = Math.ceil(totalCount / limit);
    const nextPage = page + 1;

    const itemsWithFlag = notifications.map((notification) => ({
      ...notification,
      isNew: lastSeenDate ? notification.createdAt > lastSeenDate : true,
    }));

    return {
      items: itemsWithFlag,
      total: totalCount,
      currentPage: page,
      nextPage: nextPage > totalPages ? null : nextPage,
      lastPage: totalPages,
    };
  }

  async deleteNotification(notificationId: string) {
    const deleteResult = await this.notificationRepo.delete({
      id: notificationId,
    });
    return deleteResult.affected || 0;
  }

  async getTotalUnreadCount(lastSeenDate: Date): Promise<number> {
    const count = await this.notificationRepo.count({
      where: {
        createdAt: MoreThan(lastSeenDate),
      },
    });
    return count;
  }
}
