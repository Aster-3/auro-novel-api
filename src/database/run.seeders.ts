import { AppDataSource } from "./data-source.js";
import MainSeeder from "./_main.seeder.js";

async function run() {
  try {
    console.log("Seed islemi basliyor...");
    await AppDataSource.initialize();
    await new MainSeeder().run(AppDataSource, null as never);

    console.log("Mock veriler basariyla yuklendi!");
  } catch (error) {
    console.error("Seed sirasinda bir hata olustu:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

run();
