import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  JoinColumn,
  In,
} from "typeorm";
import { ColumnNumericTransformer } from "../utils/column.numeric.transformer.js";
import { Author } from "./Author.js";
import { Novel } from "./Novel.js"; // Novel entity'n olduğunu varsayıyorum
import { Chapter } from "./Chapter.js"; // Chapter entity'n olduğunu varsayıyorum
import { Currency } from "../constants/transaction.contants.js";

@Entity()
export class AuthorEarning {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  authorId!: string;

  @ManyToOne(() => Author, (author) => author.earnings, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "authorId" })
  author!: Author;

  @Index()
  @Column({ type: "uuid" })
  novelId!: string;

  @ManyToOne(() => Novel, (novel) => novel.earnings)
  @JoinColumn({ name: "novelId" })
  novel!: Novel;

  @Column({ type: "uuid" })
  chapterId!: string;

  @ManyToOne(() => Chapter, { nullable: true })
  chapter!: Chapter;

  @Index()
  @Column({ type: "uuid" })
  purchaseId!: string; // Hangi satın alma işlemiyle ilişkili olduğunu göstermek için

  // --- Finansal Alanlar ---

  @Column({ type: "int" })
  coinAmount!: number;

  @Column({ type: "int" })
  coinUnitPrice!: number;

  @Column({ type: "varchar", length: 3, default: Currency.TRY })
  currency!: Currency;

  @Column({ type: "bigint", transformer: new ColumnNumericTransformer() })
  grossAmount!: number;

  @Column({ type: "int" })
  authorSharePercent!: number;

  @Column({ type: "bigint", transformer: new ColumnNumericTransformer() })
  platformCommissionAmount!: number; // Kesilen komisyon tutarı

  @Column({ type: "bigint", transformer: new ColumnNumericTransformer() })
  netAmount!: number; // Yazarın hak ettiği net kazanç

  @CreateDateColumn()
  createdAt!: Date;
}
