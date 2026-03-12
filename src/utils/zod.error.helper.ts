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

export const reqNumber = (label: string) =>
  z.number({
    error: (i) =>
      i.input === undefined
        ? `${label} alanı zorunludur.`
        : `${label} sayı olmalıdır.`,
  });

export const reqFloat = (label: string) =>
  z.float32({
    error: (i) =>
      i.input === undefined
        ? `${label} alanı zorunludur.`
        : `${label} sayı olmalıdır.`,
  });
