import { Repository } from "typeorm";
import { FindAndCountType } from "../constants/findAndCountType.js";
import { UserBlock } from "../entities/UserBlock.js";
import {
  GetBlockedUsersDto,
  IUserBlockRepository,
} from "../interfaces/user.block.repo.interface.js";
import { UserFollowListItem } from "../interfaces/user.follow.repo.interface.js";
import {
  DELETED_USER_NICKNAME,
  presentUser,
} from "../utils/deleted.user.presenter.js";

export class UserBlockRepository implements IUserBlockRepository {
  constructor(private blockRepo: Repository<UserBlock>) {}

  async block(blockerId: string, blockedId: string): Promise<boolean> {
    const exists = await this.exists(blockerId, blockedId);

    if (exists) {
      return false;
    }

    await this.blockRepo.save({ blockerId, blockedId });
    return true;
  }

  async unblock(blockerId: string, blockedId: string): Promise<boolean> {
    const result = await this.blockRepo.delete({ blockerId, blockedId });
    return Boolean(result.affected);
  }

  async exists(blockerId: string, blockedId: string): Promise<boolean> {
    return await this.blockRepo.exists({
      where: { blockerId, blockedId },
    });
  }

  async existsBetween(firstUserId: string, secondUserId: string): Promise<boolean> {
    return await this.blockRepo
      .createQueryBuilder("block")
      .where(
        `(block."blockerId" = :firstUserId AND block."blockedId" = :secondUserId)
        OR (block."blockerId" = :secondUserId AND block."blockedId" = :firstUserId)`,
        { firstUserId, secondUserId },
      )
      .getExists();
  }

  async getBlockedUsers(
    dto: GetBlockedUsersDto,
  ): Promise<FindAndCountType<UserFollowListItem>> {
    const { userId, page, limit } = dto;
    const skip = (page - 1) * limit;

    const [blocks, total] = await this.blockRepo
      .createQueryBuilder("block")
      .innerJoinAndSelect("block.blocked", "blocked")
      .where("block.blockerId = :userId", { userId })
      .select([
        "block.blockerId",
        "block.blockedId",
        "block.createdAt",
        "blocked.id",
        "blocked.username",
        "blocked.nickname",
        "blocked.profileImageUrl",
        "blocked.description",
      ])
      .orderBy("block.createdAt", "DESC")
      .take(limit)
      .skip(skip)
      .getManyAndCount();

    const items = blocks.map((block) => {
      const user = presentUser(block.blocked);
      return {
        id: user.id ?? null,
        username: user.username ?? null,
        nickname: user.nickname ?? DELETED_USER_NICKNAME,
        profileImageUrl: user.profileImageUrl ?? null,
        description: user.description ?? null,
        isDeletedUser: user.isDeletedUser,
        viewerIsFollowing: false,
      };
    });

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
