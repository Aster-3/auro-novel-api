import * as z from "zod";
import { PublicationStatus } from "../constants/chapter.constants.js";
import {
  UserRoles,
  UserStatus,
  UserSubscriptionPeriod,
  UserSubscriptionTier,
} from "../constants/user.constants.js";
import { NovelType, SeriesStatus } from "../constants/series.constants.js";

const sortDirectionSchema = z.enum(["asc", "desc"]).optional().default("desc");

const queryBooleanSchema = z.preprocess((value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return value;
}, z.boolean());

const adminPaginationQuery = {
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  sort: sortDirectionSchema,
};

export const adminListUsersSchema = z.object({
  query: z.object({
    ...adminPaginationQuery,
    search: z.string().trim().optional(),
    role: z.enum(UserRoles).optional(),
    status: z.enum(UserStatus).optional(),
    isVerified: queryBooleanSchema.optional(),
    includeDeleted: queryBooleanSchema.optional().default(false),
  }),
});

export const adminListDeletedAccountRecoveriesSchema = z.object({
  query: z.object({
    ...adminPaginationQuery,
  }),
});

export const adminSearchDeletedAccountRecoverySchema = z.object({
  query: z
    .object({
      email: z.email().optional(),
      username: z.string().trim().min(3).max(15).optional(),
    })
    .refine((query) => query.email || query.username, {
      message: "Email veya username gonderilmelidir.",
    }),
});

export const adminRestoreDeletedUserSchema = z.object({
  body: z.object({
    id: z.uuid("Gecersiz kullanici id."),
    email: z.email(),
    password: z.string().min(6).max(100),
  }),
});

export const adminCreateAuthorSchema = z.object({
  body: z.object({
    nickname: z.string().trim().min(1).max(50),
    isVerified: z.boolean().optional().default(false),
  }),
});

export const adminCreateNovelSchema = z.object({
  body: z.object({
    name: z.string().trim().min(4).max(150),
    slug: z
      .string()
      .trim()
      .min(4)
      .max(200)
      .regex(/^[a-z0-9-]+$/),
    authorId: z.uuid("Gecersiz yazar id."),
    synopsis: z.string().trim().max(1500).nullable().optional(),
    status: z.enum(SeriesStatus).optional().default(SeriesStatus.DRAFT),
    type: z.enum(NovelType).optional().default(NovelType.USER_GENERATED),
    freeLimit: z.coerce.number().int().min(0).optional().default(0),
    isAdultContent: queryBooleanSchema.optional().default(false),
    isBanned: queryBooleanSchema.optional().default(false),
  }),
});

export const adminCreateVolumeSchema = z.object({
  params: z.object({
    id: z.uuid("Gecersiz roman id."),
  }),
  body: z.object({
    name: z.string().trim().max(100).nullable().optional(),
    orderIndex: z.coerce.number().min(1).optional(),
  }),
});

export const adminCreateChapterSchema = z.object({
  params: z.object({
    id: z.uuid("Gecersiz roman id."),
  }),
  body: z.object({
    title: z.string().trim().min(1).max(200),
    content: z.string().trim().min(1).max(50000),
  }),
});

export const adminUpdateChapterSchema = z.object({
  params: z.object({
    id: z.uuid("Gecersiz bolum id."),
  }),
  body: z
    .object({
      title: z.string().trim().min(1).max(200).optional(),
      content: z.string().trim().min(1).max(50000).optional(),
    })
    .strict()
    .refine((body) => Object.keys(body).length > 0, {
      message: "En az bir alan gonderilmelidir.",
    }),
});

export const adminPublishChapterSchema = z.object({
  params: z.object({
    id: z.uuid("Gecersiz bolum id."),
  }),
  body: z.object({
    novelId: z.uuid("Gecersiz roman id."),
    volumeId: z.uuid("Gecersiz cilt id.").optional(),
    orderIndex: z.coerce.number().min(1).optional(),
    publicationStatus: z
      .enum(PublicationStatus)
      .optional()
      .default(PublicationStatus.PUBLISHED),
  }),
});

export const adminUpdateUserSchema = z.object({
  params: z.object({
    id: z.uuid("Gecersiz kullanici id."),
  }),
  body: z
    .object({
      username: z.string().trim().min(3).max(15).optional(),
      nickname: z.string().trim().min(1).max(20).optional(),
      email: z.email().optional(),
      role: z.enum(UserRoles).optional(),
      status: z.enum(UserStatus).optional(),
      isVerified: z.boolean().optional(),
      showAdultContent: z.boolean().optional(),
      premiumUntil: z.coerce.date().nullable().optional(),
      subscriptionTier: z.enum(UserSubscriptionTier).nullable().optional(),
      subscriptionPeriod: z.enum(UserSubscriptionPeriod).nullable().optional(),
    })
    .strict()
    .refine((body) => Object.keys(body).length > 0, {
      message: "En az bir alan gonderilmelidir.",
    }),
});

export const adminListNovelsSchema = z.object({
  query: z.object({
    ...adminPaginationQuery,
    search: z.string().trim().optional(),
    authorId: z.uuid().optional(),
    status: z.enum(SeriesStatus).optional(),
    type: z.enum(NovelType).optional(),
    isBanned: queryBooleanSchema.optional(),
    isAdultContent: queryBooleanSchema.optional(),
  }),
});

export const adminUpdateNovelSchema = z.object({
  params: z.object({
    id: z.uuid("Gecersiz roman id."),
  }),
  body: z
    .object({
      name: z.string().trim().min(1).max(150).optional(),
      synopsis: z.string().trim().max(1500).nullable().optional(),
      status: z.enum(SeriesStatus).optional(),
      type: z.enum(NovelType).optional(),
      freeLimit: z.coerce.number().int().min(0).optional(),
      isBanned: queryBooleanSchema.optional(),
      isAdultContent: queryBooleanSchema.optional(),
    })
    .strict(),
});

export const adminListChaptersSchema = z.object({
  query: z.object({
    ...adminPaginationQuery,
    search: z.string().trim().optional(),
    novelId: z.uuid().optional(),
    publicationStatus: z.enum(PublicationStatus).optional(),
    hasPublication: queryBooleanSchema.optional(),
  }),
});

export const adminUpdateChapterPublicationSchema = z.object({
  params: z.object({
    id: z.uuid("Gecersiz bolum id."),
  }),
  body: z.object({
    publicationStatus: z.enum(PublicationStatus),
  }),
});

export const adminListCommentsSchema = z.object({
  query: z.object({
    ...adminPaginationQuery,
    search: z.string().trim().optional(),
    novelId: z.uuid().optional(),
    userId: z.uuid().optional(),
    isRecommend: queryBooleanSchema.optional(),
  }),
});

export const adminListRepliesSchema = z.object({
  query: z.object({
    ...adminPaginationQuery,
    search: z.string().trim().optional(),
    userId: z.uuid().optional(),
    rootCommentId: z.coerce.number().int().positive().optional(),
    includeDeleted: queryBooleanSchema.optional().default(false),
  }),
});

export const adminListNotificationsSchema = z.object({
  query: z.object({
    ...adminPaginationQuery,
    search: z.string().trim().optional(),
    isPublished: queryBooleanSchema.optional(),
  }),
});

export const adminUpdateNotificationSchema = z.object({
  params: z.object({
    id: z.uuid("Gecersiz duyuru id."),
  }),
  body: z
    .object({
      title: z.string().trim().min(1).max(255).optional(),
      summary: z.string().trim().min(1).max(500).optional(),
      content: z.string().trim().min(1).optional(),
      priority: z.coerce.number().int().min(0).max(100).optional(),
      isPublished: z.boolean().optional(),
      publishedAt: z.coerce.date().nullable().optional(),
      expiresAt: z.coerce.date().nullable().optional(),
    })
    .strict()
    .refine((body) => Object.keys(body).length > 0, {
      message: "En az bir alan gonderilmelidir.",
    }),
});

export type AdminListUsersDto = z.infer<typeof adminListUsersSchema>["query"];
export type AdminListDeletedAccountRecoveriesDto = z.infer<
  typeof adminListDeletedAccountRecoveriesSchema
>["query"];
export type AdminSearchDeletedAccountRecoveryDto = z.infer<
  typeof adminSearchDeletedAccountRecoverySchema
>["query"];
export type AdminRestoreDeletedUserDto = z.infer<
  typeof adminRestoreDeletedUserSchema
>["body"];
export type AdminCreateAuthorDto = z.infer<
  typeof adminCreateAuthorSchema
>["body"];
export type AdminCreateNovelDto = z.infer<
  typeof adminCreateNovelSchema
>["body"];
export type AdminCreateVolumeDto = z.infer<
  typeof adminCreateVolumeSchema
>["body"];
export type AdminCreateChapterDto = z.infer<
  typeof adminCreateChapterSchema
>["body"];
export type AdminUpdateChapterDto = z.infer<
  typeof adminUpdateChapterSchema
>["body"];
export type AdminPublishChapterDto = z.infer<
  typeof adminPublishChapterSchema
>["body"];
export type AdminUpdateUserDto = z.infer<typeof adminUpdateUserSchema>["body"];
export type AdminListNovelsDto = z.infer<typeof adminListNovelsSchema>["query"];
export type AdminUpdateNovelDto = z.infer<typeof adminUpdateNovelSchema>["body"];
export type AdminListChaptersDto = z.infer<
  typeof adminListChaptersSchema
>["query"];
export type AdminListCommentsDto = z.infer<
  typeof adminListCommentsSchema
>["query"];
export type AdminListRepliesDto = z.infer<
  typeof adminListRepliesSchema
>["query"];
export type AdminListNotificationsDto = z.infer<
  typeof adminListNotificationsSchema
>["query"];
export type AdminUpdateNotificationDto = z.infer<
  typeof adminUpdateNotificationSchema
>["body"];
