import * as z from "zod";

export const createGlobalNotificationSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(255),
    summary: z.string().trim().min(1).max(500),
    content: z.string().trim().min(1),
    priority: z.coerce.number().int().min(0).optional().default(0),
    isPublished: z.boolean().optional().default(true),
    publishedAt: z.coerce.date().nullable().optional(),
    expiresAt: z.coerce.date().nullable().optional(),
  }),
});

export type CreateGlobalNotificationSchema = z.infer<
  typeof createGlobalNotificationSchema
>["body"];
