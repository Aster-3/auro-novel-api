import { IUserRepository } from "../interfaces/user.repo.interface.js";
import { CreateUserDto } from "../dtos/create.user.dto.js";
import { IUserService } from "../interfaces/user.service.interface.js";
import { ConflictError } from "../errors/conflict.error.js";
import { NotFoundError } from "../errors/not.found.error.js";
import { GetUsersDto } from "../schemas/get.users.schema.js";

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

  getOneUser = async (id: string) => {
    const user = await this.userRepo.findOneById(id);
    if (!user) throw new NotFoundError("Kullanıcı bulunamadı.");
    return user;
  };

  searchUsers = async (dto: GetUsersDto) => {
    return await this.userRepo.searchUsers(dto);
  };
}
