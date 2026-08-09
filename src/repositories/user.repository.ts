import { ILike, Like, Repository } from "typeorm";
import { User } from "../entities/User.js";
import { UserDevice } from "../entities/UserDevice.js";
import {
  IUserRepository,
  PublicUserProfile,
} from "../interfaces/user.repo.interface.js";
import { CreateUserDto } from "../dtos/create.user.dto.js";
import { GetUsersDto } from "../schemas/get.users.schema.js";
import { VerifyUserDto } from "../schemas/verify.user.schema.js";
import { UserVerification } from "../entities/UserVerification.js";
import { UpdateUserDto } from "../schemas/update.user.schema.js";
import { GetMeQuery } from "../schemas/get.me.schema.js";
import { createDeletedUserIdentity } from "../utils/deleted.user.presenter.js";
import { DeletedAccountRecovery } from "../entities/DeletedAccountRecovery.js";
import { createAccountRecoveryHash } from "../utils/account.recovery.hash.js";
import { applyBlockedUserVisibilityFilter } from "../utils/user.block.visibility.js";

const DELETED_ACCOUNT_RECOVERY_DAYS = 30;

export class UserRepository implements IUserRepository {
  constructor(private userRepo: Repository<User>) {}

  findOneByUsername(username: string) {
    return this.userRepo.findOneBy({ username });
  }

  async findOneByEmail(email: string) {
    const a = await this.userRepo.findOneBy({ email });
    return a;
  }

  async create(userDto: CreateUserDto, code: string, expiry: Date) {
    return await this.userRepo.manager.transaction(async (manager) => {
      const user = manager.create(User, userDto);
      const savedUser = await manager.save(User, user);

      const verification = manager.create(UserVerification, {
        code,
        expiry,
        lastSentAt: new Date(),
        user: savedUser,
      });
      await manager.save(UserVerification, verification);

      return savedUser;
    });
  }

  async activateUser(user: User, verification: UserVerification) {
    return await this.userRepo.manager.transaction(async (manager) => {
      user.isVerified = true;
      const updatedUser = await manager.save(User, user);
      await manager.remove(UserVerification, verification);
      return updatedUser;
    });
  }

  findByVerificationCodeandEmail(dto: VerifyUserDto) {
    return this.userRepo.findOne({
      where: { email: dto.email },
    });
  }

  exsistById(id: string): Promise<boolean> {
    return this.userRepo.exists({ where: { id } });
  }

  findOneById(id: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id },
      select: {
        id: true,
        username: true,
        nickname: true,
        email: true,
        profileImageUrl: true,
        profileBackgroundImageUrl: true,
        description: true,
        gender: true,
        usernameChangedAt: true,
        showAdultContent: true,
        adultContentConfirmedAt: true,
        termsAndPrivacyAcceptedAt: true,
        role: true,
        authProvider: true,
        status: true,
        isVerified: true,
        premiumUntil: true,
        subscriptionTier: true,
        subscriptionPeriod: true,
        refreshToken: true,
        lastGlobalNotificationSeenAt: true,
      },
      relations: {
        verification: true,
      },
    });
  }

  async findPublicProfileById(
    id: string,
  ): Promise<PublicUserProfile | null> {
    const user = await this.userRepo.findOne({
      where: { id },
      select: {
        id: true,
        username: true,
        nickname: true,
        profileImageUrl: true,
        profileBackgroundImageUrl: true,
        description: true,
        gender: true,
        role: true,
        authorProfile: {
          id: true,
          isVerified: true,
        },
      },
      relations: {
        authorProfile: true,
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      profileImageUrl: user.profileImageUrl,
      profileBackgroundImageUrl: user.profileBackgroundImageUrl,
      biography: user.description,
      gender: user.gender,
      role: user.role,
      authorId: user.authorProfile?.id ?? null,
      isAuthor: Boolean(user.authorProfile),
      authorIsVerified: user.authorProfile?.isVerified ?? false,
    };
  }

  async searchUsers(dto: GetUsersDto, viewerId?: string) {
    const { search, page, limit, role, status } = dto;

    const isSearchSentButEmpty = search !== undefined && search.trim() === "";
    const hasNoOtherFilters = !role && !status;

    if (isSearchSentButEmpty && hasNoOtherFilters) {
      return {
        items: [],
        total: 0,
        nextPage: null,
        currentPage: page,
        lastPage: 0,
      };
    }
    const query = this.userRepo
      .createQueryBuilder("user")
      .select([
        "user.id",
        "user.username",
        "user.nickname",
        "user.profileImageUrl",
        "user.email",
      ])
      .orderBy("user.createdAt", "ASC")
      .take(limit)
      .skip((page - 1) * limit);

    if (search) query.andWhere("user.nickname ILIKE :search", { search: `%${search}%` });
    if (role) query.andWhere("user.role = :role", { role });
    if (status) query.andWhere("user.status = :status", { status });
    applyBlockedUserVisibilityFilter(query, viewerId, "user");

    const [result, total] = await query.getManyAndCount();
    const totalPage = Math.ceil(total / limit);
    const nextPage = page < totalPage ? page + 1 : null;
    return {
      items: result,
      total: total,
      nextPage: nextPage,
      currentPage: page,
      lastPage: totalPage,
    };
  }

  async findForLogin(email: string) {
    return await this.userRepo.findOne({
      where: { email },
      select: {
        id: true,
        username: true,
        nickname: true,
        email: true,
        profileImageUrl: true,
        profileBackgroundImageUrl: true,
        usernameChangedAt: true,
        role: true,
        authProvider: true,
        status: true,
        showAdultContent: true,
        adultContentConfirmedAt: true,
        termsAndPrivacyAcceptedAt: true,
        password: true,
        googleId: true,
        refreshToken: true,
        isVerified: true,
        premiumUntil: true,
        subscriptionTier: true,
        subscriptionPeriod: true,
      },
    });
  }

  async findWithPasswordById(id: string) {
    return await this.userRepo.findOne({
      where: { id },
      select: {
        id: true,
        email: true,
        profileImageUrl: true,
        profileBackgroundImageUrl: true,
        password: true,
        refreshToken: true,
      },
    });
  }

  async updateUser(dto: UpdateUserDto) {
    const updatedUser = await this.userRepo.save(dto);
    return this.getUserForTokenRefresh(updatedUser.id);
  }

  async updateUsername(
    userId: string,
    username: string,
    usernameChangedAt: Date,
  ) {
    await this.userRepo.update({ id: userId }, { username, usernameChangedAt });
    return this.getUserForTokenRefresh(userId);
  }

  async updateContentPreferences(
    userId: string,
    showAdultContent: boolean,
  ) {
    await this.userRepo.update({ id: userId }, { showAdultContent });
    return this.getUserForTokenRefresh(userId);
  }

  async confirmAdultContent(userId: string, confirmedAt: Date) {
    await this.userRepo.update(
      { id: userId },
      { adultContentConfirmedAt: confirmedAt },
    );
    return this.getUserForTokenRefresh(userId);
  }

  async acceptTermsAndPrivacy(userId: string, acceptedAt: Date) {
    await this.userRepo.update(
      { id: userId },
      { termsAndPrivacyAcceptedAt: acceptedAt },
    );
    return this.getUserForTokenRefresh(userId);
  }

  async getMe(dto: GetMeQuery) {
    const dbFields = dto.fields?.filter((field) => field !== "isPremium");
    if (dto.fields?.includes("isPremium") && !dbFields?.includes("premiumUntil")) {
      dbFields?.push("premiumUntil");
    }

    const selectFields = dbFields?.length
      ? dbFields.reduce((acc, f) => ({ ...acc, [f]: true }), { id: true })
      : { id: true, username: true, email: true };

    const user = await this.userRepo.findOne({
      where: { id: dto.userId },
      select: selectFields,
    });
    if (!user) {
      throw new Error("Kullanıcı bulunamadı.");
    }
    return user;
  }

  updateRefreshToken = async (userId: string, refreshToken: string) => {
    await this.userRepo.update({ id: userId }, { refreshToken });
  };

  async updatePasswordAndClearRefreshToken(userId: string, password: string) {
    await this.userRepo.update({ id: userId }, { password, refreshToken: null });
  }

  async updatePasswordAndRefreshToken(
    userId: string,
    password: string,
    refreshToken: string,
  ) {
    await this.userRepo.update({ id: userId }, { password, refreshToken });
  }

  async clearRefreshToken(userId: string) {
    await this.userRepo.update({ id: userId }, { refreshToken: null });
  }

  async getUserForTokenRefresh(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        nickname: true,
        email: true,
        profileImageUrl: true,
        role: true,
        authProvider: true,
        usernameChangedAt: true,
        showAdultContent: true,
        adultContentConfirmedAt: true,
        termsAndPrivacyAcceptedAt: true,
        premiumUntil: true,
        subscriptionTier: true,
        subscriptionPeriod: true,
      },
    });
    if (!user) {
      return null;
    }
    return user;
  }

  async softDeleteUser(id: string) {
    await this.userRepo.manager.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id },
        select: {
          id: true,
          email: true,
          username: true,
        },
      });

      if (user) {
        const deletedAt = new Date();
        const expiresAt = new Date(deletedAt);
        expiresAt.setDate(expiresAt.getDate() + DELETED_ACCOUNT_RECOVERY_DAYS);

        await manager.save(
          DeletedAccountRecovery,
          manager.create(DeletedAccountRecovery, {
            userId: user.id,
            emailHash: createAccountRecoveryHash(user.email),
            usernameHash: createAccountRecoveryHash(user.username),
            deletedAt,
            expiresAt,
          }),
        );
      }

      await manager.update(User, { id }, createDeletedUserIdentity());
      await manager.update(UserDevice, { userId: id }, { isActive: false });
      await manager.softDelete(User, { id });
    });
  }

  async getLastGlobalNotificationSeenAt(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: { lastGlobalNotificationSeenAt: true },
    });
    return user ? user.lastGlobalNotificationSeenAt : null;
  }

  async setLastGlobalNotificationSeenAt(userId: string, date: Date) {
    await this.userRepo.update(
      { id: userId },
      { lastGlobalNotificationSeenAt: date },
    );
  }
}
