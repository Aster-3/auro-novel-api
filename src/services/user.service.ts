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
import { CreateNotificationDto } from "../interfaces/personal.notification.repo.interface.js";
import { GetNotificationsDto } from "../schemas/get.notifications.schema.js";

export class UserService implements IUserService {
  constructor(
    private uow: IUnitOfWork,
    private mailService: MailService,
    private tokenService: TokenService,
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

      await this.uow.readerWalletRepository.create(user.id, {
        sun: 0,
        moon: 65,
      });
      await this.uow.commit();
      try {
        await this.mailService.sendVerificationCode(user.email, code);
      } catch (err) {
        console.error("Doğrulama kodu gönderilirken hata oluştu:", err);
      }

      return user;
    } catch (error) {
      await this.uow.rollback();
      throw error;
    } finally {
      await this.uow.release();
    }
  };

  deleteUser(id: string): Promise<void> {
    return this.uow.userRepository.deleteUser(id);
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

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newExpiry = new Date(Date.now() + 5 * 60000);

    await this.uow.userVerificationRepository.refreshVerificationCode(
      user.id,
      newCode,
      newExpiry,
    );

    await this.mailService.sendVerificationCode(user.email, newCode);

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

    const accessToken = this.tokenService.generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
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
      const newAccessToken = this.tokenService.generateAccessToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      const parsedUser = new UserLoginResponseDto(user);

      return { accessToken: newAccessToken, user: parsedUser };
    } catch (err) {
      throw new UnauthenticatedError("REFRESH_TOKEN_INVALID");
    }
  };

  async getUserBalance(
    userId: string,
  ): Promise<{ moonCoins: number; sunCoins: number }> {
    const balance = await this.uow.readerWalletRepository.getBalance(userId);
    return {
      moonCoins: balance.moonCoins,
      sunCoins: balance.sunCoins,
    };
  }
  async getReadingStats(userId: string) {
    const stats = await this.uow.readingStatsRepository.getUserStats(userId);
    return stats;
  }

  async updateReadingStats(dto: UpdateReadingStatsDto) {
    await this.uow.readingStatsRepository.updateReadingStats(dto);
  }

  async getUserNovelStats(userId: string, novelId: string) {
    const stats = await this.uow.readingStatsRepository.getUserNovelStats(
      userId,
      novelId,
    );
    return stats;
  }

  async createPersonalNotification(dto: CreateNotificationDto) {
    await this.uow.personalNotificationRepository.createNotification(dto);
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

  async markPersonalNotificationAsRead(notificationId: string) {
    await this.uow.personalNotificationRepository.markAsRead(notificationId);
  }

  async markAllPersonalNotificationsAsRead(userId: string) {
    await this.uow.personalNotificationRepository.markAllAsRead(userId);
  }

  async getTotalUnreadNotificationCount(userId: string) {
    const personalUnreadCount =
      await this.uow.personalNotificationRepository.getUnreadCount(userId);
    const getLastNotificationSeenDate =
      await this.uow.userRepository.getLastSeenNotificationDate(userId);
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
      await this.uow.userRepository.getLastSeenNotificationDate(dto.userId);

    return await this.uow.globalNotificationRepository.getGlobalNotifications(
      dto,
      lastSeenDate || new Date(0),
    );
  }

  async setLastSeenNotificationDate(userId: string, date: Date) {
    await this.uow.userRepository.setLastSeenNotificationDate(userId, date);
  }
}
