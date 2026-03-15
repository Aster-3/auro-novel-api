import { ILike, Like, Repository } from "typeorm";
import { User } from "../entities/User.js";
import { IUserRepository } from "../interfaces/user.repo.interface.js";
import { CreateUserDto } from "../dtos/create.user.dto.js";
import { GetUsersDto } from "../schemas/get.users.schema.js";
import { VerifyUserDto } from "../schemas/verify.user.schema.js";
import { UserVerification } from "../entities/UserVerification.js";
import { UserStatus } from "../constants/user.constants.js";

export class UserRepository implements IUserRepository {
  constructor(private userRepo: Repository<User>) {}

  findOneByUsername(username: string) {
    return this.userRepo.findOneBy({ username });
  }

  async findOneByEmail(email: string) {
    const a = await this.userRepo.findOneBy({ email });
    console.log("findOneByEmail result:", a);
    return a;
  }

  async create(userDto: CreateUserDto, code: string, expiry: Date) {
    return await this.userRepo.manager.transaction(async (manager) => {
      const user = manager.create(User, userDto);
      const savedUser = await manager.save(User, user);

      const verification = manager.create(UserVerification, {
        code,
        expiry,
        user: savedUser,
      });
      await manager.save(UserVerification, verification);

      return savedUser;
    });
  }

  async activateUser(user: User, verification: UserVerification) {
    return await this.userRepo.manager.transaction(async (manager) => {
      user.isVerified = true;
      user.status = UserStatus.ACTIVE;
      const updatedUser = await manager.save(User, user);
      await manager.remove(UserVerification, verification);
      return updatedUser;
    });
  }

  findByVerificationCodeandEmail(dto: VerifyUserDto) {
    return this.userRepo.findOne({
      where: { email: dto.email },
    });
  }

  exsistById(id: string): Promise<boolean> {
    return this.userRepo.exists({ where: { id } });
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
        role: true,
        status: true,
        isVerified: true,
      },
      relations: {
        verification: true,
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
