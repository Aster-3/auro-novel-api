import { Repository } from "typeorm";
import { FindAndCountType } from "../constants/findAndCountType.js";
import { UserFollow } from "../entities/UserFollow.js";
import {
  DELETED_USER_NICKNAME,
  presentUser,
} from "../utils/deleted.user.presenter.js";
import { applyBlockedUserVisibilityFilter } from "../utils/user.block.visibility.js";
import {
  GetUserFollowsDto,
  IUserFollowRepository,
  UserFollowCounts,
  UserFollowListItem,
} from "../interfaces/user.follow.repo.interface.js";

export class UserFollowRepository implements IUserFollowRepository {
  constructor(private followRepo: Repository<UserFollow>) {}

  async follow(followerId: string, followingId: string): Promise<boolean> {
    const exists = await this.isFollowing(followerId, followingId);

    if (exists) {
      return false;
    }

    await this.followRepo.save({ followerId, followingId });
    return true;
  }

  async unfollow(followerId: string, followingId: string): Promise<boolean> {
    const result = await this.followRepo.delete({ followerId, followingId });
    return Boolean(result.affected);
  }

  async removeBetween(firstUserId: string, secondUserId: string): Promise<void> {
    await this.followRepo
      .createQueryBuilder()
      .delete()
      .from(UserFollow)
      .where(
        `("followerId" = :firstUserId AND "followingId" = :secondUserId)
        OR ("followerId" = :secondUserId AND "followingId" = :firstUserId)`,
        { firstUserId, secondUserId },
      )
      .execute();
  }

  async isFollowing(
    followerId: string,
    followingId: string,
  ): Promise<boolean> {
    return await this.followRepo.exists({
      where: { followerId, followingId },
    });
  }

  async getFollowers(
    dto: GetUserFollowsDto,
  ): Promise<FindAndCountType<UserFollowListItem>> {
    const { userId, viewerId, page, limit } = dto;
    const skip = (page - 1) * limit;

    const query = this.followRepo
      .createQueryBuilder("follow")
      .innerJoinAndSelect("follow.follower", "follower")
      .where("follow.followingId = :userId", { userId })
      .select([
        "follow.followerId",
        "follow.followingId",
        "follow.createdAt",
        "follower.id",
        "follower.username",
        "follower.nickname",
        "follower.profileImageUrl",
        "follower.description",
      ])
      .orderBy("follow.createdAt", "DESC")
      .take(limit)
      .skip(skip);

    applyBlockedUserVisibilityFilter(query, viewerId, "follower");

    const [follows, total] = await query.getManyAndCount();

    const items = await this.addViewerFollowState(
      follows.map((follow) => presentUser(follow.follower)),
      viewerId,
    );

    return this.toPaginatedUsers(
      items,
      total,
      page,
      limit,
    );
  }

  async getFollowing(
    dto: GetUserFollowsDto,
  ): Promise<FindAndCountType<UserFollowListItem>> {
    const { userId, viewerId, page, limit } = dto;
    const skip = (page - 1) * limit;

    const query = this.followRepo
      .createQueryBuilder("follow")
      .innerJoinAndSelect("follow.following", "following")
      .where("follow.followerId = :userId", { userId })
      .select([
        "follow.followerId",
        "follow.followingId",
        "follow.createdAt",
        "following.id",
        "following.username",
        "following.nickname",
        "following.profileImageUrl",
        "following.description",
      ])
      .orderBy("follow.createdAt", "DESC")
      .take(limit)
      .skip(skip);

    applyBlockedUserVisibilityFilter(query, viewerId, "following");

    const [follows, total] = await query.getManyAndCount();

    const items = await this.addViewerFollowState(
      follows.map((follow) => presentUser(follow.following)),
      viewerId,
    );

    return this.toPaginatedUsers(
      items,
      total,
      page,
      limit,
    );
  }

  async getFollowCounts(
    userId: string,
    viewerId?: string,
  ): Promise<UserFollowCounts> {
    const followersQuery = this.followRepo
      .createQueryBuilder("follow")
      .innerJoin("follow.follower", "follower")
      .where("follow.followingId = :userId", { userId });
    const followingQuery = this.followRepo
      .createQueryBuilder("follow")
      .innerJoin("follow.following", "following")
      .where("follow.followerId = :userId", { userId });

    applyBlockedUserVisibilityFilter(followersQuery, viewerId, "follower");
    applyBlockedUserVisibilityFilter(followingQuery, viewerId, "following");

    const [followersCount, followingCount] = await Promise.all([
      followersQuery.getCount(),
      followingQuery.getCount(),
    ]);

    return { followersCount, followingCount };
  }

  private toPaginatedUsers(
    items: UserFollowListItem[],
    total: number,
    page: number,
    limit: number,
  ): FindAndCountType<UserFollowListItem> {
    const lastPage = Math.ceil(total / limit);

    return {
      items,
      total,
      currentPage: page,
      lastPage,
      nextPage: page < lastPage ? page + 1 : null,
    };
  }

  private async addViewerFollowState(
    items: ReturnType<typeof presentUser>[],
    viewerId?: string,
  ): Promise<UserFollowListItem[]> {
    const normalizedItems = items.map((item) => ({
      id: item.id ?? null,
      username: item.username ?? null,
      nickname: item.nickname ?? DELETED_USER_NICKNAME,
      profileImageUrl: item.profileImageUrl ?? null,
      description: item.description ?? null,
      isDeletedUser: item.isDeletedUser,
    }));

    const itemIds = normalizedItems
      .map((item) => item.id)
      .filter((id): id is string => Boolean(id));

    if (!viewerId || itemIds.length === 0) {
      return normalizedItems.map((item) => ({
        ...item,
        viewerIsFollowing: false,
      }));
    }

    const viewerFollows = await this.followRepo
      .createQueryBuilder("follow")
      .select("follow.followingId", "followingId")
      .where("follow.followerId = :viewerId", { viewerId })
      .andWhere("follow.followingId IN (:...itemIds)", { itemIds })
      .getRawMany<{ followingId: string }>();

    const followingIds = new Set(
      viewerFollows.map((follow) => follow.followingId),
    );

    return normalizedItems.map((item) => ({
      ...item,
      viewerIsFollowing: Boolean(item.id && followingIds.has(item.id)),
    }));
  }
}
