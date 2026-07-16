import { PushProvider } from "../constants/push.notification.constants.js";
import { UserDevice } from "../entities/UserDevice.js";
import { IUnitOfWork } from "../interfaces/unit.of.work.interface.js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_BATCH_SIZE = 100;

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface PushDispatchResult {
  attemptedDevices: number;
  skippedDevices: number;
  acceptedTickets: number;
  ticketErrors: number;
  deactivatedTokens: number;
}

type ExpoPushTicket = {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: {
    error?: string;
  };
};

export class PushNotificationService {
  constructor(private uow: IUnitOfWork) {}

  async sendToUser(
    userId: string,
    message: PushMessage,
  ): Promise<PushDispatchResult> {
    const devices =
      await this.uow.userDeviceRepository.getActiveDevicesByUserId(userId);

    return await this.sendToDevices(devices, message);
  }

  async sendGlobal(message: PushMessage): Promise<PushDispatchResult> {
    const devices =
      await this.uow.userDeviceRepository.getActiveDevicesByProvider(
        PushProvider.EXPO,
      );

    return await this.sendToDevices(devices, message);
  }

  private async sendToDevices(
    devices: UserDevice[],
    message: PushMessage,
  ): Promise<PushDispatchResult> {
    const expoDevices = devices.filter(
      (device) =>
        device.provider === PushProvider.EXPO &&
        (device.pushToken.startsWith("Expo") ||
          device.pushToken.startsWith("Exponent")),
    );
    const skippedDevices = devices.length - expoDevices.length;

    const result: PushDispatchResult = {
      attemptedDevices: expoDevices.length,
      skippedDevices,
      acceptedTickets: 0,
      ticketErrors: 0,
      deactivatedTokens: 0,
    };

    const tokensToDeactivate: string[] = [];

    for (let i = 0; i < expoDevices.length; i += EXPO_BATCH_SIZE) {
      const batch = expoDevices.slice(i, i + EXPO_BATCH_SIZE);
      const tickets = await this.sendExpoBatch(batch, message);

      tickets.forEach((ticket, index) => {
        if (ticket.status === "ok") {
          result.acceptedTickets += 1;
          return;
        }

        result.ticketErrors += 1;
        if (ticket.details?.error === "DeviceNotRegistered") {
          tokensToDeactivate.push(batch[index].pushToken);
        }
      });
    }

    await this.uow.userDeviceRepository.deactivatePushTokens(
      tokensToDeactivate,
    );
    result.deactivatedTokens = tokensToDeactivate.length;

    return result;
  }

  private async sendExpoBatch(
    devices: UserDevice[],
    message: PushMessage,
  ): Promise<ExpoPushTicket[]> {
    if (!devices.length) {
      return [];
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    };

    const accessToken = process.env.EXPO_PUSH_ACCESS_TOKEN;
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(
        devices.map((device) => ({
          to: device.pushToken,
          sound: "default",
          title: message.title,
          body: message.body,
          data: message.data ?? {},
        })),
      ),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(
        `Expo push request failed with status ${response.status}: ${JSON.stringify(
          payload,
        )}`,
      );
    }

    return Array.isArray(payload.data) ? payload.data : [payload.data];
  }
}
