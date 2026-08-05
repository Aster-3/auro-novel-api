import { IAdminService } from "../interfaces/admin.service.interface.js";
import { CreateGlobalNotificationDto } from "../interfaces/global.notification.repo.interface.js";
import { UnitOfWork } from "../unit-of-work/unit.of.work.js";
import { MoreThanOrEqual, Not, IsNull } from "typeorm";
import * as argon2 from "argon2";
import { NotFoundError } from "../errors/not.found.error.js";
import { ConflictError } from "../errors/conflict.error.js";
import { BadRequestError } from "../errors/bad.request.js";
import { AppDataSource } from "../database/data-source.js";
import {
  Author,
  Chapter,
  ChapterPublication,
  Comment,
  DeletedAccountRecovery,
  GlobalNotification,
  Novel,
  Reply,
  User,
  Volume,
} from "../entities/_index.js";
import { SeriesStatus } from "../constants/series.constants.js";
import { UserRoles, UserStatus } from "../constants/user.constants.js";
import {
  AdminListChaptersDto,
  AdminListCommentsDto,
  AdminListDeletedAccountRecoveriesDto,
  AdminListNotificationsDto,
  AdminListNovelsDto,
  AdminListRepliesDto,
  AdminListUsersDto,
  AdminRestoreDeletedUserDto,
  AdminSearchDeletedAccountRecoveryDto,
  AdminCreateAuthorDto,
  AdminCreateChapterDto,
  AdminCreateNovelDto,
  AdminCreateVolumeDto,
  AdminPublishChapterDto,
  AdminUpdateChapterDto,
  AdminUpdateNotificationDto,
  AdminUpdateNovelDto,
  AdminUpdateUserDto,
} from "../schemas/admin.schema.js";
import {
  PushDispatchResult,
  PushNotificationService,
} from "./push.notification.service.js";
import { wordCounter } from "../utils/wordCounter.js";
import { uploadToS3 } from "./s3.service.js";
import { isPremiumActive, withPremiumStatus } from "../utils/premium.status.js";
import { createAccountRecoveryHash } from "../utils/account.recovery.hash.js";

export class AdminService implements IAdminService {
  constructor(
    private uow: UnitOfWork,
    private pushNotificationService: PushNotificationService,
  ) {}

  private paginate<T>(items: T[], total: number, page: number, limit: number) {
    const lastPage = Math.ceil(total / limit);
    return {
      items,
      total,
      currentPage: page,
      nextPage: page < lastPage ? page + 1 : null,
      lastPage,
    };
  }

  async getDashboard() {
    const userRepo = AppDataSource.getRepository(User);
    const novelRepo = AppDataSource.getRepository(Novel);
    const chapterRepo = AppDataSource.getRepository(Chapter);
    const commentRepo = AppDataSource.getRepository(Comment);
    const replyRepo = AppDataSource.getRepository(Reply);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      registeredLast30Days,
      activeUsers,
      bannedUsers,
      deletedUsers,
      premiumUsers,
      totalNovels,
      publishedNovels,
      draftNovels,
      bannedNovels,
      totalChapters,
      publishedChapters,
      totalComments,
      totalReplies,
      recentUsers,
      recentNovels,
      recentComments,
    ] = await Promise.all([
      userRepo.count(),
      userRepo.count({
        where: { createdAt: MoreThanOrEqual(thirtyDaysAgo) },
      }),
      userRepo.count({ where: { status: UserStatus.ACTIVE } }),
      userRepo.count({ where: { status: UserStatus.BANNED } }),
      userRepo.count({ where: { status: UserStatus.DELETED } }),
      userRepo.count({
        where: {
          premiumUntil: MoreThanOrEqual(new Date()),
          subscriptionTier: Not(IsNull()),
        },
      }),
      novelRepo.count(),
      novelRepo.count({ where: { status: SeriesStatus.ONGOING } }),
      novelRepo.count({ where: { status: SeriesStatus.DRAFT } }),
      novelRepo
        .createQueryBuilder("novel")
        .where('novel."bannedUntil" > NOW()')
        .getCount(),
      chapterRepo.count(),
      AppDataSource.getRepository(ChapterPublication).count(),
      commentRepo.count(),
      replyRepo.count(),
      userRepo.find({
        select: {
          id: true,
          username: true,
          nickname: true,
          email: true,
          profileImageUrl: true,
          role: true,
          status: true,
          createdAt: true,
        },
        order: { createdAt: "DESC" },
        take: 5,
      }),
      novelRepo.find({
        select: {
          id: true,
          name: true,
          coverImage: true,
          status: true,
          bannedUntil: true,
          banReason: true,
          createdAt: true,
        },
        order: { createdAt: "DESC" },
        take: 5,
      }),
      commentRepo.find({
        select: {
          id: true,
          content: true,
          isRecommend: true,
          createdAt: true,
          user: { id: true, nickname: true },
          novel: { id: true, name: true },
        },
        relations: { user: true, novel: true },
        order: { createdAt: "DESC" },
        take: 5,
      }),
    ]);

    return {
      stats: {
        users: {
          total: totalUsers,
          registeredLast30Days,
          active: activeUsers,
          banned: bannedUsers,
          deleted: deletedUsers,
          premium: premiumUsers,
        },
        novels: {
          total: totalNovels,
          ongoing: publishedNovels,
          draft: draftNovels,
          banned: bannedNovels,
        },
        chapters: {
          total: totalChapters,
          published: publishedChapters,
        },
        community: {
          comments: totalComments,
          replies: totalReplies,
        },
      },
      recent: {
        users: recentUsers,
        novels: recentNovels,
        comments: recentComments,
      },
    };
  }

  async createIndependentAuthor(dto: AdminCreateAuthorDto) {
    const author = AppDataSource.getRepository(Author).create({
      nickname: dto.nickname,
      isVerified: dto.isVerified,
      userId: undefined,
    });

    return await AppDataSource.getRepository(Author).save(author);
  }

  async getDeletedAccountRecoveries(
    dto: AdminListDeletedAccountRecoveriesDto,
  ) {
    const { page, limit, sort } = dto;
    const [items, total] = await AppDataSource.getRepository(
      DeletedAccountRecovery,
    ).findAndCount({
      order: { createdAt: sort.toUpperCase() as "ASC" | "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return this.paginate(items, total, page, limit);
  }

  async searchDeletedAccountRecovery(
    dto: AdminSearchDeletedAccountRecoveryDto,
  ) {
    const where: Partial<DeletedAccountRecovery> = {};

    if (dto.email) {
      where.emailHash = createAccountRecoveryHash(dto.email);
    }

    if (dto.username) {
      where.usernameHash = createAccountRecoveryHash(dto.username);
    }

    const item = await AppDataSource.getRepository(
      DeletedAccountRecovery,
    ).findOne({
      where,
      order: { createdAt: "DESC" },
    });

    return { item, matched: Boolean(item) };
  }

  async restoreDeletedUser(dto: AdminRestoreDeletedUserDto) {
    const userRepo = AppDataSource.getRepository(User);
    const recoveryRepo = AppDataSource.getRepository(DeletedAccountRecovery);
    const emailHash = createAccountRecoveryHash(dto.email);

    const user = await userRepo
      .createQueryBuilder("user")
      .withDeleted()
      .where("user.id = :id", { id: dto.id })
      .getOne();

    if (!user) {
      throw new NotFoundError("Kullanici bulunamadi.");
    }

    if (user.status !== UserStatus.DELETED || !user.deletedAt) {
      throw new BadRequestError("Kullanici silinmis durumda degil.");
    }

    const recovery = await recoveryRepo.findOne({
      where: {
        userId: dto.id,
        emailHash,
      },
      order: { createdAt: "DESC" },
    });

    if (!recovery) {
      throw new NotFoundError("Kurtarma kaydi bulunamadi.");
    }

    if (recovery.expiresAt <= new Date()) {
      throw new BadRequestError("Kurtarma kaydinin suresi dolmus.");
    }

    const emailOwner = await userRepo
      .createQueryBuilder("user")
      .withDeleted()
      .where("LOWER(user.email) = LOWER(:email)", { email: dto.email })
      .andWhere("user.id != :id", { id: dto.id })
      .getOne();

    if (emailOwner) {
      throw new ConflictError("email", "Bu email baska bir kullaniciya ait.");
    }

    const hashedPassword = await argon2.hash(dto.password);

    await AppDataSource.transaction(async (manager) => {
      await manager.update(
        User,
        { id: dto.id },
        {
          email: dto.email,
          password: hashedPassword,
          status: UserStatus.ACTIVE,
          refreshToken: null,
        },
      );
      await manager.restore(User, { id: dto.id });
      await manager.delete(DeletedAccountRecovery, { id: recovery.id });
    });

    return this.getUserById(dto.id);
  }

  async getUsers(dto: AdminListUsersDto) {
    const { page, limit, sort, search, role, status, isVerified, includeDeleted } =
      dto;
    const query = AppDataSource.getRepository(User)
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.authorProfile", "author")
      .loadRelationCountAndMap("user.novelCount", "author.novels")
      .loadRelationCountAndMap("user.commentCount", "user.comments");

    if (includeDeleted || status === UserStatus.DELETED) {
      query.withDeleted();
    }

    if (search) {
      query.andWhere(
        "(user.username ILIKE :search OR user.nickname ILIKE :search OR user.email ILIKE :search)",
        { search: `%${search}%` },
      );
    }
    if (role) query.andWhere("user.role = :role", { role });
    if (status) query.andWhere("user.status = :status", { status });
    if (isVerified !== undefined) {
      query.andWhere("user.isVerified = :isVerified", { isVerified });
    }

    query
      .orderBy("user.createdAt", sort.toUpperCase() as "ASC" | "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await query.getManyAndCount();
    return this.paginate(items.map(withPremiumStatus), total, page, limit);
  }

  async getUserById(id: string) {
    const user = await AppDataSource.getRepository(User)
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.authorProfile", "author")
      .loadRelationCountAndMap("user.novelCount", "author.novels")
      .loadRelationCountAndMap("user.commentCount", "user.comments")
      .loadRelationCountAndMap("user.replyCount", "user.replies")
      .loadRelationCountAndMap("user.libraryCount", "user.library")
      .where("user.id = :id", { id })
      .getOne();

    if (!user) throw new NotFoundError("Kullanici bulunamadi.");

    const { authorProfile, ...userData } = user;

    return {
      ...userData,
      isPremium: isPremiumActive(userData.premiumUntil),
      isAuthor: Boolean(authorProfile),
      ...(authorProfile
        ? {
            authorId: authorProfile.id,
            authorIsVerified: authorProfile.isVerified,
          }
        : {}),
    };
  }

  async updateUser(id: string, dto: AdminUpdateUserDto) {
    const repo = AppDataSource.getRepository(User);
    const result = await repo.update(id, dto);
    if (!result.affected) throw new NotFoundError("Kullanici bulunamadi.");
    return this.getUserById(id);
  }

  async deleteUser(id: string) {
    const exists = await AppDataSource.getRepository(User).exists({
      where: { id },
    });
    if (!exists) throw new NotFoundError("Kullanici bulunamadi.");

    await this.uow.userRepository.softDeleteUser(id);
  }

  async createNovel(dto: AdminCreateNovelDto, file?: Express.Multer.File) {
    const author = await AppDataSource.getRepository(Author).findOne({
      where: { id: dto.authorId },
      select: { id: true, nickname: true, userId: true },
    });

    if (!author) {
      throw new NotFoundError("Yazar bulunamadi.");
    }

    const slugTaken = await AppDataSource.getRepository(Novel).exists({
      where: { slug: dto.slug },
    });
    if (slugTaken) {
      throw new ConflictError("slug", "Bu slug zaten kullanimda.");
    }

    const coverImage = file ? await uploadToS3(file, "novel-covers") : null;
    const novel = await this.uow.novelRepository.create({
      ...dto,
      coverImage: coverImage ?? undefined,
      authorId: author.id,
    });

    return this.getNovelById(novel.id);
  }

  async getNovels(dto: AdminListNovelsDto) {
    const {
      page,
      limit,
      sort,
      search,
      authorId,
      status,
      type,
      isBanned,
      isAdultContent,
    } = dto;
    const query = AppDataSource.getRepository(Novel)
      .createQueryBuilder("novel")
      .leftJoinAndSelect("novel.author", "author")
      .leftJoinAndSelect("author.user", "authorUser")
      .loadRelationCountAndMap("novel.commentCount", "novel.comments");

    if (search) {
      query.andWhere("(novel.name ILIKE :search OR novel.slug ILIKE :search)", {
        search: `%${search}%`,
      });
    }
    if (authorId) query.andWhere("novel.authorId = :authorId", { authorId });
    if (status) query.andWhere("novel.status = :status", { status });
    if (type) {
      query.andWhere("novel.type = :type", { type });
    }
    if (isBanned === true) {
      query.andWhere('novel."bannedUntil" > NOW()');
    } else if (isBanned === false) {
      query.andWhere(
        '(novel."bannedUntil" IS NULL OR novel."bannedUntil" <= NOW())',
      );
    }
    if (isAdultContent !== undefined) {
      query.andWhere("novel.isAdultContent = :isAdultContent", {
        isAdultContent,
      });
    }

    query
      .orderBy("novel.createdAt", sort.toUpperCase() as "ASC" | "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await query.getManyAndCount();
    return this.paginate(items, total, page, limit);
  }

  async getNovelById(id: string) {
    const novel = await AppDataSource.getRepository(Novel)
      .createQueryBuilder("novel")
      .leftJoinAndSelect("novel.author", "author")
      .leftJoinAndSelect("author.user", "authorUser")
      .leftJoinAndSelect("novel.categories", "categories")
      .leftJoinAndSelect("novel.tags", "tags")
      .loadRelationCountAndMap("novel.commentCount", "novel.comments")
      .loadRelationCountAndMap("novel.libraryEntryCount", "novel.library")
      .where("novel.id = :id", { id })
      .getOne();

    if (!novel) throw new NotFoundError("Roman bulunamadi.");
    return novel;
  }

  async updateNovel(
    id: string,
    dto: AdminUpdateNovelDto,
    file?: Express.Multer.File,
  ) {
    const updateData: AdminUpdateNovelDto & { coverImage?: string } = {
      ...dto,
    };

    if (file) {
      updateData.coverImage = await uploadToS3(file, "novel-covers");
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestError("En az bir alan gonderilmelidir.");
    }

    const result = await AppDataSource.getRepository(Novel).update(
      id,
      updateData,
    );
    if (!result.affected) throw new NotFoundError("Roman bulunamadi.");
    return this.getNovelById(id);
  }

  async deleteNovel(id: string) {
    const exists = await AppDataSource.getRepository(Novel).exists({
      where: { id },
    });
    if (!exists) throw new NotFoundError("Roman bulunamadi.");
    await this.uow.novelRepository.deleteNovel(id);
  }

  async updateNovelCategories(novelId: string, categoryIds: number[]) {
    const exists = await AppDataSource.getRepository(Novel).exists({
      where: { id: novelId },
    });
    if (!exists) throw new NotFoundError("Roman bulunamadi.");

    await this.uow.novelRepository.updateNovelCategories(novelId, categoryIds);
    return this.getNovelById(novelId);
  }

  async updateNovelTags(novelId: string, tagIds: string[]) {
    const exists = await AppDataSource.getRepository(Novel).exists({
      where: { id: novelId },
    });
    if (!exists) throw new NotFoundError("Roman bulunamadi.");

    await this.uow.novelRepository.updateNovelTags(novelId, tagIds);
    return this.getNovelById(novelId);
  }

  async getVolumesByNovelId(novelId: string) {
    const novelExists = await AppDataSource.getRepository(Novel).exists({
      where: { id: novelId },
    });
    if (!novelExists) throw new NotFoundError("Roman bulunamadi.");

    return await this.uow.volumeRepository.getVolumeByNovelId(novelId);
  }

  async createVolume(novelId: string, dto: AdminCreateVolumeDto) {
    const novelExists = await AppDataSource.getRepository(Novel).exists({
      where: { id: novelId },
    });
    if (!novelExists) throw new NotFoundError("Roman bulunamadi.");

    const lastVolume = await this.uow.volumeRepository.getLastVolume(novelId);
    const currentMaxInteger = Math.floor(lastVolume?.orderIndex ?? 0);
    const orderIndex = dto.orderIndex ?? currentMaxInteger + 1;

    if (orderIndex > currentMaxInteger + 1) {
      throw new ConflictError(
        "orderIndex",
        `Siradaki cilt en fazla ${currentMaxInteger + 1} olabilir.`,
      );
    }

    const exists = await this.uow.volumeRepository.duplicateControl(
      novelId,
      orderIndex,
    );
    if (exists) {
      throw new ConflictError(
        "orderIndex",
        `${orderIndex} numarali cilt zaten mevcut.`,
      );
    }

    const id = await this.uow.volumeRepository.create({
      novelId,
      orderIndex,
      name: dto.name ?? null,
    });

    return AppDataSource.getRepository(Volume).findOne({ where: { id } });
  }

  async updateVolume(volumeId: string, name: string | null) {
    const volume = await this.uow.volumeRepository.getOneById(volumeId);
    if (!volume) {
      throw new NotFoundError("Cilt bulunamadi.");
    }

    await this.uow.volumeRepository.update(volumeId, name);
    return AppDataSource.getRepository(Volume).findOne({
      where: { id: volumeId },
    });
  }

  async deleteVolume(volumeId: string) {
    const volume = await this.uow.volumeRepository.getOneById(volumeId);
    if (!volume) {
      throw new NotFoundError("Cilt bulunamadi.");
    }

    const isEmpty = await this.uow.volumeRepository.isVolumeEmpty(volumeId);
    if (!isEmpty) {
      throw new ConflictError(
        "volume_not_empty",
        "Bu cilt bos degil, silmeden once icindeki bolumleri silmeniz gerekiyor.",
      );
    }

    await this.uow.volumeRepository.deleteAndCloseGap(
      volumeId,
      volume.novelId,
      volume.orderIndex,
    );
  }

  async createChapter(novelId: string, dto: AdminCreateChapterDto) {
    const novelExists = await AppDataSource.getRepository(Novel).exists({
      where: { id: novelId },
    });
    if (!novelExists) throw new NotFoundError("Roman bulunamadi.");

    const chapter = AppDataSource.getRepository(Chapter).create({
      novelId,
      title: dto.title,
      content: dto.content,
      wordCount: wordCounter(dto.content),
    });

    return await AppDataSource.getRepository(Chapter).save(chapter);
  }

  async publishChapter(chapterId: string, dto: AdminPublishChapterDto) {
    const chapter = await AppDataSource.getRepository(Chapter).findOne({
      where: { id: chapterId },
      select: { id: true, novelId: true },
    });

    if (!chapter) throw new NotFoundError("Bolum bulunamadi.");

    if (chapter.novelId !== dto.novelId) {
      throw new ConflictError("novelId", "Bolum bu romana ait degil.");
    }

    const alreadyPublished = await AppDataSource.getRepository(
      ChapterPublication,
    ).exists({ where: { chapterId } });

    if (alreadyPublished) {
      throw new ConflictError("chapterId", "Bolum zaten yayinlanmis.");
    }

    let volumeId = dto.volumeId;
    if (!volumeId) {
      const suggestedVolume =
        await this.uow.volumeRepository.findOldestEmptyOrLatestVolume(
          dto.novelId,
        );
      if (!suggestedVolume) {
        throw new ConflictError(
          "volumeId",
          "Bolum yayinlamak icin en az bir cilt olusturmalisiniz.",
        );
      }
      volumeId = suggestedVolume.id;
    }

    const volume = await this.uow.volumeRepository.getOneById(volumeId);
    if (!volume || volume.novelId !== dto.novelId) {
      throw new ConflictError("volumeId", "Gecersiz cilt ID.");
    }

    const hasEmptyPrevious =
      await this.uow.volumeRepository.hasAnyEmptyPreviousVolume(
        dto.novelId,
        volume.orderIndex,
      );

    if (hasEmptyPrevious) {
      throw new ConflictError(
        "volumeId",
        "Ilk bos cilt atlanamaz. Lutfen onceki ciltleri doldurun.",
      );
    }

    const lastSortKey =
      await this.uow.chapterPublicationRepository.getLastSortKeyInVolume(
        volumeId,
      );

    await this.uow.startTransaction();
    try {
      await this.uow.chapterPublicationRepository.create({
        chapterId,
        volumeId,
        sortKey: lastSortKey + 1000,
        publishedAt: new Date(),
      });
      await this.uow.novelRepository.refreshChapterStats(dto.novelId);
      await this.uow.commit();
    } catch (error) {
      await this.uow.rollback();
      throw error;
    } finally {
      await this.uow.release();
    }

    return this.getChapterById(chapterId);
  }

  async getChapters(dto: AdminListChaptersDto) {
    const {
      page,
      limit,
      sort,
      search,
      novelId,
      hasPublication,
    } = dto;
    const query = AppDataSource.getRepository(Chapter)
      .createQueryBuilder("chapter")
      .leftJoinAndSelect("chapter.novel", "novel")
      .leftJoinAndSelect("novel.author", "author")
      .leftJoinAndSelect("author.user", "authorUser")
      .leftJoinAndSelect("chapter.publication", "publication")
      .leftJoinAndSelect("publication.volume", "volume");

    if (search) {
      query.andWhere("chapter.title ILIKE :search", { search: `%${search}%` });
    }
    if (novelId) query.andWhere("chapter.novelId = :novelId", { novelId });
    if (hasPublication === true) {
      query.andWhere("publication.chapterId IS NOT NULL");
    } else if (hasPublication === false) {
      query.andWhere("publication.chapterId IS NULL");
    }

    query
      .orderBy("chapter.createdAt", sort.toUpperCase() as "ASC" | "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await query.getManyAndCount();
    return this.paginate(items, total, page, limit);
  }

  async getChapterById(id: string) {
    const chapter = await AppDataSource.getRepository(Chapter)
      .createQueryBuilder("chapter")
      .leftJoinAndSelect("chapter.novel", "novel")
      .leftJoinAndSelect("novel.author", "author")
      .leftJoinAndSelect("author.user", "authorUser")
      .leftJoinAndSelect("chapter.publication", "publication")
      .leftJoinAndSelect("publication.volume", "volume")
      .where("chapter.id = :id", { id })
      .getOne();

    if (!chapter) throw new NotFoundError("Bolum bulunamadi.");
    return chapter;
  }

  async updateChapter(id: string, dto: AdminUpdateChapterDto) {
    const chapter = dto.content !== undefined
      ? await AppDataSource.getRepository(Chapter).findOne({
          where: { id },
          select: { id: true, novelId: true },
        })
      : null;

    const result = await AppDataSource.getRepository(Chapter).update(id, {
      ...dto,
      ...(dto.content !== undefined
        ? { wordCount: wordCounter(dto.content) }
        : {}),
    });
    if (!result.affected) throw new NotFoundError("Bolum bulunamadi.");

    if (chapter && dto.content !== undefined) {
      const isPublished = await AppDataSource.getRepository(
        ChapterPublication,
      ).exists({ where: { chapterId: id } });

      if (isPublished) {
        await this.uow.novelRepository.refreshChapterStats(chapter.novelId);
      }
    }

    return this.getChapterById(id);
  }

  async deleteChapter(id: string) {
    const chapter = await AppDataSource.getRepository(Chapter).findOne({
      where: { id },
      select: { id: true, novelId: true },
    });
    if (!chapter) throw new NotFoundError("Bolum bulunamadi.");

    const publicationMeta =
      await this.uow.chapterPublicationRepository.getChapterForMeta(id);

    if (publicationMeta) {
      const hasOtherChaptersInVolume =
        await this.uow.chapterPublicationRepository.otherChaptersExistInVolume(
          id,
          publicationMeta.volumeId,
        );

      if (!hasOtherChaptersInVolume) {
        const hasPopulatedVolumeAfter =
          await this.uow.volumeRepository.hasPopulatedVolumeAfter(
            publicationMeta.novelId,
            publicationMeta.volumeOrder,
          );

        if (hasPopulatedVolumeAfter) {
          throw new ConflictError(
            "chapterId",
            "Dolu ciltler arasinda bos cilt birakilamaz.",
          );
        }
      }
    }

    await this.uow.startTransaction();
    try {
      await this.uow.chapterRepository.deleteChapter(id);
      await this.uow.novelRepository.refreshChapterStats(chapter.novelId);
      await this.uow.commit();
    } catch (error) {
      await this.uow.rollback();
      throw error;
    } finally {
      await this.uow.release();
    }
  }

  async getComments(dto: AdminListCommentsDto) {
    const { page, limit, sort, search, novelId, userId, isRecommend } = dto;
    const query = AppDataSource.getRepository(Comment)
      .createQueryBuilder("comment")
      .leftJoinAndSelect("comment.user", "user")
      .leftJoinAndSelect("comment.novel", "novel");

    if (search) {
      query.andWhere("comment.content ILIKE :search", {
        search: `%${search}%`,
      });
    }
    if (novelId) query.andWhere("comment.novelId = :novelId", { novelId });
    if (userId) query.andWhere("comment.userId = :userId", { userId });
    if (isRecommend !== undefined) {
      query.andWhere("comment.isRecommend = :isRecommend", { isRecommend });
    }

    query
      .orderBy("comment.createdAt", sort.toUpperCase() as "ASC" | "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await query.getManyAndCount();
    return this.paginate(items, total, page, limit);
  }

  async deleteComment(id: number) {
    await this.uow.commentRepository.delete(id);
  }

  async getReplies(dto: AdminListRepliesDto) {
    const {
      page,
      limit,
      sort,
      search,
      userId,
      rootCommentId,
      includeDeleted,
    } = dto;
    const query = AppDataSource.getRepository(Reply)
      .createQueryBuilder("reply")
      .leftJoinAndSelect("reply.user", "user")
      .leftJoinAndSelect("reply.comment", "comment")
      .leftJoinAndSelect("comment.novel", "novel")
      .leftJoinAndSelect("reply.parentReply", "parentReply");

    if (includeDeleted) query.withDeleted();
    if (search) {
      query.andWhere("reply.content ILIKE :search", { search: `%${search}%` });
    }
    if (userId) query.andWhere("reply.userId = :userId", { userId });
    if (rootCommentId) {
      query.andWhere("reply.rootCommentId = :rootCommentId", {
        rootCommentId,
      });
    }

    query
      .orderBy("reply.createdAt", sort.toUpperCase() as "ASC" | "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await query.getManyAndCount();
    return this.paginate(items, total, page, limit);
  }

  async deleteReply(id: number) {
    await this.uow.replyRepository.delete(id);
  }

  async getAnnouncements(dto: AdminListNotificationsDto) {
    const { page, limit, sort, search, isPublished } = dto;
    const query = AppDataSource.getRepository(GlobalNotification)
      .createQueryBuilder("notification")
      .orderBy("notification.createdAt", sort.toUpperCase() as "ASC" | "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      query.andWhere(
        "(notification.title ILIKE :search OR notification.summary ILIKE :search OR notification.content ILIKE :search)",
        { search: `%${search}%` },
      );
    }
    if (isPublished !== undefined) {
      query.andWhere("notification.isPublished = :isPublished", {
        isPublished,
      });
    }

    const [items, total] = await query.getManyAndCount();
    return this.paginate(items, total, page, limit);
  }

  async getAnnouncementById(id: string) {
    const notification = await AppDataSource.getRepository(
      GlobalNotification,
    ).findOne({ where: { id } });
    if (!notification) throw new NotFoundError("Duyuru bulunamadi.");
    return notification;
  }

  async createAnnouncement(dto: CreateGlobalNotificationDto) {
    const announcement =
      await this.uow.globalNotificationRepository.createGlobalNotification(
        dto,
      );

    let push: PushDispatchResult | null = null;
    const shouldSendPushNow =
      announcement.isPublished &&
      announcement.publishedAt &&
      announcement.publishedAt <= new Date();

    if (shouldSendPushNow) {
      try {
        push = await this.pushNotificationService.sendGlobal({
          title: announcement.title,
          body: announcement.summary,
          data: {
            notificationType: "global_notification",
            notificationId: announcement.id,
            targetUrl: announcement.targetUrl,
          },
        });
      } catch (error) {
        console.error("Global duyuru push gonderimi basarisiz:", error);
      }
    }

    return {
      item: announcement,
      push,
    };
  }

  async updateAnnouncement(id: string, dto: AdminUpdateNotificationDto) {
    const updateData = { ...dto };
    if (updateData.isPublished === true && updateData.publishedAt === undefined) {
      updateData.publishedAt = new Date();
    }

    const repo = AppDataSource.getRepository(GlobalNotification);
    const existing = await repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundError("Duyuru bulunamadi.");
    this.ensureAnnouncementHasAction({
      ...existing,
      ...updateData,
    });

    const result = await repo.update(id, updateData as any);
    if (!result.affected) throw new NotFoundError("Duyuru bulunamadi.");
    return this.getAnnouncementById(id);
  }

  async deleteAnnouncement(id: string) {
    const affectedRows =
      await this.uow.globalNotificationRepository.deleteNotification(id);

    if (affectedRows === 0) {
      throw new NotFoundError("Duyuru bulunamadi.");
    }
  }

  private ensureAnnouncementHasAction(notification: GlobalNotification) {
    if (!notification.content && !notification.targetUrl) {
      throw new BadRequestError(
        "Duyuru icin content veya targetUrl alanlarindan en az biri zorunludur.",
      );
    }
  }
}
