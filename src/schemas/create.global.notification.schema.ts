import * as z from "zod";

export const createGlobalNotificationSchema = z.object({
  body: z
    .object({
      title: z.string().trim().min(1).max(255),
      summary: z.string().trim().min(1).max(500),
      content: z.string().trim().min(1).nullable().optional(),
      targetUrl: z.url("Gecersiz hedef URL.").nullable().optional(),
      isPublished: z.boolean().optional().default(true),
      publishedAt: z.coerce.date().nullable().optional(),
      expiresAt: z.coerce.date().nullable().optional(),
    })
    .strict()
    .refine((body) => Boolean(body.content) || Boolean(body.targetUrl), {
      message: "Content veya targetUrl alanlarindan en az biri zorunludur.",
      path: ["content"],
    }),
});

export type CreateGlobalNotificationSchema = z.infer<
  typeof createGlobalNotificationSchema
>["body"];
