import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User.js";
import { Novel } from "./Novel.js";
import { CommentLike } from "./CommentLike.js";

@Entity()
export class Comment {
  @PrimaryGeneratedColumn("increment")
  id!: number;

  @ManyToOne(() => User, (user) => user.comments, { nullable: false })
  user!: User;

  @ManyToOne(() => Novel, (novel) => novel.id)
  novel!: Novel;

  @Column({ type: "varchar", nullable: false, length: 1500 })
  content!: string;

  @Column({ type: "boolean", nullable: true })
  isRecommend?: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => CommentLike, (commentLike) => commentLike.comment)
  likes!: CommentLike[];

  @ManyToOne(() => Comment, (comment) => comment.replies, { nullable: true })
  parentComment?: Comment;

  @OneToMany(() => Comment, (comment) => comment.parentComment)
  replies?: Comment[];

  @ManyToOne(() => Comment, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "rootCommentId" })
  rootComment?: Comment;
}
