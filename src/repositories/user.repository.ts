import { Like, Repository } from "typeorm";
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
    return this.userRepo.findOne({
      where: { id },
      select: {
        id: true,
        username: true,
        nickname: true,
        email: true,
        profileImageUrl: true,
        profileBackgroundImageUrl: true,
        description: true,
        novel: {
          id: true,
          name: true,
          coverImage: true,
        },
        library: {
          novelId: true,
          createdAt: true,
        },
      },
      relations: {
        library: true,
        novel: true,
      },
    });
  }

  async searchUsers(query: string, page: number) {
    if (!query || query.trim().length === 0) {
      return {
        data: [],
        count: 0,
        currentPage: page,
        lastPage: 0,
      };
    }

    const [result, total] = await this.userRepo.findAndCount({
      where: { username: Like(`${query}%`) },
      order: { username: "ASC" },
      take: 10,
      skip: (page - 1) * 10,
    });

    return {
      data: result,
      count: total,
      currentPage: page,
      lastPage: Math.ceil(total / 10),
    };
  }
}
