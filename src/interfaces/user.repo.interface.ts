import { User } from "../entities/User.js";
import { CreateUserDto } from "../dtos/create.user.dto.js";

export interface IUserRepository {
  findOneByEmail(email: string): Promise<User | null>;
  findOneByUsername(username: string): Promise<User | null>;
  findOneById(id: string): Promise<User | null>;
  create(user: CreateUserDto): Promise<User>;
  getAll(page: number, limit: number): Promise<User[]>;
}
