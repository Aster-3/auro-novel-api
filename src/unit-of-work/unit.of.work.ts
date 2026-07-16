import { IAuthorRepository } from "../interfaces/author.repo.interface.js";
import { IChapterRepository } from "../interfaces/chapter.repo.interface.js";
import { IChapterCommentLikeRepository } from "../interfaces/chapter.comment.like.repo.interface.js";
import { IChapterCommentRepository } from "../interfaces/chapter.comment.repo.interface.js";
import { ICategoryRepository } from "../interfaces/categories.repo.interface.js";
import { INovelRepository } from "../interfaces/novel.repo.interface.js";
import { IChapterPublicationRepository } from "../interfaces/chapter.publication.repo.interface.js";
import { ICommentRepository } from "../interfaces/comment.repo.interface.js";
import { ICommentLikeRepository } from "../interfaces/comment.like.repo.interface.js";
import { IUnitOfWork } from "../interfaces/unit.of.work.interface.js";
import { ILibraryRepository } from "../interfaces/library.repo.interface.js";
import { INovelDailyStatsRepository } from "../interfaces/novel.daily.stats.repo.interface.js";
import { IReplyRepository } from "../interfaces/reply.repo.interface.js";
import { IReplyLikeRepository } from "../interfaces/reply.like.repo.interface.js";
import { ITagRepository } from "../interfaces/tag.repo.interface.js";
import { IUserRepository } from "../interfaces/user.repo.interface.js";
import { IUserVerificationRepository } from "../interfaces/user.verification.repo.interface.js";
import { IVolumeRepository } from "../interfaces/volume.repo.interface.js";

import {
  Author,
  Category,
  Chapter,
  ChapterComment,
  ChapterCommentLike,
  ChapterPublication,
  Comment,
  CommentLike,
  Library,
  Novel,
  NovelDailyStats,
  Reply,
  ReplyLike,
  Tags,
  User,
  UserVerification,
  Volume,
  ReadingStats,
  PersonalNotification,
  GlobalNotification,
  UserDevice,
  UserFollow,
  PasswordReset,
  FeedbackSubmission,
  Banner,
} from "../entities/_index.js";

import { AppDataSource } from "../database/data-source.js";

import { AuthorRepository } from "../repositories/author.repository.js";
import { CategoryRepository } from "../repositories/category.repository.js";
import { ChapterPublicationRepository } from "../repositories/chapter.publication.repository.js";
import { ChapterCommentLikeRepository } from "../repositories/chapter.comment.like.repository.js";
import { ChapterCommentRepository } from "../repositories/chapter.comment.repository.js";
import { ChapterRepository } from "../repositories/chapter.repository.js";
import { CommentLikeRepository } from "../repositories/comment.like.repository.js";
import { CommentRepository } from "../repositories/comment.repository.js";
import { LibraryRepository } from "../repositories/library.repository.js";
import { NovelDailyStatsRepository } from "../repositories/novel.daily.stats.repository.js";
import { NovelRepository } from "../repositories/novel.repository.js";
import { ReplyLikeRepository } from "../repositories/reply.like.repository.js";
import { ReplyRepository } from "../repositories/reply.repository.js";
import { TagRepository } from "../repositories/tag.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { UserVerificationRepository } from "../repositories/user.verification.repository.js";
import { VolumeRepository } from "../repositories/volume.repository.js";
import { IReadingStatsRepository } from "../interfaces/reading.stats.repository.interface.js";
import { ReadingStatsRepository } from "../repositories/reading.stats.repository.js";
import { IPersonalNotificationRepository } from "../interfaces/personal.notification.repo.interface.js";
import { PersonalNotificationRepository } from "../repositories/personal.notification.repository.js";
import { GlobalNotificationRepository } from "../repositories/global.notification.repository.js";
import { IGlobalNotificationRepository } from "../interfaces/global.notification.repo.interface.js";
import { IUserDeviceRepository } from "../interfaces/user.device.repo.interface.js";
import { UserDeviceRepository } from "../repositories/user.device.repository.js";
import { IUserFollowRepository } from "../interfaces/user.follow.repo.interface.js";
import { UserFollowRepository } from "../repositories/user.follow.repository.js";
import { IPasswordResetRepository } from "../interfaces/password.reset.repo.interface.js";
import { PasswordResetRepository } from "../repositories/password.reset.repository.js";
import { IFeedbackSubmissionRepository } from "../interfaces/feedback.submission.repo.interface.js";
import { FeedbackSubmissionRepository } from "../repositories/feedback.submission.repository.js";
import { IBannerRepository } from "../interfaces/banner.repo.interface.js";
import { BannerRepository } from "../repositories/banner.repository.js";

export class UnitOfWork implements IUnitOfWork {
  private queryRunner = AppDataSource.createQueryRunner();
  private _instances: Map<string, any> = new Map();

  constructor() {}

  private getRepo<T>(
    key: string,
    RepoClass: any,
    entity: any,
    extraParam?: any,
  ): T {
    const isTransaction = this.queryRunner.isTransactionActive;
    const manager = isTransaction
      ? this.queryRunner.manager
      : AppDataSource.manager;

    if (isTransaction) {
      return extraParam
        ? new RepoClass(manager.getRepository(entity), extraParam)
        : new RepoClass(manager.getRepository(entity));
    }

    if (!this._instances.has(key)) {
      const repoInstance = extraParam
        ? new RepoClass(manager.getRepository(entity), extraParam)
        : new RepoClass(manager.getRepository(entity));
      this._instances.set(key, repoInstance);
    }
    return this._instances.get(key);
  }

  get authorRepository() {
    return this.getRepo<IAuthorRepository>("author", AuthorRepository, Author);
  }
  get categoryRepository() {
    return this.getRepo<ICategoryRepository>(
      "category",
      CategoryRepository,
      Category,
    );
  }

  get readingStatsRepository() {
    return this.getRepo<IReadingStatsRepository>(
      "readingStats",
      ReadingStatsRepository,
      ReadingStats,
    );
  }

  get personalNotificationRepository() {
    return this.getRepo<IPersonalNotificationRepository>(
      "personalNotification",
      PersonalNotificationRepository,
      PersonalNotification,
    );
  }

  get globalNotificationRepository() {
    return this.getRepo<IGlobalNotificationRepository>(
      "globalNotification",
      GlobalNotificationRepository,
      GlobalNotification,
    );
  }

  get userDeviceRepository() {
    return this.getRepo<IUserDeviceRepository>(
      "userDevice",
      UserDeviceRepository,
      UserDevice,
    );
  }

  get userFollowRepository() {
    return this.getRepo<IUserFollowRepository>(
      "userFollow",
      UserFollowRepository,
      UserFollow,
    );
  }

  get passwordResetRepository() {
    return this.getRepo<IPasswordResetRepository>(
      "passwordReset",
      PasswordResetRepository,
      PasswordReset,
    );
  }

  get feedbackSubmissionRepository() {
    return this.getRepo<IFeedbackSubmissionRepository>(
      "feedbackSubmission",
      FeedbackSubmissionRepository,
      FeedbackSubmission,
    );
  }

  get bannerRepository() {
    return this.getRepo<IBannerRepository>("banner", BannerRepository, Banner);
  }

  get chapterRepository() {
    return this.getRepo<IChapterRepository>(
      "chapter",
      ChapterRepository,
      Chapter,
    );
  }
  get chapterCommentRepository() {
    return this.getRepo<IChapterCommentRepository>(
      "chapterComment",
      ChapterCommentRepository,
      ChapterComment,
    );
  }
  get chapterCommentLikeRepository() {
    return this.getRepo<IChapterCommentLikeRepository>(
      "chapterCommentLike",
      ChapterCommentLikeRepository,
      ChapterCommentLike,
    );
  }
  get novelRepository() {
    return this.getRepo<INovelRepository>("novel", NovelRepository, Novel);
  }
  get chapterPublicationRepository() {
    return this.getRepo<IChapterPublicationRepository>(
      "pub",
      ChapterPublicationRepository,
      ChapterPublication,
      this.novelRepository,
    );
  }
  get commentRepository() {
    return this.getRepo<ICommentRepository>(
      "comment",
      CommentRepository,
      Comment,
    );
  }
  get commentLikeRepository() {
    return this.getRepo<ICommentLikeRepository>(
      "Like",
      CommentLikeRepository,
      CommentLike,
    );
  }
  get libraryRepository() {
    return this.getRepo<ILibraryRepository>("lib", LibraryRepository, Library);
  }
  get novelDailyStatsRepository() {
    return this.getRepo<INovelDailyStatsRepository>(
      "stats",
      NovelDailyStatsRepository,
      NovelDailyStats,
    );
  }
  get replyRepository() {
    return this.getRepo<IReplyRepository>("reply", ReplyRepository, Reply);
  }
  get replyLikeRepository() {
    return this.getRepo<IReplyLikeRepository>(
      "rLike",
      ReplyLikeRepository,
      ReplyLike,
    );
  }
  get tagRepository() {
    return this.getRepo<ITagRepository>("tag", TagRepository, Tags);
  }
  get userRepository() {
    return this.getRepo<IUserRepository>("user", UserRepository, User);
  }
  get userVerificationRepository() {
    return this.getRepo<IUserVerificationRepository>(
      "verify",
      UserVerificationRepository,
      UserVerification,
    );
  }
  get volumeRepository() {
    return this.getRepo<IVolumeRepository>("volume", VolumeRepository, Volume);
  }

  async startTransaction() {
    if (this.queryRunner.isReleased) {
      this.queryRunner = AppDataSource.createQueryRunner();
    }
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();
  }

  async commit() {
    await this.queryRunner.commitTransaction();
    await this.release();
  }

  async rollback() {
    await this.queryRunner.rollbackTransaction();
    await this.release();
  }

  async release() {
    if (!this.queryRunner.isReleased) {
      await this.queryRunner.release();
    }
  }
}
