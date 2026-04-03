import { IAuthorRepository } from "./author.repo.interface.js";
import { ICategoryRepository } from "./categories.repo.interface.js";
import { IChapterPublicationRepository } from "./chapter.publication.repo.interface.js";
import { IChapterPurchaseRepository } from "./chapter.purchase.repo.interface.js";
import { IChapterRepository } from "./chapter.repo.interface.js";
import { ICommentLikeRepository } from "./comment.like.repo.interface.js";
import { ICommentRepository } from "./comment.repo.interface.js";
import { ILibraryRepository } from "./library.repo.interface.js";
import { INovelDailyStatsRepository } from "./novel.daily.stats.repo.interface.js";
import { INovelRepository } from "./novel.repo.interface.js";
import { IReplyLikeRepository } from "./reply.like.repo.interface.js";
import { IReplyRepository } from "./reply.repo.interface.js";
import { ITagRepository } from "./tag.repo.interface.js";
import { IUserRepository } from "./user.repo.interface.js";
import { IUserVerificationRepository } from "./user.verification.repo.interface.js";
import { IVolumeRepository } from "./volume.repo.interface.js";

export interface IUnitOfWork {
  authorRepository: IAuthorRepository;
  categoryRepository: ICategoryRepository;
  chapterRepository: IChapterRepository;
  chapterPublicationRepository: IChapterPublicationRepository;
  chapterPurchaseRepository: IChapterPurchaseRepository;
  commentRepository: ICommentRepository;
  commentLikeRepository: ICommentLikeRepository;
  libraryRepository: ILibraryRepository;
  novelRepository: INovelRepository;
  novelDailyStatsRepository: INovelDailyStatsRepository;
  replyRepository: IReplyRepository;
  replyLikeRepository: IReplyLikeRepository;
  tagRepository: ITagRepository;
  userRepository: IUserRepository;
  userVerificationRepository: IUserVerificationRepository;
  volumeRepository: IVolumeRepository;

  startTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  release(): Promise<void>;
}
