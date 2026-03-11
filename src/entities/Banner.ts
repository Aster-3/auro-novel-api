import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
export class Banner {
  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Index()
  @Column({ type: "int", unique: true })
  order!: number;

  @Column({ type: "text" })
  bannerUrl!: string;

  @Column({ type: "varchar", length: 300, nullable: true })
  redirectUrl?: string;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
