import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from "typeorm";
import { Novel } from "./Novel.js";
import { User } from "./User.js";

@Entity()
export class Library {
  @PrimaryColumn({ type: "uuid" })
  userId!: string;

  @PrimaryColumn({ type: "uuid" })
  novelId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Novel, (novel) => novel.library, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "novelId" })
  novel!: Novel;

  @ManyToOne(() => User, (user) => user.library, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user!: User;
}
