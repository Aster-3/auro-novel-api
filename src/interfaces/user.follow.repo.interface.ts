import { FindAndCountType } from "../constants/findAndCountType.js";
import { User } from "../entities/User.js";

export interface IUserFollowRepository {
  follow(followerId: string, followingId: string): Promise<boolean>;
  unfollow(followerId: string, followingId: string): Promise<boolean>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getFollowers(dto: GetUserFollowsDto): Promise<FindAndCountType<User>>;
  getFollowing(dto: GetUserFollowsDto): Promise<FindAndCountType<User>>;
  getFollowCounts(userId: string): Promise<UserFollowCounts>;
}

export interface GetUserFollowsDto {
  userId: string;
  page: number;
  limit: number;
}

export interface UserFollowCounts {
  followersCount: number;
  followingCount: number;
}
