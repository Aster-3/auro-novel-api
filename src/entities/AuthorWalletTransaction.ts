import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import {
  AuthorTransactionType,
  TransactionStatus,
} from "../constants/transaction.contants.js";
import { AuthorWallet } from "./_index.js";
import { ColumnNumericTransformer } from "../utils/column.numeric.transformer.js";

@Entity()
export class AuthorWalletTransaction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  walletId!: string;

  @ManyToOne(() => AuthorWallet, (wallet) => wallet.transactions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "walletId" })
  wallet!: AuthorWallet;

  @Column({ type: "enum", enum: AuthorTransactionType })
  transactionType!: AuthorTransactionType;

  @Column({ type: "bigint", transformer: new ColumnNumericTransformer() })
  amount!: number;

  @Column({ type: "bigint", transformer: new ColumnNumericTransformer() })
  balanceAfterTransaction!: number;

  @Column({ type: "bigint", transformer: new ColumnNumericTransformer() })
  balanceBeforeTransaction!: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  description!: string;

  @Index()
  @Column({ type: "uuid", nullable: true })
  referenceId?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
