import "reflect-metadata";
import { DataSource } from "typeorm";
import { getEnv } from "../utils/getEnv.js";
import * as Entities from "../entities/_index.js";
import MainSeeder from "./_main.seeder.js";
import type { DataSourceOptions } from "typeorm";
import { SeederOptions } from "typeorm-extension";
import userFactory from "./factories/user.factory.js";
import categoryFactory from "./factories/category.factory.js";

const isProduction = process.env.NODE_ENV === "production";

const databaseUrl = process.env.DATABASE_URL;
const ssl =
  process.env.DATABASE_SSL === "true"
    ? { rejectUnauthorized: false }
    : undefined;

const connectionOptions: DataSourceOptions = databaseUrl
  ? {
      type: "postgres",
      url: databaseUrl,
      ssl,
    }
  : {
      type: "postgres",
      host: getEnv("DB_HOST"),
      port: parseInt(getEnv("DB_PORT")),
      username: getEnv("DB_USER"),
      password: getEnv("DB_PASSWORD"),
      database: getEnv("DB_NAME"),
      ssl,
    };

const options: DataSourceOptions & SeederOptions = {
  ...connectionOptions,
  synchronize: false,
  logging: false,
  seeds: [MainSeeder],
  factories: [userFactory, categoryFactory],
  entities: Object.values(Entities),
  migrations: [
    isProduction ? "dist/database/migrations/*.js" : "src/database/migrations/*.ts",
  ],
  subscribers: [],
};
export const AppDataSource = new DataSource(options);
