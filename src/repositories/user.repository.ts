import { ILike, Like, Repository } from "typeorm";
import { User } from "../entities/User.js";
import { IUserRepository } from "../interfaces/user.repo.interface.js";
import { CreateUserDto } from "../dtos/create.user.dto.js";
import { GetUsersDto } from "../schemas/get.users.schema.js";

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
      },
      relations: {
        novels: true,
        comments: true,
        replies: true,
      },
    });
  }

  async searchUsers(dto: GetUsersDto) {
    const { search, page, limit, role, status } = dto;

    const isSearchSentButEmpty = search !== undefined && search.trim() === "";
    const hasNoOtherFilters = !role && !status;

    if (isSearchSentButEmpty && hasNoOtherFilters) {
      return {
        data: [],
        count: 0,
        currentPage: page,
        lastPage: 0,
      };
    }
    const where: any = {};
    if (search) where.nickname = ILike(`%${search}%`);
    if (role) where.role = role;
    if (status) where.status = status;

    const [result, total] = await this.userRepo.findAndCount({
      where: where,
      select: {
        id: true,
        username: true,
        nickname: true,
        profileImageUrl: true,
      },
      order: { createdAt: "ASC" },
      take: limit,
      skip: (page - 1) * limit,
    });
    return {
      data: result,
      count: total,
      currentPage: page,
      lastPage: Math.ceil(total / limit),
    };
  }
}
