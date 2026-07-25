import { IUserRepository } from "../interfaces/user.repo.interface.js";
import { CreateUserDto } from "../dtos/create.user.dto.js";
import { IUserService } from "../interfaces/user.service.interface.js";
import { ConflictError } from "../errors/conflict.error.js";
import { NotFoundError } from "../errors/not.found.error.js";
import { GetUsersDto } from "../schemas/get.users.schema.js";
import * as argon2 from "argon2";
import { VerifyUserDto } from "../schemas/verify.user.schema.js";
import { ForbiddenError } from "../errors/forbidden.error.js";
import { BadRequestError } from "../errors/bad.request.js";
import { MailService } from "./mail.service.js";
import { UserLoginDto } from "../schemas/user.login.shema.js";
import { TokenService } from "./token.service.js";
import { User } from "../entities/User.js";
import { UpdateUserDto } from "../schemas/update.user.schema.js";
import { GetMeQuery } from "../schemas/get.me.schema.js";
import { UserLoginResponseDto } from "../dtos/login.dto.js";
import { UnauthenticatedError } from "../errors/unauthenticated.error.js";
import { IUnitOfWork } from "../interfaces/unit.of.work.interface.js";
import { UpdateReadingStatsDto } from "../schemas/update.reading.stats.schema.js";
import { GetNotificationsDto } from "../schemas/get.notifications.schema.js";
import {
  RegisterUserDeviceDto,
  UnregisterUserDeviceDto,
} from "../schemas/register.user.device.schema.js";
import {
  NotificationTargetType,
  PersonalNotificationType,
} from "../constants/notification.constants.js";
import { PushNotificationService } from "./push.notification.service.js";
import { GetUserFollowsDto } from "../interfaces/user.follow.repo.interface.js";
import {
  GetUserLibraryShowcaseDto,
  GetUserShowcaseDto,
} from "../schemas/get.user.showcase.schema.js";
import { ForgotPasswordDto } from "../schemas/forgot.password.schema.js";
import { ResetPasswordDto } from "../schemas/reset.password.schema.js";
import { ChangePasswordDto } from "../schemas/change.password.schema.js";
import { DeleteMyAccountDto } from "../schemas/delete.my.account.schema.js";

const PASSWORD_RESET_CODE_EXPIRY_MS = 10 * 60000;
const PASSWORD_RESET_MAX_ATTEMPTS = 5;
const CODE_RESEND_COOLDOWN_MS = 60 * 1000;
const PASSWORD_RESET_REQUEST_MESSAGE =
  "Eger bu e-posta ile kayitli bir hesap varsa sifre sifirlama kodu gonderildi.";

export class UserService implements IUserService {
  constructor(
    private uow: IUnitOfWork,
    private mailService: MailService,
    private tokenService: TokenService,
    private pushNotificationService: PushNotificationService,
  ) {}

  create = async (dto: CreateUserDto) => {
    const usernameAvailable = await this.uow.userRepository.findOneByUsername(
      dto.username,
    );
    if (usernameAvailable)
      throw new ConflictError("username", "Kullanıcı adı zaten alınmış.");

    const emailAvailable = await this.uow.userRepository.findOneByEmail(
      dto.email,
    );
    if (emailAvailable)
      throw new ConflictError("email", "Email zaten alınmış.");

    const hashedPassword = await argon2.hash(dto.password);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60000);

    await this.uow.startTransaction();

    try {
      const user = await this.uow.userRepository.create(
        { ...dto, password: hashedPassword },
        code,
        expiry,
      );
      await this.uow.commit();
      let verificationEmailSent = false;
      try {
        const mailResult = await this.mailService.sendVerificationCode(
          user.email,
          code,
        );
        verificationEmailSent = Boolean(mailResult);
      } catch (err) {
        console.error("Doğrulama kodu gönderilirken hata oluştu:", err);
      }

      return { user, verificationEmailSent };
    } catch (error) {
      await this.uow.rollback();
      throw error;
    } finally {
      await this.uow.release();
    }
  };

  async deleteMyAccount(userId: string, dto: DeleteMyAccountDto) {
    if (dto.confirmation !== "ONAYLIYORUM") {
      throw new BadRequestError(
        'Hesabi silmek icin "ONAYLIYORUM" yazmalisiniz.',
      );
    }

    const user = await this.uow.userRepository.findWithPasswordById(userId);
    if (!user) {
      throw new NotFoundError("Kullanici bulunamadi.");
    }

    const passwordMatch = await argon2.verify(user.password, dto.password);
    if (!passwordMatch) {
      throw new BadRequestError("Sifre hatali.");
    }

    await this.uow.userRepository.softDeleteUser(user.id);

    return { message: "Hesabiniz basariyla silindi." };
  }

  verifyUser = async (dto: VerifyUserDto) => {
    const verification = await this.uow.userVerificationRepository.findByEmail(
      dto.email,
    );

    if (!verification) {
      const user = await this.uow.userRepository.findOneByEmail(dto.email);

      if (user && user.isVerified) {
        throw new ConflictError("user", "Bu hesap zaten onaylanmış.");
      }
      throw new BadRequestError("E-posta adresi veya doğrulama kodu hatalı.");
    }
    if (verification.attempts >= 5) {
      throw new ForbiddenError(
        "Çok fazla hatalı deneme. Lütfen yeni bir kod isteyin.",
      );
    }

    if (verification.expiry < new Date()) {
      throw new BadRequestError("Doğrulama kodunun süresi dolmuş.");
    }

    if (verification.code !== dto.code) {
      await this.uow.userVerificationRepository.incrementAttempts(
        verification.id,
      );
      throw new BadRequestError("E-posta adresi veya doğrulama kodu hatalı.");
    }

    const user = verification.user;

    if (user.isVerified) {
      throw new ConflictError("user", "Bu hesap zaten doğrulanmış.");
    }
    return await this.uow.userRepository.activateUser(user, verification);
  };

  getOneUser = async (id: string) => {
    const user = await this.uow.userRepository.findOneById(id);
    if (!user) throw new NotFoundError("Kullanıcı bulunamadı.");
    return user;
  };

  getUserProfile = async (id: string) => {
    const user = await this.uow.userRepository.findPublicProfileById(id);
    if (!user) throw new NotFoundError("Kullanici bulunamadi.");
    return user;
  };

  getUserReviews = async (dto: GetUserShowcaseDto, viewerId?: string) => {
    const targetExists = await this.uow.userRepository.exsistById(dto.userId);
    if (!targetExists) {
      throw new NotFoundError("Kullanici bulunamadi.");
    }

    return await this.uow.commentRepository.getReviewsByUserId(dto, viewerId);
  };

  getUserReplies = async (dto: GetUserShowcaseDto, viewerId?: string) => {
    const targetExists = await this.uow.userRepository.exsistById(dto.userId);
    if (!targetExists) {
      throw new NotFoundError("Kullanici bulunamadi.");
    }

    return await this.uow.replyRepository.getRepliesByUserId(dto, viewerId);
  };

  getUserLibrary = async (dto: GetUserLibraryShowcaseDto) => {
    const targetExists = await this.uow.userRepository.exsistById(dto.userId);
    if (!targetExists) {
      throw new NotFoundError("Kullanici bulunamadi.");
    }

    return await this.uow.libraryRepository.getPublicUserLibrary(dto);
  };

  getUserRecentActivity = async (userId: string, viewerId?: string) => {
    const targetProfile =
      await this.uow.userRepository.findPublicProfileById(userId);
    if (!targetProfile) {
      throw new NotFoundError("Kullanici bulunamadi.");
    }

    const recentNovelsPromise =
      targetProfile.isAuthor && targetProfile.authorId
        ? this.uow.novelRepository.getRecentNovelsByAuthorId(
            targetProfile.authorId,
            3,
          )
        : Promise.resolve({ items: [], total: 0 });

    const [novels, reviews, replies, reads, readProgressByNovel] =
      await Promise.all([
        recentNovelsPromise,
        this.uow.commentRepository.getReviewsByUserId(
          { id: userId, userId, page: 1, limit: 3 },
          viewerId,
        ),
        this.uow.replyRepository.getRepliesByUserId(
          { id: userId, userId, page: 1, limit: 3 },
          viewerId,
        ),
        this.uow.readingStatsRepository.getRecentReadsByUserId(userId, 3),
        this.uow.userReadChapterRepository.getReadProgressByUserId(userId),
      ]);

    const recentReadItems = reads.items.map((item) => {
      const readChapterCount =
        readProgressByNovel.get(item.novelId)?.readChapterCount ?? 0;
      const totalChapterCount = item.novel?.chapterCount ?? 0;
      const readingProgressPercent =
        totalChapterCount > 0
          ? Math.min(
              100,
              Math.round((readChapterCount / totalChapterCount) * 100),
            )
          : 0;

      return {
        ...item,
        readChapterCount,
        totalChapterCount,
        readingProgressPercent,
      };
    });

    return {
      recentNovels: {
        isAuthor: targetProfile.isAuthor,
        total: novels.total,
        items: novels.items,
      },
      recentReviews: {
        total: reviews.total,
        items: reviews.items,
      },
      recentReplies: {
        total: replies.total,
        items: replies.items,
      },
      recentReads: {
        total: reads.total,
        items: recentReadItems,
      },
    };
  };

  searchUsers = async (dto: GetUsersDto) => {
    return await this.uow.userRepository.searchUsers(dto);
  };

  getAllVerifications = async () => {
    return await this.uow.userVerificationRepository.getAll();
  };

  resendCode = async (email: string) => {
    const user = await this.uow.userRepository.findOneByEmail(email);

    if (!user) throw new NotFoundError("Kullanıcı bulunamadı.");

    if (user.isVerified) {
      throw new ConflictError("user", "Bu hesap zaten onaylanmış.");
    }

    const existingVerification =
      await this.uow.userVerificationRepository.findByEmail(email);

    if (this.isCodeResendOnCooldown(existingVerification?.lastSentAt)) {
      throw new BadRequestError(
        "Yeni kod istemeden once lutfen 60 saniye bekleyin.",
      );
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newExpiry = new Date(Date.now() + 5 * 60000);

    await this.uow.userVerificationRepository.refreshVerificationCode(
      user.id,
      newCode,
      newExpiry,
    );

    const mailResult = await this.mailService.sendVerificationCode(
      user.email,
      newCode,
    );

    if (!mailResult) {
      throw new BadRequestError(
        "Dogrulama kodu gonderilemedi. Lutfen daha sonra tekrar deneyin.",
      );
    }

    return { message: "Yeni doğrulama kodu e-posta adresinize gönderildi." };
  };

  login = async (dto: UserLoginDto) => {
    const user = await this.uow.userRepository.findForLogin(dto.email);
    if (!user) {
      throw new BadRequestError("E-posta adresi veya şifre hatalı.");
    }

    const passwordMatch = await argon2.verify(user.password, dto.password);
    if (!passwordMatch) {
      throw new BadRequestError("E-posta adresi veya şifre hatalı.");
    }

    if (!user.isVerified) {
      throw new ForbiddenError(
        "Hesap doğrulanmamış. Lütfen e-posta adresinizi doğrulayın.",
      );
    }

    const accessToken = this.tokenService.generateAccessToken(
      this.createAccessTokenPayload(user),
    );
    const refreshToken = this.tokenService.generateRefreshToken({
      id: user.id,
    });
    await this.uow.userRepository.updateRefreshToken(user.id, refreshToken!);

    const parsedUser = new UserLoginResponseDto(user);

    return { user: parsedUser, accessToken, refreshToken };
  };

  async updateUser(dto: UpdateUserDto): Promise<User> {
    const updated = await this.uow.userRepository.updateUser(dto);
    if (!updated) {
      throw new NotFoundError("Kullanıcı bulunamadı.");
    }
    return updated;
  }

  async getMe(dto: GetMeQuery): Promise<User> {
    const user = await this.uow.userRepository.getMe(dto);
    if (!user) {
      throw new NotFoundError("Kullanıcı bulunamadı.");
    }
    return user;
  }

  refreshToken = async (refreshToken: string) => {
    try {
      const payload: any = this.tokenService.verifyRefreshToken(refreshToken);

      if (!payload) {
        throw new UnauthenticatedError("REFRESH_TOKEN_INVALID");
      }
      const user = await this.uow.userRepository.findOneById(payload.id);

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthenticatedError("REFRESH_TOKEN_INVALID");
      }
      const newAccessToken = this.tokenService.generateAccessToken(
        this.createAccessTokenPayload(user),
      );
      const newRefreshToken = this.tokenService.generateRefreshToken({
        id: user.id,
      });
      await this.uow.userRepository.updateRefreshToken(
        user.id,
        newRefreshToken,
      );

      const parsedUser = new UserLoginResponseDto(user);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: parsedUser,
      };
    } catch (err) {
      throw new UnauthenticatedError("REFRESH_TOKEN_INVALID");
    }
  };

  forgotPassword = async (dto: ForgotPasswordDto) => {
    const user = await this.uow.userRepository.findOneByEmail(dto.email);

    if (!user) {
      return {
        message: PASSWORD_RESET_REQUEST_MESSAGE,
      };
    }

    const existingPasswordReset =
      await this.uow.passwordResetRepository.findByEmail(dto.email);

    if (this.isCodeResendOnCooldown(existingPasswordReset?.lastSentAt)) {
      return {
        message: PASSWORD_RESET_REQUEST_MESSAGE,
      };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await argon2.hash(code);
    const expiry = new Date(Date.now() + PASSWORD_RESET_CODE_EXPIRY_MS);

    await this.uow.passwordResetRepository.createOrReplace(
      user.id,
      codeHash,
      expiry,
    );

    const mailResult = await this.mailService.sendPasswordResetCode(
      user.email,
      code,
    );

    if (!mailResult) {
      await this.uow.passwordResetRepository.deleteByUserId(user.id);
      throw new BadRequestError(
        "Sifre sifirlama kodu gonderilemedi. Lutfen daha sonra tekrar deneyin.",
      );
    }

    return {
      message: PASSWORD_RESET_REQUEST_MESSAGE,
    };
  };

  resetPassword = async (dto: ResetPasswordDto) => {
    const passwordReset = await this.uow.passwordResetRepository.findByEmail(
      dto.email,
    );

    if (!passwordReset) {
      throw new BadRequestError(
        "E-posta adresi veya sifre sifirlama kodu hatali.",
      );
    }

    if (passwordReset.attempts >= PASSWORD_RESET_MAX_ATTEMPTS) {
      throw new ForbiddenError(
        "Cok fazla hatali deneme. Lutfen yeni bir sifre sifirlama kodu isteyin.",
      );
    }

    if (passwordReset.expiry < new Date()) {
      await this.uow.passwordResetRepository.deleteById(passwordReset.id);
      throw new BadRequestError("Sifre sifirlama kodunun suresi dolmus.");
    }

    const codeMatch = await argon2.verify(passwordReset.codeHash, dto.code);

    if (!codeMatch) {
      await this.uow.passwordResetRepository.incrementAttempts(
        passwordReset.id,
      );
      throw new BadRequestError(
        "E-posta adresi veya sifre sifirlama kodu hatali.",
      );
    }

    const hashedPassword = await argon2.hash(dto.newPassword);

    await this.uow.startTransaction();
    try {
      await this.uow.userRepository.updatePasswordAndClearRefreshToken(
        passwordReset.userId,
        hashedPassword,
      );
      await this.uow.passwordResetRepository.deleteById(passwordReset.id);
      await this.uow.commit();
    } catch (error) {
      await this.uow.rollback();
      throw error;
    } finally {
      await this.uow.release();
    }

    return { message: "Sifreniz basariyla sifirlandi." };
  };

  changePassword = async (userId: string, dto: ChangePasswordDto) => {
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestError("Yeni sifre mevcut sifre ile ayni olamaz.");
    }

    const user = await this.uow.userRepository.findWithPasswordById(userId);

    if (!user) {
      throw new NotFoundError("Kullanici bulunamadi.");
    }

    const passwordMatch = await argon2.verify(
      user.password,
      dto.currentPassword,
    );

    if (!passwordMatch) {
      throw new BadRequestError("Mevcut sifre hatali.");
    }

    const hashedPassword = await argon2.hash(dto.newPassword);

    await this.uow.userRepository.updatePasswordAndClearRefreshToken(
      user.id,
      hashedPassword,
    );

    return { message: "Sifreniz basariyla degistirildi." };
  };

  async getReadingStats(userId: string) {
    const stats = await this.uow.readingStatsRepository.getUserStats(userId);
    return stats;
  }

  async updateReadingStats(dto: UpdateReadingStatsDto) {
    await this.uow.startTransaction();
    try {
      await this.uow.readingStatsRepository.updateReadingStats(dto);

      if (this.isReadEnoughToMarkChapter(dto.incrementTime)) {
        await this.uow.userReadChapterRepository.markChapterAsRead({
          userId: dto.userId,
          novelId: dto.novelId,
          chapterId: dto.lastReadChapterId,
        });
      }

      await this.uow.commit();
    } catch (error) {
      await this.uow.rollback();
      throw error;
    }
  }

  async getUserNovelStats(userId: string, novelId: string) {
    const stats = await this.uow.readingStatsRepository.getUserNovelStats(
      userId,
      novelId,
    );
    return stats;
  }

  async getPersonalNotifications(dto: GetNotificationsDto) {
    return await this.uow.personalNotificationRepository.getUserNotifications(
      dto,
    );
  }

  async deletePersonalNotification(notificationId: string, userId: string) {
    const affectedRows =
      await this.uow.personalNotificationRepository.deleteNotification(
        notificationId,
        userId,
      );

    if (affectedRows === 0) {
      throw new NotFoundError("Bildirim bulunamadı veya silme yetkiniz yok.");
    }
  }

  async markPersonalNotificationAsRead(
    notificationId: string,
    userId: string,
  ) {
    const affectedRows =
      await this.uow.personalNotificationRepository.markAsRead(
        notificationId,
        userId,
      );

    if (affectedRows === 0) {
      throw new NotFoundError("Bildirim bulunamadi veya yetkiniz yok.");
    }
  }

  async markAllPersonalNotificationsAsRead(userId: string) {
    await this.uow.personalNotificationRepository.markAllAsRead(userId);
  }

  async getTotalUnreadNotificationCount(userId: string) {
    const personalUnreadCount =
      await this.uow.personalNotificationRepository.getUnreadCount(userId);
    const getLastNotificationSeenDate =
      await this.uow.userRepository.getLastGlobalNotificationSeenAt(userId);
    const globalUnreadCount =
      await this.uow.globalNotificationRepository.getTotalUnreadCount(
        getLastNotificationSeenDate || new Date(0),
      );
    return {
      personalUnreadCount,
      globalUnreadCount,
      totalUnreadCount: personalUnreadCount + globalUnreadCount,
    };
  }

  async getGlobalNotifications(dto: GetNotificationsDto) {
    const lastSeenDate =
      await this.uow.userRepository.getLastGlobalNotificationSeenAt(dto.userId);

    const notifications =
      await this.uow.globalNotificationRepository.getGlobalNotifications(
        dto,
        lastSeenDate || new Date(0),
      );

    await this.uow.userRepository.setLastGlobalNotificationSeenAt(
      dto.userId,
      new Date(),
    );

    return notifications;
  }

  async getGlobalNotificationById(notificationId: string, userId: string) {
    const lastSeenDate =
      await this.uow.userRepository.getLastGlobalNotificationSeenAt(userId);

    const notification =
      await this.uow.globalNotificationRepository.getGlobalNotificationById(
        notificationId,
        lastSeenDate || new Date(0),
      );

    if (!notification) {
      throw new NotFoundError("Duyuru bulunamadi.");
    }

    await this.uow.userRepository.setLastGlobalNotificationSeenAt(
      userId,
      new Date(),
    );

    return notification;
  }

  async setLastGlobalNotificationSeenAt(userId: string, date: Date) {
    await this.uow.userRepository.setLastGlobalNotificationSeenAt(userId, date);
  }

  async registerDevice(dto: RegisterUserDeviceDto) {
    return await this.uow.userDeviceRepository.upsertDevice(dto);
  }

  async unregisterDevice(dto: UnregisterUserDeviceDto) {
    await this.uow.userDeviceRepository.deactivateDevice(dto);
  }

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestError("Kullanici kendini takip edemez.");
    }

    const targetUser = await this.uow.userRepository.findOneById(followingId);
    if (!targetUser) {
      throw new NotFoundError("Takip edilecek kullanici bulunamadi.");
    }

    const created = await this.uow.userFollowRepository.follow(
      followerId,
      followingId,
    );

    if (created) {
      await this.notifyUserForFollow(followerId, followingId);
    }

    return { isFollowing: true, created };
  }

  async unfollowUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestError("Kullanici kendini takipten cikaramaz.");
    }

    const targetExists = await this.uow.userRepository.exsistById(followingId);
    if (!targetExists) {
      throw new NotFoundError("Kullanici bulunamadi.");
    }

    const removed = await this.uow.userFollowRepository.unfollow(
      followerId,
      followingId,
    );

    return { isFollowing: false, removed };
  }

  async getFollowStatus(followerId: string, followingId: string) {
    const targetExists = await this.uow.userRepository.exsistById(followingId);
    if (!targetExists) {
      throw new NotFoundError("Kullanici bulunamadi.");
    }

    const [isFollowing, counts] = await Promise.all([
      followerId === followingId
        ? Promise.resolve(false)
        : this.uow.userFollowRepository.isFollowing(followerId, followingId),
      this.uow.userFollowRepository.getFollowCounts(followingId),
    ]);

    return { isFollowing, ...counts };
  }

  async getFollowCounts(userId: string) {
    const targetExists = await this.uow.userRepository.exsistById(userId);
    if (!targetExists) {
      throw new NotFoundError("Kullanici bulunamadi.");
    }

    return await this.uow.userFollowRepository.getFollowCounts(userId);
  }

  async getFollowers(dto: GetUserFollowsDto) {
    const targetExists = await this.uow.userRepository.exsistById(dto.userId);
    if (!targetExists) {
      throw new NotFoundError("Kullanici bulunamadi.");
    }

    return await this.uow.userFollowRepository.getFollowers(dto);
  }

  async getFollowing(dto: GetUserFollowsDto) {
    const targetExists = await this.uow.userRepository.exsistById(dto.userId);
    if (!targetExists) {
      throw new NotFoundError("Kullanici bulunamadi.");
    }

    return await this.uow.userFollowRepository.getFollowing(dto);
  }

  private async notifyUserForFollow(followerId: string, followingId: string) {
    try {
      const actor = await this.uow.userRepository.findOneById(followerId);
      const actorName = actor?.nickname || "Bir kullanici";
      const titleSnapshot = `${actorName} seni takip etmeye basladi`;
      const bodySnapshot = "Yeni bir takipcin var.";

      await this.uow.personalNotificationRepository.createNotification({
        userId: followingId,
        actorUserId: followerId,
        type: PersonalNotificationType.FOLLOW,
        targetType: NotificationTargetType.USER,
        targetId: followerId,
        titleSnapshot,
        bodySnapshot,
        data: {
          followerId,
        },
      });

      await this.pushNotificationService.sendToUser(followingId, {
        title: titleSnapshot,
        body: bodySnapshot,
        data: {
          notificationType: "personal_notification",
          type: PersonalNotificationType.FOLLOW,
          targetType: NotificationTargetType.USER,
          targetId: followerId,
          followerId,
        },
      });
    } catch (error) {
      console.error("Takip bildirimi gonderilemedi:", error);
    }
  }

  private isCodeResendOnCooldown(lastSentAt?: Date | null) {
    if (!lastSentAt) return false;
    return Date.now() - lastSentAt.getTime() < CODE_RESEND_COOLDOWN_MS;
  }

  private isReadEnoughToMarkChapter(readDurationInSeconds: number) {
    return readDurationInSeconds > 30;
  }

  private createAccessTokenPayload(user: User) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isPremium: user.isPremium,
      premiumUntil: user.premiumUntil,
      subscriptionTier: user.subscriptionTier,
      subscriptionPeriod: user.subscriptionPeriod,
    };
  }
}
