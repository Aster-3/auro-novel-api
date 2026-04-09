import { FindAndCountType } from "../constants/findAndCountType.js";
import { CreateUserDto } from "../dtos/create.user.dto.js";
import { UserLoginResponseDto } from "../dtos/login.dto.js";
import { User } from "../entities/User.js";
import { UserVerification } from "../entities/UserVerification.js";
import { GetMeQuery } from "../schemas/get.me.schema.js";
import { GetUsersDto } from "../schemas/get.users.schema.js";
import { UpdateUserDto } from "../schemas/update.user.schema.js";
import { UserLoginDto } from "../schemas/user.login.shema.js";
import { VerifyUserDto } from "../schemas/verify.user.schema.js";

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
}
