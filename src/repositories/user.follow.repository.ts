import { Repository } from "typeorm";
import { FindAndCountType } from "../constants/findAndCountType.js";
import { User } from "../entities/User.js";
import { UserFollow } from "../entities/UserFollow.js";
import { presentUser } from "../utils/deleted.user.presenter.js";
import {
  GetUserFollowsDto,
  IUserFollowRepository,
  UserFollowCounts,
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
  ): Promise<FindAndCountType<User>> {
    const { userId, page, limit } = dto;
    const skip = (page - 1) * limit;

    const [follows, total] = await this.followRepo
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
      .skip(skip)
      .getManyAndCount();

    return this.toPaginatedUsers(
      follows.map((follow) => presentUser(follow.follower)) as any[],
      total,
      page,
      limit,
    );
  }

  async getFollowing(
    dto: GetUserFollowsDto,
  ): Promise<FindAndCountType<User>> {
    const { userId, page, limit } = dto;
    const skip = (page - 1) * limit;

    const [follows, total] = await this.followRepo
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
      .skip(skip)
      .getManyAndCount();

    return this.toPaginatedUsers(
      follows.map((follow) => presentUser(follow.following)) as any[],
      total,
      page,
      limit,
    );
  }

  async getFollowCounts(userId: string): Promise<UserFollowCounts> {
    const [followersCount, followingCount] = await Promise.all([
      this.followRepo
        .createQueryBuilder("follow")
        .innerJoin("follow.follower", "follower")
        .where("follow.followingId = :userId", { userId })
        .getCount(),
      this.followRepo
        .createQueryBuilder("follow")
        .innerJoin("follow.following", "following")
        .where("follow.followerId = :userId", { userId })
        .getCount(),
    ]);

    return { followersCount, followingCount };
  }

  private toPaginatedUsers(
    items: User[],
    total: number,
    page: number,
    limit: number,
  ): FindAndCountType<User> {
    const lastPage = Math.ceil(total / limit);

    return {
      items,
      total,
      currentPage: page,
      lastPage,
      nextPage: page < lastPage ? page + 1 : null,
    };
  }
}
