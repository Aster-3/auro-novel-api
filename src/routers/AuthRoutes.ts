import { Router } from "express";
import { AppDataSource } from "../database/data-source.js";
import { User } from "../entities/User.js";
const router = Router();

router.post("/register", async (req, res) => {
  const { username, nickname, email, password } = req.body;
  if (!username || !nickname || !email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const repo = AppDataSource.getRepository(User);
  const registeredUser = await repo.save({
    username,
    nickname,
    email,
    password,
  });
  res.json({ user: registeredUser });
});

export default router;
