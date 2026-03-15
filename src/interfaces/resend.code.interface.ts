import * as z from "zod";

export const resendCodeSchema = z.object({
  body: z.object({
    email: z.email("Geçersiz e-posta formatı."),
  }),
});
