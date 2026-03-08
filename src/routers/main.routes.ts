import { Router } from "express";
import AuthRoutes from "./auth.routes.js";
import NovelRoutes from "./novel.routes.js";
import UserRoutes from "./user.routes.js";
import CommentRoutes from "./comment.routes.js";

const rootRouter = Router();

rootRouter.get("/", (req, res) => res.send("Hello from Main Routes"));
rootRouter.use("/auth", AuthRoutes);
rootRouter.use("/novel", NovelRoutes);
rootRouter.use("/users", UserRoutes);
rootRouter.use("/comments", CommentRoutes);

export default rootRouter;
