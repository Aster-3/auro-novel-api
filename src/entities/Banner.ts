import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Banner {
  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "int", nullable: false })
  order!: number;

  @Column({ type: "text", nullable: false })
  bannerUrl!: string;
}
