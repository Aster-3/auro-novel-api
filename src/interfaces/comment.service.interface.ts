export interface ICommentService {
  getAllComments(page?: number, limit?: number): Promise<any[]>;
  getCommentsByUserId(
    userId: string,
    page?: number,
    limit?: number,
  ): Promise<any[]>;
  getCommentsByNovelId(
    novelId: string,
    page?: number,
    limit?: number,
  ): Promise<any[]>;
}
