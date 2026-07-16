import { CreateGlobalNotificationDto } from "./global.notification.repo.interface.js";
import { GlobalNotification } from "../entities/GlobalNotification.js";
import { PushDispatchResult } from "../services/push.notification.service.js";
import { PublicationStatus } from "../constants/chapter.constants.js";
import {
  AdminListChaptersDto,
  AdminListCommentsDto,
  AdminListNotificationsDto,
  AdminListNovelsDto,
  AdminListRepliesDto,
  AdminListUsersDto,
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

export interface CreateAnnouncementResult {
  item: GlobalNotification;
  push: PushDispatchResult | null;
}

export interface IAdminService {
  getDashboard(): Promise<any>;
  createIndependentAuthor(dto: AdminCreateAuthorDto): Promise<any>;
  getUsers(dto: AdminListUsersDto): Promise<any>;
  getUserById(id: string): Promise<any>;
  updateUser(id: string, dto: AdminUpdateUserDto): Promise<any>;
  deleteUser(id: string): Promise<void>;
  createNovel(
    dto: AdminCreateNovelDto,
    file?: Express.Multer.File,
  ): Promise<any>;
  getNovels(dto: AdminListNovelsDto): Promise<any>;
  getNovelById(id: string): Promise<any>;
  updateNovel(id: string, dto: AdminUpdateNovelDto): Promise<any>;
  deleteNovel(id: string): Promise<void>;
  updateNovelCategories(novelId: string, categoryIds: number[]): Promise<any>;
  updateNovelTags(novelId: string, tagIds: string[]): Promise<any>;
  getVolumesByNovelId(novelId: string): Promise<any>;
  createVolume(novelId: string, dto: AdminCreateVolumeDto): Promise<any>;
  updateVolume(volumeId: string, name: string | null): Promise<any>;
  deleteVolume(volumeId: string): Promise<void>;
  createChapter(novelId: string, dto: AdminCreateChapterDto): Promise<any>;
  publishChapter(
    chapterId: string,
    dto: AdminPublishChapterDto,
  ): Promise<any>;
  getChapters(dto: AdminListChaptersDto): Promise<any>;
  getChapterById(id: string): Promise<any>;
  updateChapter(id: string, dto: AdminUpdateChapterDto): Promise<any>;
  updateChapterPublicationStatus(
    id: string,
    publicationStatus: PublicationStatus,
  ): Promise<void>;
  deleteChapter(id: string): Promise<void>;
  getComments(dto: AdminListCommentsDto): Promise<any>;
  deleteComment(id: number): Promise<void>;
  getReplies(dto: AdminListRepliesDto): Promise<any>;
  deleteReply(id: number): Promise<void>;
  getAnnouncements(dto: AdminListNotificationsDto): Promise<any>;
  getAnnouncementById(id: string): Promise<GlobalNotification>;
  createAnnouncement(
    dto: CreateGlobalNotificationDto,
  ): Promise<CreateAnnouncementResult>;
  updateAnnouncement(
    id: string,
    dto: AdminUpdateNotificationDto,
  ): Promise<GlobalNotification>;
  deleteAnnouncement(id: string): Promise<void>;
}
