import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User.js";
import { Novel } from "./Novel.js";
import { CommentLike } from "./CommentLike.js";
import { Reply } from "./Reply.js";

@Entity()
@Index(["userId", "novelId"], { unique: true })
export class Comment {
  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "varchar", length: 1500 })
  content!: string;

  @Index()
  @Column({ type: "boolean" })
  isRecommend!: boolean;

  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne(() => User, (user) => user.comments, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Index()
  @Column({ type: "uuid" })
  novelId!: string;

  @ManyToOne(() => Novel, (novel) => novel.id, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "novelId" })
  novel!: Novel;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => CommentLike, (commentLike) => commentLike.comment)
  likes!: CommentLike[];

  @Column({ type: "int", default: 0 })
  likeCount!: number;

  @Column({ type: "int", default: 0 })
  replyCount!: number;

  @OneToMany(() => Reply, (reply) => reply.comment)
  replies?: Reply[];
}
