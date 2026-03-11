export interface ICommentLikeRepository {
  toggleLike(userId: string, commentId: number): Promise<boolean>;
}
