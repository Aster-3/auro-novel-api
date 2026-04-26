import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User.js";
import { NotificationType } from "../constants/notification.constants.js";

@Entity()
export class PersonalNotification {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", select: false })
  userId!: string;

  @ManyToOne(() => User, (user) => user.notifications, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user!: User;

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

  @Column({ type: "enum", enum: NotificationType })
  type!: NotificationType;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "varchar", length: 255 })
  body!: string;

  @Column({ type: "boolean", default: false })
  isRead!: boolean;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}
