import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { User } from "./User.js";

@Entity()
export class UserBlock {
  @PrimaryColumn({ type: "uuid" })
  blockerId!: string;

  @ManyToOne(() => User, (user) => user.blockedUsers, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "blockerId" })
  blocker!: User;

  @PrimaryColumn({ type: "uuid" })
  blockedId!: string;

  @ManyToOne(() => User, (user) => user.blockedByUsers, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "blockedId" })
  blocked!: User;

  @CreateDateColumn()
  createdAt!: Date;
}
