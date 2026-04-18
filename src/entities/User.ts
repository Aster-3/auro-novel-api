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
import { UserRoles, UserStatus } from "../constants/user.constants.js";
import { Author, ChapterPurchase } from "./_index.js";
import { UserVerification } from "./UserVerification.js";
import { ReaderWallet } from "./ReaderWallet.js";
import { ReadingStats } from "./ReadingStats.js";

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

  @Column({ type: "enum", enum: UserRoles, default: UserRoles.USER })
  role!: UserRoles;

  @Column({ type: "enum", enum: UserStatus, default: UserStatus.PENDING })
  status!: UserStatus;

  @Column({ type: "boolean", default: false })
  isVerified!: boolean;

  @Column({ type: "varchar", nullable: true, select: false })
  refreshToken?: string;

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

  @OneToMany(() => ChapterPurchase, (purchase) => purchase.user)
  purchases!: ChapterPurchase[];

  @OneToOne(() => ReaderWallet, (wallet) => wallet.user, {
    cascade: true,
  })
  wallet!: ReaderWallet;

  @OneToOne(() => UserVerification, (verification) => verification.user, {
    cascade: true,
  })
  verification!: UserVerification;
}
