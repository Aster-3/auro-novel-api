import * as z from "zod";

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.email("Gecersiz e-posta adresi"),
  }),
});

export type ForgotPasswordDto = z.infer<
  typeof forgotPasswordSchema
>["body"];
