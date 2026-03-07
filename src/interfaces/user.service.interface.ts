import { CreateUserDto } from "../dtos/create.user.dto.js";
import { User } from "../entities/User.js";

export interface IUserService {
  create(dto: CreateUserDto): Promise<User | null>;
  getAllUsers(page?: number, limit?: number): Promise<User[]>;
  getOneUser(id: string): Promise<User | null>;
}
