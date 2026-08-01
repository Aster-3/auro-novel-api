import { FindAndCountType } from "../constants/findAndCountType.js";
import { UserFollowListItem } from "./user.follow.repo.interface.js";

export interface IUserBlockRepository {
  block(blockerId: string, blockedId: string): Promise<boolean>;
  unblock(blockerId: string, blockedId: string): Promise<boolean>;
  exists(blockerId: string, blockedId: string): Promise<boolean>;
  existsBetween(firstUserId: string, secondUserId: string): Promise<boolean>;
  getBlockedUsers(
    dto: GetBlockedUsersDto,
  ): Promise<FindAndCountType<UserFollowListItem>>;
}

export interface GetBlockedUsersDto {
  userId: string;
  page: number;
  limit: number;
}
