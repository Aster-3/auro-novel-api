import { FindAndCountType } from "../constants/findAndCountType.js";
import { CreateUserDto } from "../dtos/create.user.dto.js";
import { UserLoginResponseDto } from "../dtos/login.dto.js";
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
import { UserDevice } from "../entities/UserDevice.js";
import {
  RegisterUserDeviceDto,
  UnregisterUserDeviceDto,
} from "../schemas/register.user.device.schema.js";
import {
  GetUserFollowsDto,
  UserFollowCounts,
} from "./user.follow.repo.interface.js";
import {
  GetUserShowcaseDto,
  GetUserLibraryShowcaseDto,
} from "../schemas/get.user.showcase.schema.js";
import { PublicUserProfile } from "./user.repo.interface.js";
import { ForgotPasswordDto } from "../schemas/forgot.password.schema.js";
import { ResetPasswordDto } from "../schemas/reset.password.schema.js";
import { ChangePasswordDto } from "../schemas/change.password.schema.js";
import { GlobalNotificationWithSeenState } from "./global.notification.repo.interface.js";
import { DeleteMyAccountDto } from "../schemas/delete.my.account.schema.js";

export interface IUserService {
  create(dto: CreateUserDto): Promise<{
    user: User;
    verificationEmailSent: boolean;
  }>;
  getOneUser(id: string): Promise<User>;
  getUserProfile(id: string): Promise<PublicUserProfile>;
  getUserReviews(
    dto: GetUserShowcaseDto,
    viewerId?: string,
  ): Promise<FindAndCountType<any>>;
  getUserReplies(
    dto: GetUserShowcaseDto,
    viewerId?: string,
  ): Promise<FindAndCountType<any>>;
  getUserLibrary(
    dto: GetUserLibraryShowcaseDto,
  ): Promise<FindAndCountType<any>>;
  getUserRecentActivity(
    userId: string,
    viewerId?: string,
  ): Promise<{
    recentReviews: any[];
    recentReplies: any[];
    recentReads: any[];
  }>;
  deleteMyAccount(
    userId: string,
    dto: DeleteMyAccountDto,
  ): Promise<{ message: string }>;
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
  forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }>;
  resetPassword(dto: ResetPasswordDto): Promise<{ message: string }>;
  changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }>;
  getReadingStats(userId: string): Promise<ReadingStats[]>;
  getUserNovelStats(
    userId: string,
    novelId: string,
  ): Promise<ReadingStats | null>;
  updateReadingStats(dto: UpdateReadingStatsDto): Promise<void>;
  getPersonalNotifications(
    dto: GetNotificationsDto,
  ): Promise<FindAndCountType<PersonalNotification>>;
  deletePersonalNotification(
    notificationId: string,
    userId: string,
  ): Promise<void>;
  markPersonalNotificationAsRead(
    notificationId: string,
    userId: string,
  ): Promise<void>;
  markAllPersonalNotificationsAsRead(userId: string): Promise<void>;
  getTotalUnreadNotificationCount(userId: string): Promise<{
    personalUnreadCount: number;
    globalUnreadCount: number;
    totalUnreadCount: number;
  }>;
  getGlobalNotifications(
    dto: GetNotificationsDto,
  ): Promise<FindAndCountType<GlobalNotificationWithSeenState>>;
  getGlobalNotificationById(
    notificationId: string,
    userId: string,
  ): Promise<GlobalNotificationWithSeenState>;
  setLastGlobalNotificationSeenAt(userId: string, date: Date): Promise<void>;
  registerDevice(dto: RegisterUserDeviceDto): Promise<UserDevice>;
  unregisterDevice(dto: UnregisterUserDeviceDto): Promise<void>;
  followUser(
    followerId: string,
    followingId: string,
  ): Promise<{ isFollowing: boolean; created: boolean }>;
  unfollowUser(
    followerId: string,
    followingId: string,
  ): Promise<{ isFollowing: boolean; removed: boolean }>;
  getFollowStatus(
    followerId: string,
    followingId: string,
  ): Promise<UserFollowCounts & { isFollowing: boolean }>;
  getFollowCounts(userId: string): Promise<UserFollowCounts>;
  getFollowers(dto: GetUserFollowsDto): Promise<FindAndCountType<User>>;
  getFollowing(dto: GetUserFollowsDto): Promise<FindAndCountType<User>>;
}
