export type ReadProgressByNovel = {
  novelId: string;
  readChapterCount: number;
};

export interface IUserReadChapterRepository {
  markChapterAsRead(dto: {
    userId: string;
    novelId: string;
    chapterId: string;
  }): Promise<void>;
  getReadProgressByUserId(userId: string): Promise<Map<string, ReadProgressByNovel>>;
}
