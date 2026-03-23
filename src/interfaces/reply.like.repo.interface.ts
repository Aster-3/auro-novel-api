export interface IReplyLikeRepository {
  toggleLike(userId: string, replyId: number): Promise<boolean>;
}
