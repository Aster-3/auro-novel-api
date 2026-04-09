import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from "typeorm";
import { Author } from "./Author.js";
import { AuthorWalletTransaction } from "./AuthorWalletTransaction.js";
import { ColumnNumericTransformer } from "../utils/column.numeric.transformer.js";

@Entity()
export class AuthorWallet {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  authorId!: string;

  @OneToOne(() => Author, (author) => author.wallet, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "authorId" })
  author!: Author;

  @Column({
    type: "bigint",
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  totalEarnings!: number;

  @Column({
    type: "bigint",
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  totalWithdrawn!: number;

  @Column({
    type: "bigint",
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  withdrawableBalance!: number;

  @Column({
    type: "bigint",
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  pendingWithdrawalBalance!: number;

  @Column({ type: "timestamp", nullable: true, default: null })
  lastWithdrawalAt!: Date | null;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  canWithdrawAfter!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => AuthorWalletTransaction, (transaction) => transaction.wallet)
  transactions!: AuthorWalletTransaction[];

  @VersionColumn()
  version!: number;
}
