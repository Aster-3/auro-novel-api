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
import { MailService } from "./mail.service.js";
import { UserLoginDto } from "../schemas/user.login.shema.js";
import { TokenService } from "./token.service.js";
import { User } from "../entities/User.js";
import { UpdateUserDto } from "../schemas/update.user.schema.js";
import { GetMeQuery } from "../schemas/get.me.schema.js";
import { UserLoginResponseDto } from "../dtos/login.dto.js";
import { ref } from "node:process";
import { UnauthenticatedError } from "../errors/unauthenticated.error.js";

export class UserService implements IUserService {
  constructor(
    private userRepo: IUserRepository,
    private userVerificationRepo: IUserVerificationRepository,
    private mailService?: MailService,
    private tokenService?: TokenService,
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
      const user = await this.userRepo.findOneByEmail(dto.email);

      if (user && user.isVerified) {
        throw new ConflictError("user", "Bu hesap zaten onaylanmış.");
      }
      throw new BadRequestError("E-posta adresi veya doğrulama kodu hatalı.");
    }
    if (verification.attempts >= 5) {
      throw new ForbiddenError(
        "Çok fazla hatalı deneme. Lütfen yeni bir kod isteyin.",
      );
    }

    if (verification.expiry < new Date()) {
      throw new BadRequestError("Doğrulama kodunun süresi dolmuş.");
    }

    if (verification.code !== dto.code) {
      await this.userVerificationRepo.incrementAttempts(verification.id);
      throw new BadRequestError("E-posta adresi veya doğrulama kodu hatalı.");
    }

    const user = verification.user;

    if (user.isVerified) {
      throw new ConflictError("user", "Bu hesap zaten doğrulanmış.");
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

  login = async (dto: UserLoginDto) => {
    const user = await this.userRepo.findForLogin(dto.email);
    if (!user) {
      throw new BadRequestError("E-posta adresi veya şifre hatalı.");
    }

    const passwordMatch = await argon2.verify(user.password, dto.password);
    if (!passwordMatch) {
      throw new BadRequestError("E-posta adresi veya şifre hatalı.");
    }

    if (!user.isVerified) {
      throw new ForbiddenError(
        "Hesap doğrulanmamış. Lütfen e-posta adresinizi doğrulayın.",
      );
    }

    const accessToken = this.tokenService?.generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = this.tokenService?.generateRefreshToken({
      id: user.id,
    });
    await this.userRepo.updateRefreshToken(user.id, refreshToken!);

    const parsedUser = new UserLoginResponseDto(user);

    return { user: parsedUser, accessToken, refreshToken };
  };

  async updateUser(dto: UpdateUserDto): Promise<User> {
    console.log("Service updateData:", dto);

    const updated = await this.userRepo.updateUser(dto);
    if (!updated) {
      throw new NotFoundError("Kullanıcı bulunamadı.");
    }
    return updated;
  }

  async getMe(dto: GetMeQuery): Promise<User> {
    const user = await this.userRepo.getMe(dto);
    if (!user) {
      throw new NotFoundError("Kullanıcı bulunamadı.");
    }
    return user;
  }

  refreshToken = async (refreshToken: string) => {
    try {
      const payload: any = this.tokenService?.verifyRefreshToken(refreshToken);

      if (!payload) {
        throw new UnauthenticatedError("REFRESH_TOKEN_INVALID");
      }
      const user = await this.userRepo.findOneById(payload.id);

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthenticatedError("REFRESH_TOKEN_INVALID");
      }
      const newAccessToken = this.tokenService?.generateAccessToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      const parsedUser = new UserLoginResponseDto(user);

      return { accessToken: newAccessToken, user: parsedUser };
    } catch (err) {
      throw new UnauthenticatedError("REFRESH_TOKEN_INVALID");
    }
  };
}
