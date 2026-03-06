import "reflect-metadata";
import { AppDataSource } from "./database/data-source.js";
import express from "express";
import { User } from "./entities/User.js";
import { Novel } from "./entities/index.js";
import AuthRoutes from "./routers/AuthRoutes.js";

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());

app.get("/", async (req, res) => {
  const userRepo = AppDataSource.getRepository(User);
  const novelRepo = AppDataSource.getRepository(Novel);

  const allUsers = await userRepo.find();
  const allNovels = await novelRepo.find();

  res.json({ users: allUsers, novels: allNovels });
});

app.use("/auth", AuthRoutes);

app.post("/", (req, res) => {
  const { username, nickname, email, password } = req.body;
  if (!username || !nickname || !email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  console.log({ username, nickname, email, password });
  res.send({ username, nickname, email, password });
});

async function startServer() {
  try {
    await AppDataSource.initialize();
    console.log("Database connected.");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}.`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
