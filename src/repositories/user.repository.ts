import { Repository } from "typeorm";
import { User } from "../entities/User.js";
import { IUserRepository } from "../interfaces/user.repo.interface.js";
import { CreateUserDto } from "../dtos/create.user.dto.js";

export class UserRepository implements IUserRepository {
  constructor(private userRepo: Repository<User>) {}

  findOneByUsername(username: string) {
    return this.userRepo.findOneBy({ username });
  }

  findOneByEmail(email: string) {
    return this.userRepo.findOneBy({ email });
  }

  create(user: CreateUserDto) {
    return this.userRepo.save(user);
  }

  async getAll(page: number, limit: number) {
    const [users, count] = await this.userRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });
    return users;
  }

  findOneById(id: string): Promise<User | null> {
    return this.userRepo.findOneBy({ id });
  }
}
