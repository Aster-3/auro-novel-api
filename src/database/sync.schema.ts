import { AppDataSource } from "./data-source.js";

async function syncSchema() {
  if (process.env.ALLOW_SCHEMA_SYNC !== "true") {
    throw new Error(
      "Schema sync is disabled. Set ALLOW_SCHEMA_SYNC=true for local/dev use.",
    );
  }

  try {
    console.log("Schema sync basliyor...");
    await AppDataSource.initialize();
    await AppDataSource.synchronize();
    console.log("Schema sync tamamlandi.");
  } catch (error) {
    console.error("Schema sync sirasinda hata olustu:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

syncSchema();
