import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class AppConfig {
  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({
    type: "int",
    default: 20,
  })
  baseCoinPrice!: number;

  @Column({
    type: "int",
    default: 0,
  })
  seasonSalePercent!: number;

  @Column({
    type: "timestamp",
    nullable: true,
  })
  seasonSaleEndDate!: Date | null;

  @Column({ type: "jsonb", nullable: true })
  metadata!: Record<string, any> | null;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  createdAt!: Date;
}
