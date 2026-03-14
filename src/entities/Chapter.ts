import {
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Novel } from "./Novel.js";
import { Volume } from "./Volume.js";
import { ChapterPurchase } from "./_index.js";

@Entity()
@Index(["novelId", "order"], { unique: true })
export class Chapter {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "int" })
  order!: number;

  @Column({ type: "boolean", default: false })
  isPublished!: boolean;

  @Column({ type: "int", default: 0 })
  price!: number;

  @Column({ type: "boolean", default: false })
  isLocked!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updateAt!: Date;

  @Column({ type: "timestamp", nullable: true, default: null })
  publishedAt!: Date | null;

  @BeforeUpdate()
  updatePublishedAt() {
    if (this.isPublished && !this.publishedAt) {
      this.publishedAt = new Date();
    }
  }

  @Column({ type: "uuid" })
  novelId!: string;

  @ManyToOne(() => Novel, (novel) => novel.chapters, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "novelId" })
  novel!: Novel;

  @Column({ type: "uuid", nullable: true })
  volumeId!: string | null;

  @ManyToOne(() => Volume, (volume) => volume.chapters, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "volumeId" })
  volume!: Volume | null;

  @OneToMany(() => ChapterPurchase, (purchase) => purchase.chapter)
  purchases!: ChapterPurchase[];
}
