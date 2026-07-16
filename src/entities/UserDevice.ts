import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import {
  DevicePlatform,
  PushProvider,
} from "../constants/push.notification.constants.js";
import { User } from "./User.js";

@Entity()
export class UserDevice {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne(() => User, (user) => user.devices, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Index({ unique: true })
  @Column({ type: "text" })
  pushToken!: string;

  @Column({ type: "enum", enum: PushProvider, default: PushProvider.EXPO })
  provider!: PushProvider;

  @Column({ type: "enum", enum: DevicePlatform })
  platform!: DevicePlatform;

  @Column({ type: "varchar", length: 255, nullable: true })
  deviceId?: string | null;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  lastSeenAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
