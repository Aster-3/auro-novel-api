import { randomBytes } from "crypto";
import { User } from "../entities/User.js";
import { UserStatus } from "../constants/user.constants.js";

export const DELETED_USER_NICKNAME = "Silinmiş Kullanıcı";

export function createDeletedUserIdentity() {
  const suffix = randomBytes(4).toString("hex");

  return {
    username: `del_${suffix}`,
    email: `deleted_user_${suffix}@deleted.local`,
    nickname: DELETED_USER_NICKNAME,
    profileImageUrl: null,
    profileBackgroundImageUrl: null,
    description: null,
    gender: null,
    googleId: null,
    status: UserStatus.DELETED,
    refreshToken: null,
  };
}

export function presentUser(user?: Partial<User> | null) {
  const isDeletedUser = !user?.id || Boolean(user.deletedAt);

  if (isDeletedUser) {
    return {
      id: null,
      username: null,
      nickname: DELETED_USER_NICKNAME,
      profileImageUrl: null,
      description: null,
      isDeletedUser: true,
    };
  }

  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    profileImageUrl: user.profileImageUrl ?? null,
    description: user.description ?? null,
    isDeletedUser: false,
  };
}
