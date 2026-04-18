import * as z from "zod";
import { reqUuid } from "../utils/zod.error.helper.js";

/**
 * @param {string} location - 'params', 'body' veya 'query'
 * @param {string} fieldName - 'id', 'novelId', 'commentId' vb.
 */
export const uuidControlSchema = (location = "params", fieldName = "id") => {
  return z.object({
    [location]: z.object({
      [fieldName]: reqUuid("Geçersiz UUID formatı"),
    }),
  });
};
