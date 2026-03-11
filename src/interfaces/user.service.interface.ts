import { FindAndCountType } from "../constants/findAndCountType.js";
import { CreateUserDto } from "../dtos/create.user.dto.js";
import { User } from "../entities/User.js";
import { GetUsersDto } from "../schemas/get.users.schema.js";

export interface IUserService {
  create(dto: CreateUserDto): Promise<User | null>;
  getOneUser(id: string): Promise<User>;
  searchUsers(dto: GetUsersDto): Promise<FindAndCountType<User>>;
}
