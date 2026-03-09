import { Router } from "express";
import AuthRoutes from "./auth.routes.js";
import NovelRoutes from "./novel.routes.js";
import UserRoutes from "./user.routes.js";
import CommentRoutes from "./comment.routes.js";
import LibraryRoutes from "./library.routes.js";

const rootRouter = Router();

rootRouter.get("/", (req, res) => res.send("Hello from Main Routes"));
rootRouter.use("/auth", AuthRoutes);
rootRouter.use("/novels", NovelRoutes);
rootRouter.use("/users", UserRoutes);
rootRouter.use("/comments", CommentRoutes);
rootRouter.use("/library", LibraryRoutes);

export default rootRouter;
