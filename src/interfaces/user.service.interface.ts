import { CreateUserDto } from "../dtos/create.user.dto.js";
import { User } from "../entities/User.js";

export interface IUserService {
  create(dto: CreateUserDto): Promise<User | null>;
}
