import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Comment } from "./Comment.js";
import { User } from "./User.js";

@Entity()
export class CommentLike {
  @PrimaryGeneratedColumn("increment")
  id!: number;

  @ManyToOne(() => Comment, (comment) => comment.likes, {
    nullable: false,
    onDelete: "CASCADE",
  })
  comment!: Comment;

  @ManyToOne(() => User, (user) => user.likes, {
    nullable: false,
    onDelete: "CASCADE",
  })
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;
}
