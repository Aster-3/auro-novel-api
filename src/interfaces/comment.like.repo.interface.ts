export interface ICommentLikeRepository {
  toggleLike(userId: string, commentId: number): Promise<boolean>;
  isLiked(userId: string, commentId: number): Promise<boolean>;
  getLikeSummary(
    commentId: number,
    preferredActorUserId?: string,
    excludedUserId?: string,
  ): Promise<LikeSummary>;
}

export interface LikeSummary {
  actorCount: number;
  actorUserId: string | null;
}
