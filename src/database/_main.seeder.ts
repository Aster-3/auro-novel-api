import { Seeder, SeederFactoryManager } from "typeorm-extension";
import { DataSource } from "typeorm";
import { User } from "../entities/User.js";
import { Category } from "../entities/Category.js";
import { mockUsers, mockCategories } from "./mock.data.js";

export default class MainSeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const userFactory = factoryManager.get(User);
    const categoryFactory = factoryManager.get(Category);

    // 1. Kategorileri Ekle
    console.log("Kategoriler ekleniyor...");
    const categories = [];
    for (const catData of mockCategories) {
      const category = await categoryFactory.save(catData);
      categories.push(category);
    }

    // 2. Kullanıcıları Ekle
    console.log("Kullanıcılar ekleniyor...");
    const users = [];
    for (const userData of mockUsers) {
      const user = await userFactory.save(userData);
      users.push(user);
    }

    console.log(
      `${categories.length} kategori ve ${users.length} kullanıcı başarıyla eklendi!`,
    );
  }
}
