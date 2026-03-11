import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Comment } from "./Comment.js";
import { CommentLike } from "./CommentLike.js";
import { Novel } from "./Novel.js";
import { Tags } from "./Tags.js";
import { Library } from "./Library.js";
import { Reply } from "./Reply.js";
import { ReplyLike } from "./ReplyLike.js";
import { UserRoles, UserStatus } from "../constants/user.constants.js";

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

  @Column({ type: "varchar", length: 255, nullable: true })
  description?: string;

  @Column({ type: "boolean", default: false })
  isVerified!: boolean;

  @Column({ type: "enum", enum: UserRoles, default: UserRoles.USER })
  role!: UserRoles;

  @Column({ type: "enum", enum: UserStatus, default: UserStatus.ACTIVE })
  status!: UserStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

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
}
