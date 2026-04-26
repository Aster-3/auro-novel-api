import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
export class GlobalNotification {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "varchar", length: 255 })
  body!: string;

  @Column({
    type: "jsonb",
    nullable: true,
    transformer: {
      to: (value: any) => value,
      from: (value: any) => {
        if (typeof value === "string") {
          try {
            return JSON.parse(value);
          } catch {
            return value;
          }
        }
        return value;
      },
    },
  })
  data?: any;

  @CreateDateColumn()
  createdAt!: Date;
}
