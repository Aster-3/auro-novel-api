import { runSeeders } from "typeorm-extension";
import { AppDataSource } from "./data-source.js";

async function run() {
  try {
    console.log("🌱 Seed işlemi başlıyor...");
    await runSeeders(AppDataSource);

    console.log("✨ Mock veriler başarıyla yüklendi!");
  } catch (error) {
    console.error("❌ Seed sırasında bir hata oluştu:");
    console.error(error);
  } finally {
    await AppDataSource.destroy();
    process.exit(0);
  }
}
run();
