import * as z from "zod";
import { reqNumber } from "../utils/zod.error.helper.js";

const optionalContentSchema = z.preprocess(
  (val) => (val === undefined || val === null ? "" : val),
  z.string().max(1500, "Yorum en fazla 1500 karakter olmalidir"),
);

const optionalImageDimensionSchema = z.preprocess(
  (val) => (val === "" || val === undefined || val === null ? null : val),
  z.coerce
    .number({
      error: "Gorsel boyutu sayi olmalidir.",
    })
    .int("Gorsel boyutu tam sayi olmalidir.")
    .min(1, "Gorsel boyutu 1'den buyuk olmalidir.")
    .nullable()
    .optional(),
);

export const createChapterCommentSchema = z.object({
  body: z.object({
    content: optionalContentSchema,
    imageWidth: optionalImageDimensionSchema,
    imageHeight: optionalImageDimensionSchema,
  }),
  params: z.object({
    chapterId: z.uuid("Gecerli bir chapter id'si giriniz"),
  }),
});

export const createChapterCommentReplySchema = z.object({
  body: z.object({
    content: optionalContentSchema,
    imageWidth: optionalImageDimensionSchema,
    imageHeight: optionalImageDimensionSchema,
    parentCommentId: z.preprocess(
      (val) => (val === "" || val === undefined ? null : val),
      z.coerce
        .number({
          error: (i) =>
            i.input === undefined
              ? "Parent yorum id alani zorunludur."
              : "Parent yorum id sayi olmalidir.",
        })
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
