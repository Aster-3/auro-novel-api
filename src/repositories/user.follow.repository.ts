import { Repository } from "typeorm";
import { FindAndCountType } from "../constants/findAndCountType.js";
import { User } from "../entities/User.js";
import { UserFollow } from "../entities/UserFollow.js";
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

    const [follows, total] = await this.followRepo.findAndCount({
      where: { followingId: userId },
      relations: { follower: true },
      select: {
        followerId: true,
        followingId: true,
        createdAt: true,
        follower: {
          id: true,
          username: true,
          nickname: true,
          profileImageUrl: true,
          description: true,
        },
      },
      order: { createdAt: "DESC" },
      take: limit,
      skip,
    });

    return this.toPaginatedUsers(
      follows.map((follow) => follow.follower),
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

    const [follows, total] = await this.followRepo.findAndCount({
      where: { followerId: userId },
      relations: { following: true },
      select: {
        followerId: true,
        followingId: true,
        createdAt: true,
        following: {
          id: true,
          username: true,
          nickname: true,
          profileImageUrl: true,
          description: true,
        },
      },
      order: { createdAt: "DESC" },
      take: limit,
      skip,
    });

    return this.toPaginatedUsers(
      follows.map((follow) => follow.following),
      total,
      page,
      limit,
    );
  }

  async getFollowCounts(userId: string): Promise<UserFollowCounts> {
    const [followersCount, followingCount] = await Promise.all([
      this.followRepo.count({ where: { followingId: userId } }),
      this.followRepo.count({ where: { followerId: userId } }),
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
