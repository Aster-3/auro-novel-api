import { IUserRepository } from "../interfaces/user.repo.interface.js";
import { CreateUserDto } from "../dtos/create.user.dto.js";
import { IUserService } from "../interfaces/user.service.interface.js";
import { ConflictError } from "../errors/conflict.error.js";
import { NotFoundError } from "../errors/not.found.error.js";
import { GetUsersDto } from "../schemas/get.users.schema.js";
import * as argon2 from "argon2";
import { randomBytes } from "crypto";
import { VerifyUserDto } from "../schemas/verify.user.schema.js";
import { ForbiddenError } from "../errors/forbidden.error.js";
import { BadRequestError } from "../errors/bad.request.js";
import { MailService } from "./mail.service.js";
import { UserLoginDto } from "../schemas/user.login.shema.js";
import { TokenService } from "./token.service.js";
import { User } from "../entities/User.js";
import { UpdateContentPreferencesDto } from "../schemas/update.content.preferences.schema.js";
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
import { UpdateUsernameDto } from "../schemas/update.username.schema.js";
import { DeleteMyAccountDto } from "../schemas/delete.my.account.schema.js";
import { isPremiumActive, withPremiumStatus } from "../utils/premium.status.js";
import { UserAuthProvider, UserStatus } from "../constants/user.constants.js";
import { GoogleLoginDto } from "../schemas/google.login.schema.js";
import { getEnv } from "../utils/getEnv.js";
import { LibrarySortOption } from "../constants/series.constants.js";
import { AppDataSource } from "../database/data-source.js";
import { UserVerification } from "../entities/UserVerification.js";
import { AdultContentConfirmationRequiredError } from "../errors/adult.content.confirmation.required.error.js";
import { deleteManyFromS3ByUrl } from "./s3.service.js";

const PASSWORD_RESET_CODE_EXPIRY_MS = 10 * 60000;
const PASSWORD_RESET_MAX_ATTEMPTS = 5;
const CODE_RESEND_COOLDOWN_MS = 60 * 1000;
const USERNAME_CHANGE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const PASSWORD_RESET_REQUEST_MESSAGE =
  "Eger bu e-posta ile kayitli bir hesap varsa sifre sifirlama kodu gonderildi.";

type GoogleTokenInfo = {
  sub?: string;
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
};

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

      return { user: withPremiumStatus(user), verificationEmailSent };
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
    await deleteManyFromS3ByUrl([
      user.profileImageUrl,
      user.profileBackgroundImageUrl,
    ]);

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
    const activatedUser = await this.uow.userRepository.activateUser(
      user,
      verification,
    );
    return withPremiumStatus(activatedUser);
  };

  getOneUser = async (id: string) => {
    const user = await this.uow.userRepository.findOneById(id);
    if (!user) throw new NotFoundError("Kullanıcı bulunamadı.");
    return user;
  };

  getUserProfile = async (id: string, viewerId?: string) => {
    await this.ensureUsersVisible(viewerId, id);
    const user = await this.uow.userRepository.findPublicProfileById(id);
    if (!user) throw new NotFoundError("Kullanici bulunamadi.");
    return user;
  };

  getUserReviews = async (dto: GetUserShowcaseDto, viewerId?: string) => {
    await this.ensureUsersVisible(viewerId, dto.userId);
    const targetExists = await this.uow.userRepository.exsistById(dto.userId);
    if (!targetExists) {
      throw new NotFoundError("Kullanici bulunamadi.");
    }

    return await this.uow.commentRepository.getReviewsByUserId(dto, viewerId);
  };

  getUserReplies = async (dto: GetUserShowcaseDto, viewerId?: string) => {
    await this.ensureUsersVisible(viewerId, dto.userId);
    const targetExists = await this.uow.userRepository.exsistById(dto.userId);
    if (!targetExists) {
      throw new NotFoundError("Kullanici bulunamadi.");
    }

    return await this.uow.replyRepository.getRepliesByUserId(dto, viewerId);
  };

  getUserLibrary = async (
    dto: GetUserLibraryShowcaseDto,
    allowAdultContent = false,
    viewerId?: string,
  ) => {
    await this.ensureUsersVisible(viewerId, dto.userId);
    const targetExists = await this.uow.userRepository.exsistById(dto.userId);
    if (!targetExists) {
      throw new NotFoundError("Kullanici bulunamadi.");
    }

    return await this.uow.libraryRepository.getPublicUserLibrary(
      dto,
      allowAdultContent,
      viewerId,
    );
  };

  getUserRecentActivity = async (
    userId: string,
    viewerId?: string,
    allowAdultContent = false,
  ) => {
    await this.ensureUsersVisible(viewerId, userId);
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
            allowAdultContent,
            viewerId,
          )
        : Promise.resolve({ items: [], total: 0 });

    const [novels, reviews, replies, reads] = await Promise.all([
        recentNovelsPromise,
        this.uow.commentRepository.getReviewsByUserId(
          { id: userId, userId, page: 1, limit: 3 },
          viewerId,
        ),
        this.uow.replyRepository.getRepliesByUserId(
          { id: userId, userId, page: 1, limit: 3 },
          viewerId,
        ),
        this.uow.libraryRepository.getPublicUserLibrary(
          {
            id: userId,
            userId,
            page: 1,
            limit: 3,
            sortBy: LibrarySortOption.LAST_READED,
          },
          allowAdultContent,
          viewerId,
        ),
      ]);

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
      libraryNovels: {
        total: reads.total,
        items: reads.items,
      },
    };
  };

  searchUsers = async (dto: GetUsersDto, viewerId?: string) => {
    return await this.uow.userRepository.searchUsers(dto, viewerId);
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

    this.ensureUserCanAuthenticate(user);

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

  googleLogin = async (dto: GoogleLoginDto) => {
    const googleUser = await this.verifyGoogleIdToken(dto.idToken);
    const userRepo = AppDataSource.getRepository(User);

    let user = await userRepo.findOne({
      where: { googleId: googleUser.sub },
    });

    if (!user) {
      user = await userRepo.findOne({
        where: { email: googleUser.email },
      });
    }

    if (user) {
      this.ensureUserCanAuthenticate(user);

      if (!user.googleId || user.authProvider !== UserAuthProvider.MIXED) {
        await AppDataSource.transaction(async (manager) => {
          await manager.update(
            User,
            { id: user!.id },
            {
              googleId: googleUser.sub,
              authProvider:
                user!.authProvider === UserAuthProvider.LOCAL
                  ? UserAuthProvider.MIXED
                  : user!.authProvider,
              isVerified: true,
              profileImageUrl: user!.profileImageUrl ?? googleUser.picture,
            },
          );
          await manager.delete(UserVerification, { userId: user!.id });
        });

        user = await userRepo.findOneOrFail({ where: { id: user.id } });
      }

      return this.createLoginResponse(user);
    }

    user = await this.createGoogleUser(googleUser);
    return this.createLoginResponse(user);
  };

  async updateUser(dto: UpdateUserDto): Promise<User> {
    const currentUser = await this.uow.userRepository.findOneById(dto.id);
    if (!currentUser) {
      throw new NotFoundError("KullanÄ±cÄ± bulunamadÄ±.");
    }

    const updated = await this.uow.userRepository.updateUser(dto);
    if (!updated) {
      throw new NotFoundError("Kullanıcı bulunamadı.");
    }
    await deleteManyFromS3ByUrl([
      dto.profileImageUrl && dto.profileImageUrl !== currentUser.profileImageUrl
        ? currentUser.profileImageUrl
        : null,
      dto.profileBackgroundImageUrl &&
      dto.profileBackgroundImageUrl !== currentUser.profileBackgroundImageUrl
        ? currentUser.profileBackgroundImageUrl
        : null,
    ]);

    return withPremiumStatus(updated);
  }

  async updateUsername(
    userId: string,
    dto: UpdateUsernameDto,
  ): Promise<User> {
    const user = await this.uow.userRepository.findOneById(userId);
    if (!user) {
      throw new NotFoundError("Kullanıcı bulunamadı.");
    }

    if (user.username === dto.username) {
      throw new BadRequestError("Yeni kullanıcı adı mevcut kullanıcı adı ile aynı olamaz.");
    }

    if (user.usernameChangedAt) {
      const nextChangeAt = new Date(
        user.usernameChangedAt.getTime() + USERNAME_CHANGE_COOLDOWN_MS,
      );
      const remainingMs = nextChangeAt.getTime() - Date.now();

      if (remainingMs > 0) {
        throw new BadRequestError(
          `Kullanıcı adı haftada sadece bir kez değiştirilebilir. Kalan süre: ${this.formatRemainingCooldown(remainingMs)}`,
        );
      }
    }

    const usernameAvailable =
      await this.uow.userRepository.findOneByUsername(dto.username);
    if (usernameAvailable) {
      throw new ConflictError("username", "Kullanıcı adı zaten alınmış.");
    }

    const updated = await this.uow.userRepository.updateUsername(
      userId,
      dto.username,
      new Date(),
    );
    if (!updated) {
      throw new NotFoundError("Kullanıcı bulunamadı.");
    }

    return withPremiumStatus(updated);
  }

  async updateContentPreferences(
    userId: string,
    dto: UpdateContentPreferencesDto,
  ) {
    const user = await this.uow.userRepository.findOneById(userId);
    if (!user) {
      throw new NotFoundError("Kullanici bulunamadi.");
    }

    if (dto.showAdultContent && !user.adultContentConfirmedAt) {
      throw new AdultContentConfirmationRequiredError();
    }

    const updated = await this.uow.userRepository.updateContentPreferences(
      userId,
      dto.showAdultContent,
    );
    if (!updated) {
      throw new NotFoundError("Kullanici bulunamadi.");
    }

    return {
      item: {
        showAdultContent: updated.showAdultContent,
        adultContentConfirmedAt: updated.adultContentConfirmedAt,
      },
      accessToken: this.tokenService.generateAccessToken(
        this.createAccessTokenPayload(updated),
      ),
    };
  }

  async confirmAdultContent(userId: string) {
    const updated = await this.uow.userRepository.confirmAdultContent(
      userId,
      new Date(),
    );
    if (!updated) {
      throw new NotFoundError("Kullanici bulunamadi.");
    }

    return {
      item: {
        showAdultContent: updated.showAdultContent,
        adultContentConfirmedAt: updated.adultContentConfirmedAt,
      },
      accessToken: this.tokenService.generateAccessToken(
        this.createAccessTokenPayload(updated),
      ),
    };
  }

  async acceptTermsAndPrivacy(userId: string) {
    const updated = await this.uow.userRepository.acceptTermsAndPrivacy(
      userId,
      new Date(),
    );
    if (!updated) {
      throw new NotFoundError("Kullanici bulunamadi.");
    }

    return {
      item: {
        termsAndPrivacyAcceptedAt: updated.termsAndPrivacyAcceptedAt,
      },
      accessToken: this.tokenService.generateAccessToken(
        this.createAccessTokenPayload(updated),
      ),
    };
  }

  async getMe(dto: GetMeQuery): Promise<User> {
    const user = await this.uow.userRepository.getMe(dto);
    if (!user) {
      throw new NotFoundError("Kullanıcı bulunamadı.");
    }
    return dto.fields.includes("isPremium") ? withPremiumStatus(user) : user;
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
      this.ensureUserCanAuthenticate(user);
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
    if (dto.newPassword !== dto.newPasswordConfirm) {
      throw new BadRequestError("Yeni sifreler eslesmiyor.");
    }

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
    const accessToken = this.tokenService.generateAccessToken(
      this.createAccessTokenPayload(user),
    );
    const refreshToken = this.tokenService.generateRefreshToken({
      id: user.id,
    });

    await this.uow.userRepository.updatePasswordAndRefreshToken(
      user.id,
      hashedPassword,
      refreshToken,
    );

    return {
      message: "Sifreniz basariyla degistirildi.",
      user: new UserLoginResponseDto(user),
      accessToken,
      refreshToken,
    };
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

    await this.ensureUsersVisible(followerId, followingId);

    const created = await this.uow.userFollowRepository.follow(
      followerId,
      followingId,
    );

    if (created) {
      await this.notifyUserForFollow(followerId, followingId);
    }

    return { isFollowing: true, created };
  }

  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new BadRequestError("Kullanici kendini engelleyemez.");
    }

    const targetExists = await this.uow.userRepository.exsistById(blockedId);
    if (!targetExists) {
      throw new NotFoundError("Engellenecek kullanici bulunamadi.");
    }

    await this.uow.startTransaction();

    try {
      const created = await this.uow.userBlockRepository.block(
        blockerId,
        blockedId,
      );
      await this.uow.userFollowRepository.removeBetween(blockerId, blockedId);
      await this.uow.commit();
      return { isBlocked: true, created };
    } catch (error) {
      await this.uow.rollback();
      throw error;
    } finally {
      await this.uow.release();
    }
  }

  async unblockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new BadRequestError("Kullanici kendi engelini kaldiramaz.");
    }

    const targetExists = await this.uow.userRepository.exsistById(blockedId);
    if (!targetExists) {
      throw new NotFoundError("Kullanici bulunamadi.");
    }

    const removed = await this.uow.userBlockRepository.unblock(
      blockerId,
      blockedId,
    );

    return { isBlocked: false, removed };
  }

  async getBlockStatus(blockerId: string, blockedId: string) {
    const targetExists = await this.uow.userRepository.exsistById(blockedId);
    if (!targetExists) {
      throw new NotFoundError("Kullanici bulunamadi.");
    }

    if (blockerId === blockedId) {
      return {
        isBlocked: false,
        isBlockedBy: false,
        hasBlockBetween: false,
      };
    }

    const [isBlocked, isBlockedBy] = await Promise.all([
      this.uow.userBlockRepository.exists(blockerId, blockedId),
      this.uow.userBlockRepository.exists(blockedId, blockerId),
    ]);

    return {
      isBlocked,
      isBlockedBy,
      hasBlockBetween: isBlocked || isBlockedBy,
    };
  }

  async getBlockedUsers(dto: {
    userId: string;
    page: number;
    limit: number;
  }) {
    return await this.uow.userBlockRepository.getBlockedUsers(dto);
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
        : this.uow.userBlockRepository
            .existsBetween(followerId, followingId)
            .then((blocked) =>
              blocked
                ? false
                : this.uow.userFollowRepository.isFollowing(
                    followerId,
                    followingId,
                  ),
            ),
      this.uow.userFollowRepository.getFollowCounts(followingId, followerId),
    ]);

    const blockStatus =
      followerId === followingId
        ? { isBlocked: false, isBlockedBy: false, hasBlockBetween: false }
        : await this.getBlockStatus(followerId, followingId);

    return { isFollowing, ...blockStatus, ...counts };
  }

  async getFollowCounts(userId: string, viewerId?: string) {
    const targetExists = await this.uow.userRepository.exsistById(userId);
    if (!targetExists) {
      throw new NotFoundError("Kullanici bulunamadi.");
    }

    await this.ensureUsersVisible(viewerId, userId);

    return await this.uow.userFollowRepository.getFollowCounts(userId, viewerId);
  }

  async getFollowers(dto: GetUserFollowsDto) {
    await this.ensureUsersVisible(dto.viewerId, dto.userId);
    const targetExists = await this.uow.userRepository.exsistById(dto.userId);
    if (!targetExists) {
      throw new NotFoundError("Kullanici bulunamadi.");
    }

    return await this.uow.userFollowRepository.getFollowers(dto);
  }

  async getFollowing(dto: GetUserFollowsDto) {
    await this.ensureUsersVisible(dto.viewerId, dto.userId);
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
      const pushBody = "Yeni bir takipcin var.";

      await this.uow.personalNotificationRepository.createNotification({
        userId: followingId,
        actorUserId: followerId,
        type: PersonalNotificationType.FOLLOW,
        targetType: NotificationTargetType.USER,
        targetId: followerId,
        titleSnapshot,
        data: {
          followerId,
        },
      });

      await this.pushNotificationService.sendToUser(followingId, {
        title: titleSnapshot,
        body: pushBody,
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

  private formatRemainingCooldown(remainingMs: number) {
    const totalMinutes = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;

    return `${days} Gün ${hours} Saat ${minutes} Dakika`;
  }

  private async ensureUsersVisible(viewerId: string | undefined, targetUserId: string) {
    if (!viewerId || viewerId === targetUserId) {
      return;
    }

    const hasBlockBetween = await this.uow.userBlockRepository.existsBetween(
      viewerId,
      targetUserId,
    );

    if (hasBlockBetween) {
      throw new NotFoundError("Kullanici bulunamadi.");
    }
  }

  private isReadEnoughToMarkChapter(readDurationInSeconds: number) {
    return readDurationInSeconds >= 15;
  }

  private ensureUserCanAuthenticate(user: User) {
    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenError("Hesap banlanmis.");
    }

    if (user.status === UserStatus.DELETED) {
      throw new ForbiddenError("Hesap silinmis.");
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenError("Hesap aktif degil.");
    }
  }

  private async createLoginResponse(user: User) {
    const accessToken = this.tokenService.generateAccessToken(
      this.createAccessTokenPayload(user),
    );
    const refreshToken = this.tokenService.generateRefreshToken({
      id: user.id,
    });

    await this.uow.userRepository.updateRefreshToken(user.id, refreshToken!);

    return {
      user: new UserLoginResponseDto(user),
      accessToken,
      refreshToken,
    };
  }

  private async verifyGoogleIdToken(idToken: string) {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
        idToken,
      )}`,
    );

    if (!response.ok) {
      throw new UnauthenticatedError("GOOGLE_TOKEN_INVALID");
    }

    const payload = (await response.json()) as GoogleTokenInfo;
    const allowedAudiences = [
      getEnv("GOOGLE_WEB_CLIENT_ID"),
      getEnv("GOOGLE_ANDROID_CLIENT_ID"),
    ];

    if (!payload.sub || !payload.email || !allowedAudiences.includes(payload.aud ?? "")) {
      throw new UnauthenticatedError("GOOGLE_TOKEN_INVALID");
    }

    if (payload.email_verified !== true && payload.email_verified !== "true") {
      throw new ForbiddenError("Google email dogrulanmamis.");
    }

    return {
      sub: payload.sub,
      email: payload.email.toLowerCase(),
      name: payload.name?.trim() || payload.email.split("@")[0],
      picture: payload.picture ?? null,
    };
  }

  private async createGoogleUser(googleUser: {
    sub: string;
    email: string;
    name: string;
    picture: string | null;
  }) {
    const password = await argon2.hash(randomBytes(32).toString("hex"));
    const username = await this.createRandomUsername();
    const nickname = googleUser.name.slice(0, 20) || username;

    return AppDataSource.getRepository(User).save(
      AppDataSource.getRepository(User).create({
        username,
        nickname,
        email: googleUser.email,
        password,
        googleId: googleUser.sub,
        authProvider: UserAuthProvider.GOOGLE,
        status: UserStatus.ACTIVE,
        isVerified: true,
        profileImageUrl: googleUser.picture,
      }),
    );
  }

  private async createRandomUsername() {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const username = `u_${randomBytes(6).toString("hex")}`;
      const exists = await this.uow.userRepository.findOneByUsername(username);
      if (!exists) return username;
    }

    throw new ConflictError("username", "Kullanici adi olusturulamadi.");
  }

  private createAccessTokenPayload(user: User) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      authProvider: user.authProvider,
      showAdultContent: user.showAdultContent,
      isPremium: isPremiumActive(user.premiumUntil),
      premiumUntil: user.premiumUntil,
      subscriptionTier: user.subscriptionTier,
      subscriptionPeriod: user.subscriptionPeriod,
    };
  }
}
