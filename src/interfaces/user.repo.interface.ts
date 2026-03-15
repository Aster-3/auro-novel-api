import { User } from "../entities/User.js";
import { CreateUserDto } from "../dtos/create.user.dto.js";
import { FindAndCountType } from "../constants/findAndCountType.js";
import { GetUsersDto } from "../schemas/get.users.schema.js";
import { VerifyUserDto } from "../schemas/verify.user.schema.js";
import { UserVerification } from "../entities/_index.js";

export interface IUserRepository {
  findOneByEmail(email: string): Promise<User | null>;
  findOneByUsername(username: string): Promise<User | null>;
  findOneById(id: string): Promise<User | null>;
  activateUser(user: User, verification: UserVerification): Promise<User>;
  create(user: CreateUserDto, code: string, expiry: Date): Promise<User>;
  searchUsers(dto: GetUsersDto): Promise<FindAndCountType<User>>;
  exsistById(id: string): Promise<boolean>;
  findByVerificationCodeandEmail(dto: VerifyUserDto): Promise<User | null>;
}
