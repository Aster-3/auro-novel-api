import "reflect-metadata";
import express from "express";
import { AppDataSource } from "./database/data-source.js";
import { GlobalErrorHandler } from "./middlewares/error.handler.js";
import helmet from "helmet";
import rootRouter from "./routers/_main.routes.js";
import path from "path";
import "./container.js";

const PORT = process.env.PORT || 3000;
const corsOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();

app.use(helmet());
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && corsOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Max-Age", "86400");
    res.header("Vary", "Origin");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    );
  }

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});
app.use(express.json());
app.use(
  "/uploads",
  express.static(path.join(import.meta.dirname, "../uploads")),
);

app.use("/", rootRouter);

app.use(GlobalErrorHandler);

async function startServer() {
  try {
    const ds = await AppDataSource.initialize();
    console.log("Database connected.");

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}.`);
    });

    process.on("SIGINT", async () => {
      await AppDataSource.destroy();
      server.close(() => console.log("Server and DB connection closed."));
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
