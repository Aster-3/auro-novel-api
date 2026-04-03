import { UnitOfWork } from "./unit-of-work/unit.of.work.js";
import { AuthController } from "./controllers/auth.controller.js";
import { AuthorController } from "./controllers/author.controller.js";
import { CategoryController } from "./controllers/category.controller.js";
import { ChapterController } from "./controllers/chapter.controller.js";
import { ChapterPurchaseController } from "./controllers/chapter.purchase.controller.js";
import { CommentController } from "./controllers/comment.controller.js";
import { LibraryController } from "./controllers/library.controller.js";
import { CommentService } from "./services/comment.service.js";
import { NovelController } from "./controllers/novel.controller.js";
import { NovelDailyStatsController } from "./controllers/novel.daily.stats.controller.js";
import { ReplyController } from "./controllers/reply.controller.js";
import { TagController } from "./controllers/tag.controller.js";
import { UserController } from "./controllers/user.controller.js";
import { VolumeController } from "./controllers/volume.controller.js";
import { AuthorService } from "./services/author.service.js";
import { CategoryService } from "./services/category.service.js";
import { ChapterService } from "./services/chapter.service.js";
import { ChapterPurchaseService } from "./services/create.chapter.purchase.service.js";
import { LibraryService } from "./services/library.service.js";
import { MailService } from "./services/mail.service.js";
import { NovelDailyStatsService } from "./services/novel.daily.stats.service.js";
import { NovelService } from "./services/novel.service.js";
import { ReplyService } from "./services/reply.service.js";
import { TagService } from "./services/tag.service.js";
import { TokenService } from "./services/token.service.js";
import { UserService } from "./services/user.service.js";
import { VolumeService } from "./services/volume.service.js";

const uow = new UnitOfWork();

const mailService = new MailService();
const tokenService = new TokenService();

const authorService = new AuthorService(
  uow.authorRepository,
  uow.userRepository,
);
const categoryService = new CategoryService(uow.categoryRepository);
const chapterService = new ChapterService(uow);
const chapterPurchaseService = new ChapterPurchaseService(
  uow.chapterPurchaseRepository,
  uow.userRepository,
  uow.chapterRepository,
);
const commentService = new CommentService(
  uow.commentRepository,
  uow.replyRepository,
  uow.novelRepository,
  uow.commentLikeRepository,
);
const libraryService = new LibraryService(uow.libraryRepository);
const novelDailyStatsService = new NovelDailyStatsService(
  uow.novelDailyStatsRepository,
  uow.novelRepository,
);
const novelService = new NovelService(
  uow.novelRepository,
  uow.authorRepository,
);
const replyService = new ReplyService(
  uow.replyRepository,
  uow.replyLikeRepository,
);
const tagService = new TagService(uow.tagRepository);
const userService = new UserService(
  uow.userRepository,
  uow.userVerificationRepository,
  mailService,
  tokenService,
);
const volumeService = new VolumeService(uow.volumeRepository);

export const authController = new AuthController(userService);
export const authorController = new AuthorController(authorService);
export const categoryController = new CategoryController(categoryService);
export const chapterController = new ChapterController(chapterService);
export const chapterPurchaseController = new ChapterPurchaseController(
  chapterPurchaseService,
);
export const commentController = new CommentController(commentService);
export const libraryController = new LibraryController(libraryService);
export const novelDailyStatsController = new NovelDailyStatsController(
  novelDailyStatsService,
);
export const replyController = new ReplyController(replyService);
export const tagController = new TagController(tagService);
export const userController = new UserController(userService);
export const volumeController = new VolumeController(volumeService);

export const novelController = new NovelController(
  novelService,
  commentService,
  chapterService,
);
