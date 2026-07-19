import * as argon2 from "argon2";
import { DataSource } from "typeorm";
import { Seeder, SeederFactoryManager } from "typeorm-extension";
import { BannerTargetType } from "../constants/banner.constants.js";
import { PublicationStatus } from "../constants/chapter.constants.js";
import { FeedbackSubmissionType } from "../constants/feedback.constants.js";
import {
  NotificationTargetType,
  PersonalNotificationType,
} from "../constants/notification.constants.js";
import {
  DevicePlatform,
  PushProvider,
} from "../constants/push.notification.constants.js";
import { NovelType, SeriesStatus } from "../constants/series.constants.js";
import {
  UserGender,
  UserRoles,
  UserStatus,
} from "../constants/user.constants.js";
import {
  Author,
  Banner,
  Category,
  Chapter,
  ChapterComment,
  ChapterCommentLike,
  ChapterPublication,
  Comment,
  CommentLike,
  FeedbackSubmission,
  GlobalNotification,
  Library,
  Novel,
  NovelDailyStats,
  PasswordReset,
  PersonalNotification,
  ReadingStats,
  Reply,
  ReplyLike,
  Tags,
  User,
  UserDevice,
  UserFollow,
  UserVerification,
  Volume,
} from "../entities/_index.js";
import { mockCategories, mockUsers } from "./mock.data.js";

const image = (seed: string, width = 900, height = 1200) =>
  `https://picsum.photos/seed/${seed}/${width}/${height}`;

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const sample = <T>(items: T[], index: number) => items[index % items.length];

export default class MainSeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    _factoryManager: SeederFactoryManager,
  ): Promise<void> {
    await this.clearDatabase(dataSource);

    const userRepo = dataSource.getRepository(User);
    const verificationRepo = dataSource.getRepository(UserVerification);
    const passwordResetRepo = dataSource.getRepository(PasswordReset);
    const authorRepo = dataSource.getRepository(Author);
    const categoryRepo = dataSource.getRepository(Category);
    const tagRepo = dataSource.getRepository(Tags);
    const novelRepo = dataSource.getRepository(Novel);
    const volumeRepo = dataSource.getRepository(Volume);
    const chapterRepo = dataSource.getRepository(Chapter);
    const publicationRepo = dataSource.getRepository(ChapterPublication);
    const libraryRepo = dataSource.getRepository(Library);
    const readingStatsRepo = dataSource.getRepository(ReadingStats);
    const novelDailyStatsRepo = dataSource.getRepository(NovelDailyStats);
    const commentRepo = dataSource.getRepository(Comment);
    const commentLikeRepo = dataSource.getRepository(CommentLike);
    const replyRepo = dataSource.getRepository(Reply);
    const replyLikeRepo = dataSource.getRepository(ReplyLike);
    const chapterCommentRepo = dataSource.getRepository(ChapterComment);
    const chapterCommentLikeRepo = dataSource.getRepository(ChapterCommentLike);
    const globalNotificationRepo = dataSource.getRepository(GlobalNotification);
    const personalNotificationRepo =
      dataSource.getRepository(PersonalNotification);
    const userDeviceRepo = dataSource.getRepository(UserDevice);
    const userFollowRepo = dataSource.getRepository(UserFollow);
    const bannerRepo = dataSource.getRepository(Banner);
    const feedbackRepo = dataSource.getRepository(FeedbackSubmission);

    console.log("Dummy veriler hazirlaniyor...");

    const password = await argon2.hash("Password123!");
    const users = await userRepo.save(
      mockUsers.map((user, index) =>
        userRepo.create({
          ...user,
          username: user.username.slice(0, 15),
          nickname: user.nickname.slice(0, 20),
          password,
          gender: sample(
            [UserGender.MALE, UserGender.FEMALE, UserGender.OTHER],
            index,
          ),
          role:
            index === 0
              ? UserRoles.ADMIN
              : index === 1
                ? UserRoles.MODERATOR
                : UserRoles.USER,
          status: UserStatus.ACTIVE,
          isVerified: true,
          profileBackgroundImageUrl: image(`profile-bg-${index}`, 1200, 400),
        }),
      ),
    );

    await verificationRepo.save(
      users.map((user, index) =>
        verificationRepo.create({
          user,
          userId: user.id,
          code: `${100000 + index}`,
          expiry: addDays(new Date(), 7),
          lastSentAt: new Date(),
          attempts: index % 2,
        }),
      ),
    );

    await passwordResetRepo.save(
      users.slice(0, 3).map((user, index) =>
        passwordResetRepo.create({
          user,
          userId: user.id,
          codeHash: `dummy-reset-hash-${index}`,
          expiry: addDays(new Date(), 1),
          lastSentAt: new Date(),
          attempts: index,
        }),
      ),
    );

    const categories = await categoryRepo.save(
      mockCategories.map((category) =>
        categoryRepo.create({
          title: category.title,
        }),
      ),
    );

    const tagNames = [
      "isekai",
      "slow-burn",
      "academy",
      "magic",
      "anti-hero",
      "slice-of-life",
      "cultivation",
      "space-opera",
      "found-family",
      "time-loop",
      "urban-fantasy",
      "detective",
    ];
    const tags = await tagRepo.save(
      tagNames.map((name, index) =>
        tagRepo.create({
          name,
          slug: slugify(name),
          createdBy: sample(users, index),
          createdById: sample(users, index).id,
        }),
      ),
    );

    const authors = await authorRepo.save(
      users.slice(0, 6).map((user, index) =>
        authorRepo.create({
          user,
          userId: user.id,
          nickname: `${user.nickname} Writes`,
          isVerified: index < 4,
        }),
      ),
    );

    const novelSeeds = [
      "Moonlit Archive",
      "Aetherbound",
      "Last Train to Orion",
      "The Glass Duke",
      "Nine Lives of Solara",
      "Clockwork Sakura",
    ];
    const novels = await novelRepo.save(
      novelSeeds.map((name, index) =>
        novelRepo.create({
          name,
          slug: slugify(name),
          coverImage: image(`novel-${slugify(name)}`),
          synopsis:
            "A serialized dummy novel generated for development screens, relation tests, and list previews.",
          status: sample(
            [SeriesStatus.ONGOING, SeriesStatus.COMPLETED, SeriesStatus.HIATUS],
            index,
          ),
          type: index % 2 === 0 ? NovelType.WEB_NOVEL : NovelType.LIGHT_NOVEL,
          freeLimit: index % 3,
          author: sample(authors, index),
          authorId: sample(authors, index).id,
          viewCount: 1200 + index * 430,
          positiveReviewsCount: 8 + index,
          totalReviewsCount: 10 + index * 2,
          totalLibraryCount: 5 + index,
          rankingScore: 95 - index * 7,
          weeklyRankingScore: 48 - index * 3,
          isAdultContent: index === 4,
          categories: [
            sample(categories, index),
            sample(categories, index + 5),
            sample(categories, index + 9),
          ],
          tags: [
            sample(tags, index),
            sample(tags, index + 3),
            sample(tags, index + 6),
          ],
        }),
      ),
    );

    const volumes: Volume[] = [];
    for (const novel of novels) {
      for (let orderIndex = 1; orderIndex <= 2; orderIndex += 1) {
        volumes.push(
          await volumeRepo.save(
            volumeRepo.create({
              novel,
              novelId: novel.id,
              name: `Volume ${orderIndex}`,
              coverImage: image(`volume-${novel.slug}-${orderIndex}`),
              orderIndex,
            }),
          ),
        );
      }
    }

    const chapters: Chapter[] = [];
    for (const [novelIndex, novel] of novels.entries()) {
      const novelVolumes = volumes.filter(
        (volume) => volume.novelId === novel.id,
      );
      for (let chapterIndex = 1; chapterIndex <= 6; chapterIndex += 1) {
        const chapter = await chapterRepo.save(
          chapterRepo.create({
            novel,
            novelId: novel.id,
            title: `Chapter ${chapterIndex}: ${sample(
              [
                "First Light",
                "Hidden Door",
                "Oath",
                "Storm",
                "Afterglow",
                "Return",
              ],
              chapterIndex - 1,
            )}`,
            content: Array.from(
              { length: 8 },
              (_, paragraphIndex) =>
                `Paragraph ${paragraphIndex + 1} for dummy chapter ${chapterIndex} of ${novel.name}. This text exists so reader screens have realistic body content.`,
            ).join("\n\n"),
          }),
        );
        chapters.push(chapter);

        await publicationRepo.save(
          publicationRepo.create({
            chapter,
            chapterId: chapter.id,
            volume: chapterIndex <= 3 ? novelVolumes[0] : novelVolumes[1],
            volumeId:
              chapterIndex <= 3 ? novelVolumes[0].id : novelVolumes[1].id,
            orderIndex: chapterIndex,
            publicationStatus:
              chapterIndex === 6 && novelIndex % 2 === 1
                ? PublicationStatus.UNPUBLISHED
                : PublicationStatus.PUBLISHED,
            publishedAt: addDays(new Date(), -(novelIndex * 8 + chapterIndex)),
          }),
        );
      }
    }

    await novelRepo.save(
      novels.map((novel) => {
        const novelChapters = chapters.filter(
          (chapter) => chapter.novelId === novel.id,
        );
        novel.chapterCount = novelChapters.length;
        novel.lastChapterDate = new Date();
        return novel;
      }),
    );

    const libraries: Library[] = [];
    for (const [userIndex, user] of users.entries()) {
      for (let offset = 0; offset < 3; offset += 1) {
        const novel = sample(novels, userIndex + offset);
        libraries.push(
          libraryRepo.create({
            user,
            userId: user.id,
            novel,
            novelId: novel.id,
            isHidden: offset === 2 && userIndex % 3 === 0,
          }),
        );
      }
    }
    await libraryRepo.save(libraries);

    await readingStatsRepo.save(
      libraries.slice(0, 18).map((library, index) => {
        const novelChapters = chapters.filter(
          (chapter) => chapter.novelId === library.novelId,
        );
        const chapter = sample(novelChapters, index);
        return readingStatsRepo.create({
          user: library.user,
          userId: library.userId,
          novelId: library.novelId,
          chapter,
          lastReadChapterId: chapter.id,
          lastChapterProgress: Number(((index % 10) / 10).toFixed(1)),
          totalReadTime: 900 + index * 137,
          lastReadAt: addDays(new Date(), -index),
        });
      }),
    );

    await novelDailyStatsRepo.save(
      novels.flatMap((novel, novelIndex) =>
        [0, 1, 2, 3, 4].map((dayOffset) =>
          novelDailyStatsRepo.create({
            novel,
            novelId: novel.id,
            recordedAt: addDays(new Date(), -dayOffset)
              .toISOString()
              .slice(0, 10),
            totalViews: novel.viewCount + dayOffset * 25,
            totalReviews: novel.totalReviewsCount + dayOffset,
            totalPositiveReviews: novel.positiveReviewsCount + dayOffset,
            totalLibraryCount: novel.totalLibraryCount + novelIndex,
          }),
        ),
      ),
    );

    const comments: Comment[] = [];
    for (const [novelIndex, novel] of novels.entries()) {
      for (let offset = 0; offset < 4; offset += 1) {
        comments.push(
          await commentRepo.save(
            commentRepo.create({
              novel,
              novelId: novel.id,
              user: sample(users, novelIndex + offset),
              userId: sample(users, novelIndex + offset).id,
              content: `I am leaving a seeded review for ${novel.name}. The pacing and worldbuilding are useful for testing review cards.`,
              isRecommend: offset !== 3,
            }),
          ),
        );
      }
    }

    const commentLikes: CommentLike[] = [];
    comments.forEach((comment, index) => {
      [1, 2, 3].forEach((offset) => {
        const user = sample(users, index + offset);
        if (user.id !== comment.userId) {
          commentLikes.push(
            commentLikeRepo.create({
              user,
              userId: user.id,
              comment,
              commentId: comment.id,
            }),
          );
        }
      });
    });
    await commentLikeRepo.save(commentLikes);

    const replies: Reply[] = [];
    for (const [index, comment] of comments.slice(0, 12).entries()) {
      const reply = await replyRepo.save(
        replyRepo.create({
          comment,
          rootCommentId: comment.id,
          user: sample(users, index + 4),
          userId: sample(users, index + 4).id,
          content: "Seeded reply: totally agree, this one has a strong hook.",
        }),
      );
      replies.push(reply);
      replies.push(
        await replyRepo.save(
          replyRepo.create({
            comment,
            rootCommentId: comment.id,
            parentReply: reply,
            parentReplyId: reply.id,
            user: sample(users, index + 5),
            userId: sample(users, index + 5).id,
            content: "Nested seeded reply for thread rendering.",
          }),
        ),
      );
    }

    await replyLikeRepo.save(
      replies.slice(0, 16).map((reply, index) => {
        const user = sample(users, index + 2);
        return replyLikeRepo.create({
          reply,
          replyId: reply.id,
          user,
          userId: user.id,
        });
      }),
    );

    const chapterComments: ChapterComment[] = [];
    for (const [index, chapter] of chapters.slice(0, 18).entries()) {
      const root = await chapterCommentRepo.save(
        chapterCommentRepo.create({
          novel: sample(novels, index),
          novelId: chapter.novelId,
          chapter,
          chapterId: chapter.id,
          user: sample(users, index),
          userId: sample(users, index).id,
          content: `Seeded chapter comment for ${chapter.title}.`,
          rootCommentId: null,
          parentCommentId: null,
        }),
      );
      chapterComments.push(root);

      chapterComments.push(
        await chapterCommentRepo.save(
          chapterCommentRepo.create({
            novel: sample(novels, index),
            novelId: chapter.novelId,
            chapter,
            chapterId: chapter.id,
            user: sample(users, index + 1),
            userId: sample(users, index + 1).id,
            content: "Seeded chapter reply for nested comment UI.",
            rootComment: root,
            rootCommentId: root.id,
            parentComment: root,
            parentCommentId: root.id,
          }),
        ),
      );
    }

    await chapterCommentLikeRepo.save(
      chapterComments.slice(0, 24).map((comment, index) => {
        const user = sample(users, index + 3);
        return chapterCommentLikeRepo.create({
          comment,
          commentId: comment.id,
          user,
          userId: user.id,
        });
      }),
    );

    await userFollowRepo.save(
      users.flatMap((user, index) =>
        [1, 2].map((offset) => {
          const following = sample(users, index + offset);
          return userFollowRepo.create({
            follower: user,
            followerId: user.id,
            following,
            followingId: following.id,
          });
        }),
      ),
    );

    await userDeviceRepo.save(
      users.map((user, index) =>
        userDeviceRepo.create({
          user,
          userId: user.id,
          pushToken: `ExponentPushToken[seed-${user.username}-${index}]`,
          provider: PushProvider.EXPO,
          platform: sample(
            [DevicePlatform.IOS, DevicePlatform.ANDROID, DevicePlatform.WEB],
            index,
          ),
          deviceId: `seed-device-${index}`,
          isActive: index % 5 !== 0,
          lastSeenAt: addDays(new Date(), -index),
        }),
      ),
    );

    await globalNotificationRepo.save([
      globalNotificationRepo.create({
        title: "Welcome to Auro",
        summary: "Seeded launch announcement",
        content: "This is a dummy global notification for development.",
        priority: 10,
        isPublished: true,
        publishedAt: new Date(),
        expiresAt: addDays(new Date(), 30),
      }),
      globalNotificationRepo.create({
        title: "Maintenance Window",
        summary: "Seeded maintenance message",
        content: "A second dummy notification for list and detail screens.",
        priority: 3,
        isPublished: true,
        publishedAt: addDays(new Date(), -2),
      }),
    ]);

    await personalNotificationRepo.save(
      users.flatMap((user, index) => {
        const actor = sample(users, index + 1);
        const novel = sample(novels, index);
        const chapter = sample(
          chapters.filter((item) => item.novelId === novel.id),
          index,
        );
        return [
          personalNotificationRepo.create({
            user,
            userId: user.id,
            actorUser: actor,
            actorUserId: actor.id,
            type: PersonalNotificationType.FOLLOW,
            targetType: NotificationTargetType.USER,
            targetId: actor.id,
            targetUrl: `/users/${actor.username}`,
            titleSnapshot: `${actor.nickname} followed you`,
            bodySnapshot: "Seeded personal notification.",
            isRead: index % 2 === 0,
            readAt: index % 2 === 0 ? new Date() : null,
          }),
          personalNotificationRepo.create({
            user,
            userId: user.id,
            type: PersonalNotificationType.NEW_CHAPTER,
            targetType: NotificationTargetType.CHAPTER,
            targetId: chapter.id,
            targetUrl: `/novels/${novel.slug}/chapters/${chapter.id}`,
            data: { novelId: novel.id, chapterId: chapter.id },
            titleSnapshot: `${novel.name} has a new chapter`,
            bodySnapshot: chapter.title,
            isRead: false,
          }),
        ];
      }),
    );

    await bannerRepo.save(
      novels.slice(0, 4).map((novel, index) =>
        bannerRepo.create({
          orderIndex: index + 1,
          imageUrl: image(`banner-${novel.slug}`, 1400, 500),
          targetType: BannerTargetType.NOVEL,
          targetId: novel.id,
          isActive: true,
        }),
      ),
    );

    await feedbackRepo.save(
      users.slice(0, 6).map((user, index) =>
        feedbackRepo.create({
          user,
          userId: user.id,
          email: user.email,
          type: sample(
            [
              FeedbackSubmissionType.FEEDBACK,
              FeedbackSubmissionType.SUPPORT,
              FeedbackSubmissionType.SUGGESTION,
              FeedbackSubmissionType.REPORT,
            ],
            index,
          ),
          subject: `Seed feedback ${index + 1}`,
          message: "This is a seeded feedback submission for admin screens.",
          metadata: { userAgent: "seed-script", index },
        }),
      ),
    );

    await this.refreshCounters(dataSource);

    console.log(
      [
        `${users.length} users`,
        `${authors.length} authors`,
        `${categories.length} categories`,
        `${tags.length} tags`,
        `${novels.length} novels`,
        `${volumes.length} volumes`,
        `${chapters.length} chapters`,
        `${comments.length} novel comments`,
        `${chapterComments.length} chapter comments`,
      ].join(", "),
    );
  }

  private async clearDatabase(dataSource: DataSource) {
    const tables = dataSource.entityMetadatas
      .filter((metadata) => metadata.tableType !== "view")
      .map((metadata) => dataSource.driver.escape(metadata.tablePath))
      .join(", ");

    if (!tables) {
      return;
    }

    await dataSource.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
  }

  private async refreshCounters(dataSource: DataSource) {
    await dataSource.query(`
      UPDATE "comment" c
      SET
        "likeCount" = COALESCE(likes.count, 0),
        "replyCount" = COALESCE(replies.count, 0)
      FROM (
        SELECT "commentId", COUNT(*)::int AS count
        FROM "comment_like"
        GROUP BY "commentId"
      ) likes
      FULL OUTER JOIN (
        SELECT "rootCommentId", COUNT(*)::int AS count
        FROM "reply"
        GROUP BY "rootCommentId"
      ) replies ON replies."rootCommentId" = likes."commentId"
      WHERE c.id = COALESCE(likes."commentId", replies."rootCommentId")
    `);

    await dataSource.query(`
      UPDATE "reply" r
      SET "likeCount" = COALESCE(likes.count, 0)
      FROM (
        SELECT "replyId", COUNT(*)::int AS count
        FROM "reply_like"
        GROUP BY "replyId"
      ) likes
      WHERE r.id = likes."replyId"
    `);

    await dataSource.query(`
      UPDATE "chapter_comment" c
      SET
        "likeCount" = COALESCE(likes.count, 0),
        "replyCount" = COALESCE(replies.count, 0)
      FROM (
        SELECT "commentId", COUNT(*)::int AS count
        FROM "chapter_comment_like"
        GROUP BY "commentId"
      ) likes
      FULL OUTER JOIN (
        SELECT "rootCommentId", COUNT(*)::int AS count
        FROM "chapter_comment"
        WHERE "rootCommentId" IS NOT NULL
        GROUP BY "rootCommentId"
      ) replies ON replies."rootCommentId" = likes."commentId"
      WHERE c.id = COALESCE(likes."commentId", replies."rootCommentId")
    `);

    await dataSource.query(`
      UPDATE "chapter" c
      SET "commentCount" = COALESCE(comments.count, 0)
      FROM (
        SELECT "chapterId", COUNT(*)::int AS count
        FROM "chapter_comment"
        GROUP BY "chapterId"
      ) comments
      WHERE c.id = comments."chapterId"
    `);
  }
}
