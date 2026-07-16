import * as z from "zod";
import { reqNumber, reqString } from "../utils/zod.error.helper.js";

const contentSchema = reqString("Yorum")
  .min(1, "Yorum bos birakilamaz")
  .max(1500, "Yorum en fazla 1500 karakter olmalidir");

export const createChapterCommentSchema = z.object({
  body: z.object({
    content: contentSchema,
  }),
  params: z.object({
    chapterId: z.uuid("Gecerli bir chapter id'si giriniz"),
  }),
});

export const createChapterCommentReplySchema = z.object({
  body: z.object({
    content: contentSchema,
    parentCommentId: z.preprocess(
      (val) => (val === "" || val === undefined ? null : val),
      reqNumber("Parent yorum id")
        .min(1, "Parent yorum id 1'den buyuk olmalidir")
        .nullable()
        .optional(),
    ),
  }),
  params: z.object({
    commentId: z.coerce.number().min(1, "Yorum id 1'den buyuk olmalidir"),
  }),
});

export type CreateChapterCommentDto = z.infer<
  typeof createChapterCommentSchema
>["body"] &
  z.infer<typeof createChapterCommentSchema.shape.params>;

export type CreateChapterCommentReplyDto = z.infer<
  typeof createChapterCommentReplySchema
>["body"];
