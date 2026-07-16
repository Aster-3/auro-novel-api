import { PushProvider } from "../constants/push.notification.constants.js";
import { UserDevice } from "../entities/UserDevice.js";
import {
  RegisterUserDeviceDto,
  UnregisterUserDeviceDto,
} from "../schemas/register.user.device.schema.js";

export interface IUserDeviceRepository {
  upsertDevice(dto: RegisterUserDeviceDto): Promise<UserDevice>;
  deactivateDevice(dto: UnregisterUserDeviceDto): Promise<number>;
  getActiveDevicesByUserId(userId: string): Promise<UserDevice[]>;
  getActiveDevicesByProvider(provider: PushProvider): Promise<UserDevice[]>;
  deactivatePushTokens(pushTokens: string[]): Promise<void>;
}
