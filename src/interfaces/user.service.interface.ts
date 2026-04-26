import { FindAndCountType } from "../constants/findAndCountType.js";
import { CreateUserDto } from "../dtos/create.user.dto.js";
import { UserLoginResponseDto } from "../dtos/login.dto.js";
import { GlobalNotification } from "../entities/_index.js";
import { PersonalNotification } from "../entities/PersonalNotification.js";
import { ReadingStats } from "../entities/ReadingStats.js";
import { User } from "../entities/User.js";
import { UserVerification } from "../entities/UserVerification.js";
import { GetMeQuery } from "../schemas/get.me.schema.js";
import { GetNotificationsDto } from "../schemas/get.notifications.schema.js";
import { GetUsersDto } from "../schemas/get.users.schema.js";
import { UpdateReadingStatsDto } from "../schemas/update.reading.stats.schema.js";
import { UpdateUserDto } from "../schemas/update.user.schema.js";
import { UserLoginDto } from "../schemas/user.login.shema.js";
import { VerifyUserDto } from "../schemas/verify.user.schema.js";
import { CreateNotificationDto } from "./personal.notification.repo.interface.js";

export interface IUserService {
  create(dto: CreateUserDto): Promise<User | null>;
  getOneUser(id: string): Promise<User>;
  deleteUser(id: string): Promise<void>;
  searchUsers(dto: GetUsersDto): Promise<FindAndCountType<User>>;
  verifyUser(dto: VerifyUserDto): Promise<User>;
  getAllVerifications(): Promise<UserVerification[]>;
  resendCode(email: string): Promise<{ message: string }>;
  login: (dto: UserLoginDto) => Promise<{
    user: UserLoginResponseDto;
    accessToken?: string;
    refreshToken?: string;
  }>;
  updateUser(dto: UpdateUserDto): Promise<User>;
  getMe(dto: GetMeQuery): Promise<User | null>;
  refreshToken(refreshToken: string): Promise<{
    user: UserLoginResponseDto;
    accessToken?: string;
  }>;
  getUserBalance(
    userId: string,
  ): Promise<{ moonCoins: number; sunCoins: number }>;
  getReadingStats(userId: string): Promise<ReadingStats[]>;
  getUserNovelStats(
    userId: string,
    novelId: string,
  ): Promise<ReadingStats | null>;
  updateReadingStats(dto: UpdateReadingStatsDto): Promise<void>;
  createPersonalNotification(dto: CreateNotificationDto): Promise<void>;
  getPersonalNotifications(
    dto: GetNotificationsDto,
  ): Promise<FindAndCountType<PersonalNotification>>;
  deletePersonalNotification(
    notificationId: string,
    userId: string,
  ): Promise<void>;
  markPersonalNotificationAsRead(notificationId: string): Promise<void>;
  markAllPersonalNotificationsAsRead(userId: string): Promise<void>;
  getTotalUnreadNotificationCount(userId: string): Promise<{
    personalUnreadCount: number;
    globalUnreadCount: number;
    totalUnreadCount: number;
  }>;
  getGlobalNotifications(
    dto: GetNotificationsDto,
  ): Promise<FindAndCountType<GlobalNotification>>;
  setLastSeenNotificationDate(userId: string, date: Date): Promise<void>;
}
