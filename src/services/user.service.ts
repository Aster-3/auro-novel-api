import { IUserRepository } from "../interfaces/user.repo.interface.js";
import { CreateUserDto } from "../dtos/create.user.dto.js";
import { IUserService } from "../interfaces/user.service.interface.js";
import { ConflictError } from "../errors/conflict.error.js";

export class UserService implements IUserService {
  constructor(private userRepo: IUserRepository) {}

  create = async (dto: CreateUserDto) => {
    const usernameAvailable = await this.userRepo.findOneByUsername(
      dto.username,
    );
    if (usernameAvailable)
      throw new ConflictError("username", "Kullanıcı adı zaten alınmış.");

    const emailAvailable = await this.userRepo.findOneByEmail(dto.email);
    if (emailAvailable)
      throw new ConflictError("email", "Email zaten alınmış.");

    return await this.userRepo.create(dto);
  };

  getAllUsers = async (page: number = 1, limit: number = 20) => {
    return await this.userRepo.getAll(page, limit);
  };

  getOneUser = async (id: string) => {
    return await this.userRepo.findOneById(id);
  };
}
