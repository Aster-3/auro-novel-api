import { IAuthorRepository } from "../interfaces/author.repo.interface.js";
import { IChapterRepository } from "../interfaces/chapter.repo.interface.js";
import { ICategoryRepository } from "../interfaces/categories.repo.interface.js";
import { INovelRepository } from "../interfaces/novel.repo.interface.js";
import { IChapterPublicationRepository } from "../interfaces/chapter.publication.repo.interface.js";
import { IChapterPurchaseRepository } from "../interfaces/chapter.purchase.repo.interface.js";
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
  ChapterPublication,
  ChapterPurchase,
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
  ReaderWallet,
  ReaderWalletTransaction,
  AppConfig,
  AuthorWallet,
  AuthorWalletTransaction,
  AuthorEarning,
  PlatformEarning,
  PlatformFinance,
  PlatformWithdrawal,
  ReadingStats,
  PersonalNotification,
  GlobalNotification,
} from "../entities/_index.js";

import { AppDataSource } from "../database/data-source.js";

import { AuthorRepository } from "../repositories/author.repository.js";
import { CategoryRepository } from "../repositories/category.repository.js";
import { ChapterPublicationRepository } from "../repositories/chapter.publication.repository.js";
import { ChapterPurchaseRepository } from "../repositories/chapter.purchase.repository.js";
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
import { IReaderWalletRepository } from "../interfaces/reader.wallet.repository.interface.js";
import { ReaderWalletRepository } from "../repositories/reader.wallet.repository.js";
import { IReaderWalletTransactionRepository } from "../interfaces/reader.wallet.transaction.repo.interface.js";
import { ReaderWalletTransactionRepository } from "../repositories/reader.wallet.transaction.repository.js";
import { AppConfigRepository } from "../repositories/app.config.repository.js";
import { IAppConfigRepository } from "../interfaces/app.config.repository.interface.js";
import { AuthorWalletRepository } from "../repositories/author.wallet.repository.js";
import { IAuthorWalletRepository } from "../interfaces/author.wallet.repo.interface.js";
import { AuthorWalletTransactionRepository } from "../repositories/author.wallet.transaction.repository.js";
import { IAuthorWalletTransactionRepository } from "../interfaces/author.wallet.transaction.repo.interface.js";
import { IAuthorEarningRepository } from "../interfaces/author.earning.repo.interface.js";
import { AuthorEarningRepository } from "../repositories/author.earning.repository.js";
import { IPlatformEarningRepository } from "../interfaces/platform.earning.repo.interface.js";
import { PlatformEarningRepository } from "../repositories/platform.earning.repository.js";
import { PlatformFinanceRepository } from "../repositories/platform.finance.repository.js";
import { IPlatformFinanceRepository } from "../interfaces/platform.finance.repo.interface.js";
import { PlatformWithdrawalRepository } from "../repositories/platform.withdrawal.repo..js";
import { IPlatformWithdrawalRepository } from "../interfaces/platform.withdrawal.repo.interface.js";
import { IReadingStatsRepository } from "../interfaces/reading.stats.repository.interface.js";
import { ReadingStatsRepository } from "../repositories/reading.stats.repository.js";
import { IPersonalNotificationRepository } from "../interfaces/personal.notification.repo.interface.js";
import { PersonalNotificationRepository } from "../repositories/personal.notification.repository.js";
import { GlobalNotificationRepository } from "../repositories/global.notification.repository.js";
import { IGlobalNotificationRepository } from "../interfaces/global.notification.repo.interface.js";

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

  get appConfigRepository() {
    return this.getRepo<IAppConfigRepository>(
      "appConfig",
      AppConfigRepository,
      AppConfig,
    );
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

  get authorWalletRepository() {
    return this.getRepo<IAuthorWalletRepository>(
      "authorWallet",
      AuthorWalletRepository,
      AuthorWallet,
    );
  }

  get authorWalletTransactionRepository() {
    return this.getRepo<IAuthorWalletTransactionRepository>(
      "authorWalletTransaction",
      AuthorWalletTransactionRepository,
      AuthorWalletTransaction,
    );
  }

  get authorEarningRepository() {
    return this.getRepo<IAuthorEarningRepository>(
      "authorEarning",
      AuthorEarningRepository,
      AuthorEarning,
    );
  }

  get platformEarningRepository() {
    return this.getRepo<IPlatformEarningRepository>(
      "platformEarning",
      PlatformEarningRepository,
      PlatformEarning,
    );
  }

  get platformFinanceRepository() {
    return this.getRepo<IPlatformFinanceRepository>(
      "platformFinance",
      PlatformFinanceRepository,
      PlatformFinance,
    );
  }

  get platformWithdrawalRepository() {
    return this.getRepo<IPlatformWithdrawalRepository>(
      "platformWithdrawal",
      PlatformWithdrawalRepository,
      PlatformWithdrawal,
    );
  }

  get chapterRepository() {
    return this.getRepo<IChapterRepository>(
      "chapter",
      ChapterRepository,
      Chapter,
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
  get chapterPurchaseRepository() {
    return this.getRepo<IChapterPurchaseRepository>(
      "purchase",
      ChapterPurchaseRepository,
      ChapterPurchase,
      AppDataSource,
    );
  }

  get readerWalletRepository() {
    return this.getRepo<IReaderWalletRepository>(
      "readerWallet",
      ReaderWalletRepository,
      ReaderWallet,
      AppDataSource,
    );
  }

  get readerWalletTransactionRepository() {
    return this.getRepo<IReaderWalletTransactionRepository>(
      "readerWalletTransaction",
      ReaderWalletTransactionRepository,
      ReaderWalletTransaction,
      AppDataSource,
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
