import * as z from "zod";

export const googleLoginSchema = z.object({
  body: z.object({
    idToken: z.string().trim().min(1, "Google idToken zorunludur."),
  }),
});

export type GoogleLoginDto = z.infer<typeof googleLoginSchema>["body"];
