import { createHmac } from "crypto";
import { getEnv } from "./getEnv.js";

const normalize = (value: string) => value.trim().toLowerCase();

export function createAccountRecoveryHash(value: string) {
  return createHmac("sha256", getEnv("JWT_ACCESS_SECRET"))
    .update(normalize(value))
    .digest("hex");
}
