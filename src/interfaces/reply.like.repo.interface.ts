export interface IReplyLikeRepository {
  toggleLike(userId: string, replyId: number): Promise<boolean>;
  isLiked(userId: string, replyId: number): Promise<boolean>;
  getLikeSummary(
    replyId: number,
    preferredActorUserId?: string,
    excludedUserId?: string,
  ): Promise<LikeSummary>;
}

export interface LikeSummary {
  actorCount: number;
  actorUserId: string | null;
}
