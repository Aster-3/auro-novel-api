import "reflect-metadata";
import { DataSource } from "typeorm";
import { getEnv } from "../utils/getEnv.js";
import * as Entities from "../entities/_index.js";
import MainSeeder from "./_main.seeder.js";
import { DataSourceOptions } from "typeorm/browser";
import { SeederOptions } from "typeorm-extension";
import userFactory from "./factories/user.factory.js";
import categoryFactory from "./factories/category.factory.js";

const options: DataSourceOptions & SeederOptions = {
  type: "postgres",
  host: getEnv("DB_HOST"),
  port: parseInt(getEnv("DB_PORT")),
  username: getEnv("DB_USER"),
  password: getEnv("DB_PASSWORD"),
  database: getEnv("DB_NAME"),
  synchronize: true,
  logging: false,
  seeds: [MainSeeder],
  factories: [userFactory, categoryFactory],
  entities: Object.values(Entities),
  migrations: ["src/migrations/*.ts"],
  subscribers: [],
};
export const AppDataSource = new DataSource(options);
