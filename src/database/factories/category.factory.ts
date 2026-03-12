import { setSeederFactory } from "typeorm-extension";
import { Category } from "../../entities/Category.js";

export default setSeederFactory(Category, (faker) => {
  const category = new Category();
  // Buradaki değerler, MainSeeder'da veri göndermediğin durumlar için fallback (yedek) olur
  return category;
});
