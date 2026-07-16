import type { NextFunction, Request, RequestHandler, Response } from "express";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  windowMs: number;
  limit: number;
  message: string;
};

const stores = new Map<string, Map<string, RateLimitEntry>>();

const createIpRateLimit = ({
  windowMs,
  limit,
  message,
}: RateLimitOptions): RequestHandler => {
  const storeKey = `${windowMs}:${limit}:${message}`;
  const store = stores.get(storeKey) ?? new Map<string, RateLimitEntry>();
  stores.set(storeKey, store);

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const current = store.get(ip);

    if (!current || current.resetAt <= now) {
      store.set(ip, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }

    current.count += 1;

    if (current.count > limit) {
      const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({
        success: false,
        message,
        statusCode: 429,
      });
    }

    return next();
  };
};

export const authRateLimit = createIpRateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  message: "Cok fazla istek gonderildi. Lutfen biraz sonra tekrar deneyin.",
});

export const strictAuthRateLimit = createIpRateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: "Cok fazla deneme yapildi. Lutfen biraz sonra tekrar deneyin.",
});

export const resendCodeRateLimit = createIpRateLimit({
  windowMs: 60 * 1000,
  limit: 3,
  message: "Cok fazla kod istegi gonderildi. Lutfen biraz sonra deneyin.",
});
