import {
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
@Unique(["userId", "novelId"])
export class Library {
  @PrimaryColumn({ type: "uuid", nullable: false })
  userId!: string;

  @PrimaryColumn({ type: "uuid", nullable: false })
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
