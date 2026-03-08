import * as z from "zod";

export const reqString = (label: string) =>
  z.string({
    error: (i) =>
      i.input === undefined
        ? `${label} alanı zorunludur.`
        : `${label} metin olmalıdır.`,
  });

export const reqUuid = (label: string) =>
  z.uuid({
    error: (i) =>
      i.input === undefined
        ? `${label} alanı zorunludur.`
        : `${label} uuid olmalıdır.`,
  });
