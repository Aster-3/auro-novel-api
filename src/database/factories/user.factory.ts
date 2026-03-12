import { setSeederFactory } from "typeorm-extension";
import { User } from "../../entities/User.js";

export default setSeederFactory(User, (faker) => {
  const user = new User();
  // Buradaki değerler, MainSeeder'da veri göndermediğin durumlar için fallback (yedek) olur
  return user;
});
