import * as z from "zod";
import {
  DevicePlatform,
  PushProvider,
} from "../constants/push.notification.constants.js";

export const registerUserDeviceSchema = z.object({
  body: z.object({
    pushToken: z.string().trim().min(1),
    provider: z.enum(PushProvider).optional().default(PushProvider.EXPO),
    platform: z.enum(DevicePlatform),
    deviceId: z.string().trim().min(1).max(255).nullable().optional(),
  }),
});

export const unregisterUserDeviceSchema = z.object({
  body: z.object({
    pushToken: z.string().trim().min(1),
  }),
});

export type RegisterUserDeviceDto = z.infer<
  typeof registerUserDeviceSchema
>["body"] & {
  userId: string;
};

export type UnregisterUserDeviceDto = z.infer<
  typeof unregisterUserDeviceSchema
>["body"] & {
  userId: string;
};
