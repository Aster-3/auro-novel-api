import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class GlobalNotification {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "varchar", length: 500 })
  summary!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "int", default: 0 })
  priority!: number;

  @Column({ type: "boolean", default: true })
  isPublished!: boolean;

  @Column({ type: "timestamp", nullable: true })
  publishedAt?: Date | null;

  @Column({ type: "timestamp", nullable: true })
  expiresAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
