import cron from "node-cron";
import { LessThan } from "typeorm";
import { AppDataSource } from "../database/data-source.js";
import { DeletedAccountRecovery } from "../entities/DeletedAccountRecovery.js";

export const setupDeletedAccountRecoveryCleanupJob = () => {
  cron.schedule(
    "0 3 * * *",
    async () => {
      try {
        await AppDataSource.getRepository(DeletedAccountRecovery).delete({
          expiresAt: LessThan(new Date()),
        });
      } catch (error) {
        console.error("Deleted account recovery cleanup cron hatasi:", error);
      }
    },
    {
      timezone: "Europe/Istanbul",
    },
  );
};
