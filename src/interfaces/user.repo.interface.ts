import { User } from "../entities/User.js";
import { CreateUserDto } from "../dtos/create.user.dto.js";
import { FindAndCountType } from "../constants/findAndCountType.js";
import { GetUsersDto } from "../schemas/get.users.schema.js";

export interface IUserRepository {
  findOneByEmail(email: string): Promise<User | null>;
  findOneByUsername(username: string): Promise<User | null>;
  findOneById(id: string): Promise<User | null>;
  create(user: CreateUserDto): Promise<User>;
  searchUsers(dto: GetUsersDto): Promise<FindAndCountType<User>>;
  exsistById(id: string): Promise<boolean>;
}
