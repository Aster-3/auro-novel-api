import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { Novel } from "./Novel.js";
import { User } from "./User.js";

@Entity()
export class Library {
  @PrimaryColumn({ type: "uuid" })
  userId!: string;

  @ManyToOne(() => User, (user) => user.library, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user!: User;

  @PrimaryColumn({ type: "uuid" })
  novelId!: string;

  @ManyToOne(() => Novel, (novel) => novel.library, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "novelId" })
  novel!: Novel;

  @Column({ type: "boolean", default: false })
  isHidden!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
