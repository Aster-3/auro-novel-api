export interface IChapterCommentLikeRepository {
  toggleLike(userId: string, commentId: number): Promise<boolean>;
}
