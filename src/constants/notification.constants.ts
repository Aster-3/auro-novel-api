export enum PersonalNotificationType {
  NEW_CHAPTER = "new_chapter",
  COMMENT_REPLY = "comment_reply",
  COMMENT_LIKE = "comment_like",
  CHAPTER_COMMENT_REPLY = "chapter_comment_reply",
  CHAPTER_COMMENT_LIKE = "chapter_comment_like",
  REPLY_REPLY = "reply_reply",
  REPLY_LIKE = "reply_like",
  FOLLOW = "follow",
  MESSAGE = "message",
}

export enum NotificationTargetType {
  NOVEL = "novel",
  CHAPTER = "chapter",
  COMMENT = "comment",
  CHAPTER_COMMENT = "chapter_comment",
  REPLY = "reply",
  USER = "user",
  CONVERSATION = "conversation",
  URL = "url",
}
