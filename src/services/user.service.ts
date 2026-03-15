import { IUserRepository } from "../interfaces/user.repo.interface.js";
import { CreateUserDto } from "../dtos/create.user.dto.js";
import { IUserService } from "../interfaces/user.service.interface.js";
import { ConflictError } from "../errors/conflict.error.js";
import { NotFoundError } from "../errors/not.found.error.js";
import { GetUsersDto } from "../schemas/get.users.schema.js";
import * as argon2 from "argon2";
import { VerifyUserDto } from "../schemas/verify.user.schema.js";
import { IUserVerificationRepository } from "../interfaces/user.verification.repo.interface.js";
import { ForbiddenError } from "../errors/forbidden.error.js";
import { BadRequestError } from "../errors/bad.request.js";
import { Resend } from "resend";
import { MailService } from "./mail.service.js";
export class UserService implements IUserService {
  constructor(
    private userRepo: IUserRepository,
    private userVerificationRepo: IUserVerificationRepository,
    private mailService?: MailService,
  ) {}

  create = async (dto: CreateUserDto) => {
    const usernameAvailable = await this.userRepo.findOneByUsername(
      dto.username,
    );
    if (usernameAvailable)
      throw new ConflictError("username", "Kullanıcı adı zaten alınmış.");

    const emailAvailable = await this.userRepo.findOneByEmail(dto.email);
    if (emailAvailable)
      throw new ConflictError("email", "Email zaten alınmış.");

    const hashedPassword = await argon2.hash(dto.password);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60000);

    const user = await this.userRepo.create(
      { ...dto, password: hashedPassword },
      code,
      expiry,
    );
    if (this.mailService) {
      await this.mailService.sendVerificationCode(user.email, code);
    }
    return user;
  };

  verifyUser = async (dto: VerifyUserDto) => {
    const verification = await this.userVerificationRepo.findByEmail(dto.email);

    if (!verification) {
      throw new BadRequestError("E-posta adresi veya doğrulama kodu hatalı.");
    }

    if (verification.attempts >= 5) {
      throw new ForbiddenError(
        "Çok fazla hatalı deneme. Lütfen yeni bir kod isteyin.",
      );
    }

    if (verification.code !== dto.code) {
      await this.userVerificationRepo.incrementAttempts(verification.id);
      throw new BadRequestError("E-posta adresi veya doğrulama kodu hatalı.");
    }

    if (verification.expiry < new Date()) {
      throw new BadRequestError("Doğrulama kodunun süresi dolmuş.");
    }

    const user = verification.user;

    if (user.isVerified) {
      throw new ConflictError("user", "Kullanıcı zaten doğrulanmış.");
    }
    return await this.userRepo.activateUser(user, verification);
  };

  getOneUser = async (id: string) => {
    const user = await this.userRepo.findOneById(id);
    if (!user) throw new NotFoundError("Kullanıcı bulunamadı.");
    return user;
  };

  searchUsers = async (dto: GetUsersDto) => {
    return await this.userRepo.searchUsers(dto);
  };

  getAllVerifications = async () => {
    return await this.userVerificationRepo.getAll();
  };

  resendCode = async (email: string) => {
    const user = await this.userRepo.findOneByEmail(email);

    if (!user) throw new NotFoundError("Kullanıcı bulunamadı.");

    if (user.isVerified) {
      throw new ConflictError("user", "Bu hesap zaten onaylanmış.");
    }

    console.log("Kullanıcı:", user);

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newExpiry = new Date(Date.now() + 5 * 60000);

    await this.userVerificationRepo.refreshVerificationCode(
      user.id,
      newCode,
      newExpiry,
    );

    if (this.mailService) {
      this.mailService.sendVerificationCode(user.email, newCode);
    }

    return { message: "Yeni doğrulama kodu e-posta adresinize gönderildi." };
  };
}
