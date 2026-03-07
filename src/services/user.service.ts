import { IUserRepository } from "../interfaces/user.repo.interface.js";
import { CreateUserDto } from "../dtos/create.user.dto.js";
import { IUserService } from "../interfaces/user.service.interface.js";

export class UserService implements IUserService {
  constructor(private userRepo: IUserRepository) {}

  create = async (dto: CreateUserDto) => {
    const usernameAvailable = await this.userRepo.findOneByUsername(
      dto.username,
    );
    if (usernameAvailable) return null;

    const emailAvailable = await this.userRepo.findOneByEmail(dto.email);
    if (emailAvailable) return null;

    return await this.userRepo.create(dto);
  };
}
