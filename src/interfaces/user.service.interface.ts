import { FindAndCountType } from "../constants/findAndCountType.js";
import { CreateUserDto } from "../dtos/create.user.dto.js";
import { User } from "../entities/User.js";
import { UserVerification } from "../entities/UserVerification.js";
import { GetUsersDto } from "../schemas/get.users.schema.js";
import { VerifyUserDto } from "../schemas/verify.user.schema.js";

export interface IUserService {
  create(dto: CreateUserDto): Promise<User | null>;
  getOneUser(id: string): Promise<User>;
  searchUsers(dto: GetUsersDto): Promise<FindAndCountType<User>>;
  verifyUser(dto: VerifyUserDto): Promise<User>;
  getAllVerifications(): Promise<UserVerification[]>;
  resendCode(email: string): Promise<{ message: string }>;
}
