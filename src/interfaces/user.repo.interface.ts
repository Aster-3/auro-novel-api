import { User } from "../entities/User.js";
import { CreateUserDto } from "../dtos/create.user.dto.js";
import { FindAndCountType } from "../constants/findAndCountType.js";
import { GetUsersDto } from "../schemas/get.users.schema.js";
import { VerifyUserDto } from "../schemas/verify.user.schema.js";
import { UserVerification } from "../entities/_index.js";
import { UserLoginDto } from "../schemas/user.login.shema.js";
import { UpdateUserDto } from "../schemas/update.user.schema.js";
import { GetMeQuery } from "../schemas/get.me.schema.js";

export type PublicUserProfile = Pick<
  User,
  | "id"
  | "username"
  | "nickname"
  | "profileImageUrl"
  | "profileBackgroundImageUrl"
  | "gender"
  | "role"
> & {
  biography?: string | null;
  authorId: string | null;
  isAuthor: boolean;
  authorIsVerified: boolean;
};

export interface IUserRepository {
  findOneByEmail(email: string): Promise<User | null>;
  findOneByUsername(username: string): Promise<User | null>;
  findOneById(id: string): Promise<User | null>;
  findPublicProfileById(id: string): Promise<PublicUserProfile | null>;
  deleteUser(id: string): Promise<void>;
  softDeleteUser(id: string): Promise<void>;
  activateUser(user: User, verification: UserVerification): Promise<User>;
  create(user: CreateUserDto, code: string, expiry: Date): Promise<User>;
  searchUsers(dto: GetUsersDto): Promise<FindAndCountType<User>>;
  exsistById(id: string): Promise<boolean>;
  findByVerificationCodeandEmail(dto: VerifyUserDto): Promise<User | null>;
  findForLogin(email: string): Promise<User | null>;
  findWithPasswordById(id: string): Promise<User | null>;
  updateUser(dto: UpdateUserDto): Promise<User | null>;
  getMe(dto: GetMeQuery): Promise<User | null>;
  updateRefreshToken(userId: string, refreshToken: string): Promise<void>;
  updatePasswordAndClearRefreshToken(
    userId: string,
    password: string,
  ): Promise<void>;
  clearRefreshToken(userId: string): Promise<void>;
  getUserForTokenRefresh(userId: string): Promise<User | null>;
  getLastGlobalNotificationSeenAt(userId: string): Promise<Date | null>;
  setLastGlobalNotificationSeenAt(userId: string, date: Date): Promise<void>;
}
