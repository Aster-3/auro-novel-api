import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.send("Hello from Novel Routes");
});

router.post("/", (req, res) => {
  const { title, author } = req.body;
  if (!title || !author) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  res.send({ title, author });
});

export default router;
