import { FindAndCountType } from "../constants/findAndCountType.js";

export interface IUserFollowRepository {
  follow(followerId: string, followingId: string): Promise<boolean>;
  unfollow(followerId: string, followingId: string): Promise<boolean>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getFollowers(
    dto: GetUserFollowsDto,
  ): Promise<FindAndCountType<UserFollowListItem>>;
  getFollowing(
    dto: GetUserFollowsDto,
  ): Promise<FindAndCountType<UserFollowListItem>>;
  getFollowCounts(userId: string): Promise<UserFollowCounts>;
}

export interface GetUserFollowsDto {
  userId: string;
  viewerId?: string;
  page: number;
  limit: number;
}

export interface UserFollowListItem {
  id: string | null;
  username: string | null;
  nickname: string;
  profileImageUrl: string | null;
  description: string | null;
  isDeletedUser: boolean;
  viewerIsFollowing: boolean;
}

export interface UserFollowCounts {
  followersCount: number;
  followingCount: number;
}
