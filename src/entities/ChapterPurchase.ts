import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Column,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./User.js";
import { Chapter } from "./Chapter.js";
import { CoinType } from "../constants/transaction.contants.js";

@Entity()
@Index(["userId", "chapterId"], { unique: true })
export class ChapterPurchase {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  userId!: string;

  @Index()
  @Column({ type: "uuid" })
  chapterId!: string;

  @Column({ type: "int" })
  amount!: number;

  @Column({ type: "enum", enum: CoinType })
  coinType!: CoinType;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.purchases)
  @JoinColumn({ name: "userId" })
  user!: User;

  @ManyToOne(() => Chapter, (chapter) => chapter.purchases)
  @JoinColumn({ name: "chapterId" })
  chapter!: Chapter;
}
