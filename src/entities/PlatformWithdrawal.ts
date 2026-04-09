import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNumericTransformer } from "../utils/column.numeric.transformer.js";

@Entity()
export class PlatformWithdrawal {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    type: "bigint",
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  amount!: number;

  @Column({ type: "bigint", transformer: new ColumnNumericTransformer() })
  balanceAfterWithdrawal!: number;

  @Column({ type: "bigint", transformer: new ColumnNumericTransformer() })
  balanceBeforeWithdrawal!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
