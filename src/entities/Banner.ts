import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { BannerTargetType } from "../constants/banner.constants.js";

@Entity()
export class Banner {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "int", default: 0 })
  orderIndex!: number;

  @Column({ type: "text", nullable: true })
  imageUrl!: string | null;

  @Index()
  @Column({
    type: "enum",
    enum: BannerTargetType,
    default: BannerTargetType.NOVEL,
  })
  targetType!: BannerTargetType;

  @Index()
  @Column({ type: "uuid", nullable: true })
  targetId!: string | null;

  @Index()
  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
