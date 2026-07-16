import { In, Repository } from "typeorm";
import { PushProvider } from "../constants/push.notification.constants.js";
import { UserDevice } from "../entities/UserDevice.js";
import { IUserDeviceRepository } from "../interfaces/user.device.repo.interface.js";
import {
  RegisterUserDeviceDto,
  UnregisterUserDeviceDto,
} from "../schemas/register.user.device.schema.js";

export class UserDeviceRepository implements IUserDeviceRepository {
  constructor(private userDeviceRepo: Repository<UserDevice>) {}

  async upsertDevice(dto: RegisterUserDeviceDto): Promise<UserDevice> {
    const existingDevice = await this.userDeviceRepo.findOne({
      where: { pushToken: dto.pushToken },
    });

    if (existingDevice) {
      existingDevice.userId = dto.userId;
      existingDevice.provider = dto.provider;
      existingDevice.platform = dto.platform;
      existingDevice.deviceId = dto.deviceId ?? existingDevice.deviceId ?? null;
      existingDevice.isActive = true;
      existingDevice.lastSeenAt = new Date();
      return await this.userDeviceRepo.save(existingDevice);
    }

    const device = this.userDeviceRepo.create({
      userId: dto.userId,
      pushToken: dto.pushToken,
      provider: dto.provider,
      platform: dto.platform,
      deviceId: dto.deviceId ?? null,
      isActive: true,
      lastSeenAt: new Date(),
    });

    return await this.userDeviceRepo.save(device);
  }

  async deactivateDevice(dto: UnregisterUserDeviceDto): Promise<number> {
    const result = await this.userDeviceRepo.update(
      {
        userId: dto.userId,
        pushToken: dto.pushToken,
      },
      { isActive: false },
    );

    return result.affected || 0;
  }

  async getActiveDevicesByUserId(userId: string): Promise<UserDevice[]> {
    return await this.userDeviceRepo.find({
      where: { userId, isActive: true },
    });
  }

  async getActiveDevicesByProvider(
    provider: PushProvider,
  ): Promise<UserDevice[]> {
    return await this.userDeviceRepo.find({
      where: { provider, isActive: true },
    });
  }

  async deactivatePushTokens(pushTokens: string[]): Promise<void> {
    if (!pushTokens.length) {
      return;
    }

    await this.userDeviceRepo.update(
      { pushToken: In(pushTokens) },
      { isActive: false },
    );
  }
}
