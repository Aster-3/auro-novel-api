import * as z from "zod";

export const chapterCommentIdSchema = z.object({
  params: z.object({
    commentId: z.coerce.number().min(1, "Yorum id 1'den buyuk olmalidir"),
  }),
});
