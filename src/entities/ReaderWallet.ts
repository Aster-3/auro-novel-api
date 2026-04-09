import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from "typeorm";
import { User } from "./User.js";
import { ReaderWalletTransaction } from "./ReaderWalletTransaction.js";

@Entity()
export class ReaderWallet {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "int", default: 0 })
  moonCoins!: number;

  @Column({ type: "int", default: 0 })
  sunCoins!: number;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: "uuid" })
  userId!: string;

  @OneToOne(() => User, (user) => user.wallet, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user!: User;

  @OneToMany(() => ReaderWalletTransaction, (transaction) => transaction.wallet)
  transactions!: ReaderWalletTransaction[];

  @VersionColumn()
  version!: number;
}
