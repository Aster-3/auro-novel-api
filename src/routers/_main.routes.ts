import { Router } from "express";
import AuthRoutes from "./auth.routes.js";
import NovelRoutes from "./novel.routes.js";
import UserRoutes from "./user.routes.js";
import CommentRoutes from "./comment.routes.js";
import LibraryRoutes from "./library.routes.js";
import CategoryRoutes from "./category.routes.js";
import ReplyRouter from "./reply.routes.js";

const rootRouter = Router();

rootRouter.get("/", (req, res) => res.send("Hello from Main Routes"));
rootRouter.use("/auth", AuthRoutes);
rootRouter.use("/novels", NovelRoutes);
rootRouter.use("/users", UserRoutes);
rootRouter.use("/comments", CommentRoutes);
rootRouter.use("/library", LibraryRoutes);
rootRouter.use("/categories", CategoryRoutes);
rootRouter.use("/replies", ReplyRouter);

export default rootRouter;
