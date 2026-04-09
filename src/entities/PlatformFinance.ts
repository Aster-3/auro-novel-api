import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from "typeorm";
import { ColumnNumericTransformer } from "../utils/column.numeric.transformer.js";

@Entity()
export class PlatformFinance {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

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
  totalPayouts!: number;

  @Column({
    type: "bigint",
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  balance!: number;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  createdAt!: Date;

  @VersionColumn()
  version!: number;
}
