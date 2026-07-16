import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  DeleteDateColumn,
} from "typeorm";
import { Comment } from "./Comment.js";
import { CommentLike } from "./CommentLike.js";
import { Novel } from "./Novel.js";
import { Tags } from "./Tags.js";
import { Library } from "./Library.js";
import { Reply } from "./Reply.js";
import { ReplyLike } from "./ReplyLike.js";
import {
  UserGender,
  UserRoles,
  UserStatus,
  UserSubscriptionPeriod,
  UserSubscriptionTier,
} from "../constants/user.constants.js";
import { Author } from "./_index.js";
import { UserVerification } from "./UserVerification.js";
import { ReadingStats } from "./ReadingStats.js";
import { PersonalNotification } from "./PersonalNotification.js";
import { UserDevice } from "./UserDevice.js";
import { UserFollow } from "./UserFollow.js";
import { PasswordReset } from "./PasswordReset.js";
import { ChapterComment } from "./ChapterComment.js";
import { ChapterCommentLike } from "./ChapterCommentLike.js";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 15, unique: true })
  username!: string;

  @Column({ type: "varchar", length: 20 })
  nickname!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ type: "varchar", length: 255, select: false })
  password!: string;

  @Column({ type: "text", nullable: true })
  profileImageUrl?: string;

  @Column({ type: "text", nullable: true })
  profileBackgroundImageUrl?: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  description?: string;

  @Column({ type: "enum", enum: UserGender, nullable: true })
  gender?: UserGender | null;

  @Column({ type: "enum", enum: UserRoles, default: UserRoles.USER })
  role!: UserRoles;

  @Column({ type: "enum", enum: UserStatus, default: UserStatus.PENDING })
  status!: UserStatus;

  @Column({ type: "boolean", default: false })
  isVerified!: boolean;

  @Column({ type: "boolean", default: false })
  isPremium!: boolean;

  @Column({ type: "timestamp", nullable: true })
  premiumUntil?: Date | null;

  @Column({
    type: "enum",
    enum: UserSubscriptionTier,
    enumName: "user_subscription_tier_enum",
    nullable: true,
  })
  subscriptionTier?: UserSubscriptionTier | null;

  @Column({
    type: "enum",
    enum: UserSubscriptionPeriod,
    enumName: "user_subscription_period_enum",
    nullable: true,
  })
  subscriptionPeriod?: UserSubscriptionPeriod | null;

  @Column({ type: "varchar", nullable: true, select: false })
  refreshToken?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @OneToMany(() => Comment, (comment) => comment.user)
  comments!: Comment[];

  @OneToMany(() => Reply, (reply) => reply.user)
  replies!: Reply[];

  @OneToMany(() => CommentLike, (commentLike) => commentLike.user)
  commentLikes!: CommentLike[];

  @OneToMany(() => ReplyLike, (replyLike) => replyLike.user)
  replyLikes!: ReplyLike[];

  @OneToMany(() => ChapterComment, (comment) => comment.user)
  chapterComments!: ChapterComment[];

  @OneToMany(() => ChapterCommentLike, (like) => like.user)
  chapterCommentLikes!: ChapterCommentLike[];

  @OneToMany(() => Novel, (novel) => novel.author)
  novels!: Novel[];

  @OneToMany(() => Tags, (tags) => tags.createdBy)
  createdTags!: Tags[];

  @OneToMany(() => Library, (library) => library.user)
  library!: Library[];

  @OneToMany(() => ReadingStats, (stats) => stats.user)
  readingStats!: ReadingStats[];

  @OneToOne(() => Author, (author) => author.user)
  authorProfile?: Author;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  lastGlobalNotificationSeenAt!: Date;

  @OneToOne(() => UserVerification, (verification) => verification.user, {
    cascade: true,
  })
  verification!: UserVerification;

  @OneToOne(() => PasswordReset, (passwordReset) => passwordReset.user, {
    cascade: true,
  })
  passwordReset?: PasswordReset;

  @OneToMany(() => PersonalNotification, (notification) => notification.user)
  notifications!: PersonalNotification[];

  @OneToMany(() => UserDevice, (device) => device.user)
  devices!: UserDevice[];

  @OneToMany(() => UserFollow, (follow) => follow.follower)
  following!: UserFollow[];

  @OneToMany(() => UserFollow, (follow) => follow.following)
  followers!: UserFollow[];
}
