import { Request, Response } from "express";
import { IUserService } from "../interfaces/user.service.interface.js";
import { deleteManyFromS3ByUrl, uploadToS3 } from "../services/s3.service.js";
import { ILibraryService } from "../interfaces/library.service.interface.js";
import { canShowAdultContent } from "../utils/adult.content.visibility.js";

export class UserController {
  constructor(
    private userService: IUserService,
    private libraryService: ILibraryService,
  ) {}

  getOneUser = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    const user = await this.userService.getUserProfile(id, req.user?.id);
    res.status(200).json(user);
  };

  getUserReviews = async (req: Request, res: Response) => {
    const { id: userId } = req.params as any;
    const reviews = await this.userService.getUserReviews(
      {
        userId,
        ...res.locals.validatedData,
      },
      req.user?.id,
    );
    res.status(200).json(reviews);
  };

  getUserReplies = async (req: Request, res: Response) => {
    const { id: userId } = req.params as any;
    const replies = await this.userService.getUserReplies(
      {
        userId,
        ...res.locals.validatedData,
      },
      req.user?.id,
    );
    res.status(200).json(replies);
  };

  getUserLibrary = async (req: Request, res: Response) => {
    const { id: userId } = req.params as any;
    const library = await this.userService.getUserLibrary(
      {
        userId,
        ...res.locals.validatedData,
      },
      canShowAdultContent(req.user),
      req.user?.id,
    );
    res.status(200).json(library);
  };

  getUserRecentActivity = async (req: Request, res: Response) => {
    const { id: userId } = req.params as any;
    const activity = await this.userService.getUserRecentActivity(
      userId,
      req.user?.id,
      canShowAdultContent(req.user),
    );
    res.status(200).json(activity);
  };

  deleteMyAccount = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const result = await this.userService.deleteMyAccount(userId, req.body);
    res.status(200).json(result);
  };

  getUsers = async (req: Request, res: Response) => {
    const users = await this.userService.searchUsers(
      res.locals.validatedData,
      req.user?.id,
    );
    res.status(200).json(users);
  };

  getAllVerifications = async (req: Request, res: Response) => {
    const verifications = await this.userService.getAllVerifications();
    res.status(200).json(verifications);
  };

  updateUser = async (req: Request, res: Response) => {
    const files =
      (req.files as { [fieldname: string]: Express.Multer.File[] } | undefined) ??
      {};
    const updateData = { ...req.body, id: req.user?.id };

    if (files.profileImageUrl) {
      const profileImageUrl = await uploadToS3(
        files.profileImageUrl[0],
        "avatars",
      );
      updateData.profileImageUrl = profileImageUrl;
    }

    if (files.profileBackgroundImageUrl) {
      const profileBackgroundImageUrl = await uploadToS3(
        files.profileBackgroundImageUrl[0],
        "covers",
      );

      updateData.profileBackgroundImageUrl = profileBackgroundImageUrl;
    }

    try {
      const updatedUser = await this.userService.updateUser(updateData);
      res.status(200).json(updatedUser);
    } catch (error) {
      await deleteManyFromS3ByUrl([
        updateData.profileImageUrl,
        updateData.profileBackgroundImageUrl,
      ]);
      throw error;
    }
  };

  updateUsername = async (req: Request, res: Response) => {
    const updatedUser = await this.userService.updateUsername(
      req.user?.id!,
      req.body,
    );
    res.status(200).json(updatedUser);
  };

  updateContentPreferences = async (req: Request, res: Response) => {
    const result = await this.userService.updateContentPreferences(
      req.user?.id!,
      req.body,
    );

    res.status(200).json({
      message: "Icerik tercihleri guncellendi.",
      ...result,
    });
  };

  confirmAdultContent = async (req: Request, res: Response) => {
    const result = await this.userService.confirmAdultContent(req.user?.id!);

    res.status(200).json({
      message: "Yetiskin icerik onayi kaydedildi.",
      ...result,
    });
  };

  acceptTermsAndPrivacy = async (req: Request, res: Response) => {
    const result = await this.userService.acceptTermsAndPrivacy(req.user?.id!);

    res.status(200).json({
      message: "Kullanim kosullari ve gizlilik politikasi onayi kaydedildi.",
      ...result,
    });
  };

  getMe = async (req: Request, res: Response) => {
    const user = await this.userService.getMe({
      userId: req.user?.id!,
      fields: res.locals.validatedData.fields,
    });
    res.status(200).json(user);
  };

  toggleNovelInLibrary = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const { novelId } = req.body as any;
    await this.libraryService.toggleNovelInLibrary(novelId, userId);
    res.status(200).json({ message: "Novel toggled in library" });
  };

  getMyLibrary = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const library = await this.libraryService.getMyLibrary({
      userId,
      ...res.locals.validatedData,
    });
    res.status(200).json(library);
  };

  isNovelInLibrary = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const { novelId } = req.params as any;
    const exists = await this.libraryService.isNovelInLibrary(novelId, userId);
    res.status(200).json({ exists });
  };

  getReadingStats = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const stats = await this.userService.getReadingStats(userId);
    res.status(200).json(stats);
  };

  getUserNovelStats = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const { novelId } = req.params as any;
    const stats = await this.userService.getUserNovelStats(userId, novelId);
    res.status(200).json(stats);
  };

  updateReadingStats = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const dto = { userId, ...res.locals.validatedData };
    await this.userService.updateReadingStats(dto);
    res.status(200).json({ message: "Reading stats updated" });
  };

  getPersonalNotifications = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const notifications = await this.userService.getPersonalNotifications({
      userId,
      ...res.locals.validatedData,
    });
    res.status(200).json(notifications);
  };

  deletePersonalNotification = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const { notificationId } = req.params as any;
    await this.userService.deletePersonalNotification(notificationId, userId);
    res.status(200).json({ message: "Notification deleted" });
  };

  markPersonalNotificationAsRead = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const { notificationId } = req.params as any;
    await this.userService.markPersonalNotificationAsRead(
      notificationId,
      userId,
    );
    res.status(200).json({ message: "Notification marked as read" });
  };

  markAllPersonalNotificationsAsRead = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    await this.userService.markAllPersonalNotificationsAsRead(userId);
    res.status(200).json({ message: "All notifications marked as read" });
  };

  getTotalUnreadNotificationCount = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const count =
      await this.userService.getTotalUnreadNotificationCount(userId);
    res.status(200).json(count);
  };

  getGlobalNotifications = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const dto = { userId, ...res.locals.validatedData };
    const notifications = await this.userService.getGlobalNotifications(dto);
    res.status(200).json(notifications);
  };

  getGlobalNotificationById = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const { notificationId } = req.params as any;
    const notification = await this.userService.getGlobalNotificationById(
      notificationId,
      userId,
    );
    res.status(200).json(notification);
  };

  setLastGlobalNotificationSeenAt = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    await this.userService.setLastGlobalNotificationSeenAt(userId, new Date());
    res
      .status(200)
      .json({ message: "Last global notification seen date updated" });
  };

  registerDevice = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const device = await this.userService.registerDevice({
      userId,
      ...req.body,
    });

    res.status(200).json({
      message: "Device registered",
      item: device,
    });
  };

  unregisterDevice = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    await this.userService.unregisterDevice({
      userId,
      ...req.body,
    });

    res.status(200).json({ message: "Device unregistered" });
  };

  followUser = async (req: Request, res: Response) => {
    const followerId = req.user?.id!;
    const { id: followingId } = req.params as any;
    const result = await this.userService.followUser(followerId, followingId);
    res.status(200).json({
      message: result.created ? "User followed" : "User already followed",
      ...result,
    });
  };

  unfollowUser = async (req: Request, res: Response) => {
    const followerId = req.user?.id!;
    const { id: followingId } = req.params as any;
    const result = await this.userService.unfollowUser(followerId, followingId);
    res.status(200).json({
      message: result.removed ? "User unfollowed" : "User was not followed",
      ...result,
    });
  };

  blockUser = async (req: Request, res: Response) => {
    const blockerId = req.user?.id!;
    const { id: blockedId } = req.params as any;
    const result = await this.userService.blockUser(blockerId, blockedId);
    res.status(200).json({
      message: result.created ? "User blocked" : "User already blocked",
      ...result,
    });
  };

  unblockUser = async (req: Request, res: Response) => {
    const blockerId = req.user?.id!;
    const { id: blockedId } = req.params as any;
    const result = await this.userService.unblockUser(blockerId, blockedId);
    res.status(200).json({
      message: result.removed ? "User unblocked" : "User was not blocked",
      ...result,
    });
  };

  getBlockStatus = async (req: Request, res: Response) => {
    const blockerId = req.user?.id!;
    const { id: blockedId } = req.params as any;
    const status = await this.userService.getBlockStatus(blockerId, blockedId);
    res.status(200).json(status);
  };

  getBlockedUsers = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const blocks = await this.userService.getBlockedUsers({
      userId,
      ...res.locals.validatedData,
    });
    res.status(200).json(blocks);
  };

  getFollowStatus = async (req: Request, res: Response) => {
    const followerId = req.user?.id!;
    const { id: followingId } = req.params as any;
    const status = await this.userService.getFollowStatus(
      followerId,
      followingId,
    );
    res.status(200).json(status);
  };

  getFollowCounts = async (req: Request, res: Response) => {
    const { id: userId } = req.params as any;
    const counts = await this.userService.getFollowCounts(userId, req.user?.id);
    res.status(200).json(counts);
  };

  getFollowers = async (req: Request, res: Response) => {
    const { id: userId } = req.params as any;
    const followers = await this.userService.getFollowers({
      userId,
      viewerId: req.user?.id,
      ...res.locals.validatedData,
    });
    res.status(200).json(followers);
  };

  getFollowing = async (req: Request, res: Response) => {
    const { id: userId } = req.params as any;
    const following = await this.userService.getFollowing({
      userId,
      viewerId: req.user?.id,
      ...res.locals.validatedData,
    });
    res.status(200).json(following);
  };
}
