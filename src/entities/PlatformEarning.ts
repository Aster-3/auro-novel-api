import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNumericTransformer } from "../utils/column.numeric.transformer.js";
import { Currency } from "../constants/transaction.contants.js";

@Entity()
export class PlatformEarning {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  novelId!: string; // Hangi roman sana ne kadar kazandırıyor?0

  @Index()
  @Column({ type: "uuid" })
  authorId!: string; // Hangi yazar sana ne kadar kazandırıyor?

  @Column({ type: "uuid" })
  chapterId!: string;

  @Index()
  @Column({ type: "uuid" })
  purchaseId!: string;

  // --- Finansal Dağılım ---

  @Column({ type: "bigint", transformer: new ColumnNumericTransformer() })
  grossAmount!: number;

  @Column({ type: "int" })
  platformCommissionRate!: number;

  @Column({ type: "int" })
  coinAmount!: number;

  @Column({ type: "int" })
  coinUnitPrice!: number;

  @Column({ type: "bigint", transformer: new ColumnNumericTransformer() })
  netAmount!: number;

  @Column({ type: "varchar", length: 3, default: Currency.TRY })
  currency!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
