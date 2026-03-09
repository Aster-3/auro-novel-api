export class getRepliesDto {
  id: number;
  content: string;
  likeCount: number;
  createdAt: Date;
  user: {
    id: string;
    nickname: string;
    profileImageUrl: string | null;
  };
  replyTo: {
    nickname: string;
    content: string;
  } | null;

  constructor(comment: any, rootId: number) {
    this.id = comment.id;
    this.content = comment.content;
    this.likeCount = comment.likeCount;
    this.createdAt = comment.createdAt;

    this.user = {
      id: comment.user?.id,
      nickname: comment.user?.nickname,
      profileImageUrl: comment.user?.profileImageUrl || null,
    };

    this.replyTo = this.formatReplyTo(comment, rootId);
  }

  private formatReplyTo(comment: any, rootId: number) {
    if (
      comment.parentComment &&
      Number(comment.parentComment.id) !== Number(rootId)
    ) {
      return {
        nickname:
          comment.parentComment.user?.nickname || "Bilinmeyen Kullanıcı",
        content: comment.parentComment.content,
      };
    }
    return null;
  }
}
