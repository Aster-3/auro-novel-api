import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { User } from "./User.js";

@Entity()
export class UserFollow {
  @PrimaryColumn({ type: "uuid" })
  followerId!: string;

  @ManyToOne(() => User, (user) => user.following, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "followerId" })
  follower!: User;

  @PrimaryColumn({ type: "uuid" })
  followingId!: string;

  @ManyToOne(() => User, (user) => user.followers, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "followingId" })
  following!: User;

  @CreateDateColumn()
  createdAt!: Date;
}
