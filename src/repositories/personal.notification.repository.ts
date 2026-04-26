import { Repository } from "typeorm";
import { PersonalNotification } from "../entities/PersonalNotification.js";
import {
  CreateNotificationDto,
  IPersonalNotificationRepository,
} from "../interfaces/personal.notification.repo.interface.js";
import { FindAndCountType } from "../constants/findAndCountType.js";
import { GetNotificationsDto } from "../schemas/get.notifications.schema.js";

export class PersonalNotificationRepository implements IPersonalNotificationRepository {
  constructor(private notificationRepo: Repository<PersonalNotification>) {}

  async createNotification(dto: CreateNotificationDto): Promise<void> {
    const notification = this.notificationRepo.create({
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
      body: dto.body,
      data: dto.data ? JSON.stringify(dto.data) : null,
    });
    await this.notificationRepo.save(notification);
  }

  async getUserNotifications(
    dto: GetNotificationsDto,
  ): Promise<FindAndCountType<PersonalNotification>> {
    const { userId, page, limit } = dto;

    const skip = (page - 1) * limit;
    const query = this.notificationRepo.findAndCount({
      where: { userId },
      order: { createdAt: "DESC" },
      skip,
      take: limit,
    });

    const nextPage = page + 1;
    const totalPages = Math.ceil((await query)[1] / limit);

    return {
      items: (await query)[0],
      total: (await query)[1],
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

  async markAsRead(notificationId: string): Promise<void> {
    await this.notificationRepo.update(
      { id: notificationId },
      { isRead: true },
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo
      .createQueryBuilder()
      .update(PersonalNotification)
      .set({ isRead: true })
      .where("userId = :userId", { userId })
      .execute();
  }

  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<number> {
    const result = await this.notificationRepo.delete({
      id: notificationId,
      userId,
    });
    return result.affected || 0; // Kaç satır silindiğini dön (0 veya 1)
  }
}
