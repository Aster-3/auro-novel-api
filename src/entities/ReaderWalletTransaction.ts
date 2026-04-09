import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import {
  CoinType,
  ReaderTransactionType,
} from "../constants/transaction.contants.js";
import { ReaderWallet } from "./ReaderWallet.js";

@Entity()
export class ReaderWalletTransaction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  walletId!: string;

  @Column({ type: "enum", enum: ReaderTransactionType })
  transactionType!: ReaderTransactionType;

  @Column({ type: "int" })
  amount!: number;

  @Column({ type: "enum", enum: CoinType })
  coinType!: CoinType;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: "varchar", length: 255, nullable: true })
  description?: string;

  @ManyToOne(() => ReaderWallet, (wallet) => wallet.transactions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "walletId" })
  wallet!: ReaderWallet;
}
