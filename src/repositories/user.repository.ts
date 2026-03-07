import { Repository } from "typeorm";
import { User } from "../entities/User.js";
import { IUserRepository } from "../interfaces/user.repo.interface.js";

export class UserRepository implements IUserRepository {
  constructor(private userRepo: Repository<User>) {}

  findOneByUsername(username: string) {
    return this.userRepo.findOneBy({ username });
  }

  findOneByEmail(email: string) {
    return this.userRepo.findOneBy({ email });
  }

  create(user: User) {
    return this.userRepo.save(user);
  }
}
