import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Novel } from "./Novel.js";
import { User } from "./User.js";
import { AuthorWallet } from "./AuthorWallet.js";
import { AuthorEarning } from "./AuthorEarning.js";

@Entity()
export class Author {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  nickname?: string;

  @Index()
  @Column({ type: "uuid", nullable: true })
  userId?: string;

  @OneToOne(() => User, (user) => user.authorProfile, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "userId" })
  user?: User;

  @Column({ type: "boolean", default: false })
  isVerified!: boolean;

  @OneToMany(() => Novel, (novel) => novel.author)
  novels!: Novel[];

  @OneToOne(() => AuthorWallet, (wallet) => wallet.author, {
    cascade: true,
  })
  wallet!: AuthorWallet;

  @OneToMany(() => AuthorEarning, (earning) => earning.author)
  earnings!: AuthorEarning[];
}
