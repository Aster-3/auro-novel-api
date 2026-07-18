import { Router } from "express";
import AuthRoutes from "./auth.routes.js";
import NovelRoutes from "./novel.routes.js";
import UserRoutes from "./user.routes.js";
import CommentRoutes from "./comment.routes.js";
import LibraryRoutes from "./library.routes.js";
import CategoryRoutes from "./category.routes.js";
import ReplyRouter from "./reply.routes.js";
import TagRouter from "./tag.routes.js";
import ChapterRoutes from "./chapter.routes.js";
import VolumeRoutes from "./volume.routes.js";
import AuthorRoutes from "./author.routes.js";
import NovelDailyStatsRoutes from "./novel.daily.stats.routes.js";
import AdminRoutes from "./admin.routes.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";
import FeedbackRoutes from "./feedback.routes.js";
import ChapterCommentRoutes from "./chapter.comment.routes.js";
import BannerRoutes from "./banner.routes.js";

const rootRouter = Router();

rootRouter.get("/", (req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Auro Novel API</title>
    <style>
      :root {
        color-scheme: light dark;
        --bg: #f7f8fa;
        --text: #17202a;
        --muted: #687385;
        --line: #d9dee7;
        --link: #215dbb;
        --ok: #12805c;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font-family:
          Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
          "Segoe UI", sans-serif;
        line-height: 1.6;
      }

      main {
        max-width: 760px;
        margin: 0 auto;
        padding: 72px 24px;
      }

      h1 {
        margin: 0 0 8px;
        font-size: 32px;
        line-height: 1.15;
        letter-spacing: 0;
      }

      p {
        margin: 0 0 24px;
        color: var(--muted);
      }

      dl {
        margin: 28px 0;
        padding: 22px 0;
        border-top: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
        display: grid;
        grid-template-columns: 140px 1fr;
        gap: 8px 18px;
      }

      dt {
        color: var(--muted);
      }

      dd {
        margin: 0;
      }

      .ok {
        color: var(--ok);
        font-weight: 650;
      }

      a {
        color: var(--link);
        text-decoration-thickness: 1px;
        text-underline-offset: 3px;
      }

      code {
        font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
        font-size: 0.95em;
      }

      @media (prefers-color-scheme: dark) {
        :root {
          --bg: #0f1218;
          --text: #eef2f7;
          --muted: #9ba6b8;
          --line: #2a3140;
          --link: #8ab4ff;
          --ok: #6ee7b7;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Auro Novel API</h1>
      <p>Backend service for Auro Novel clients.</p>

      <dl>
        <dt>Status</dt>
        <dd class="ok">operational</dd>
        <dt>Environment</dt>
        <dd><code>${process.env.NODE_ENV || "production"}</code></dd>
        <dt>Version</dt>
        <dd><code>v1</code></dd>
      </dl>

      <p>
        Common public routes:
        <a href="/novels"><code>/novels</code></a>,
        <a href="/tags"><code>/tags</code></a>,
        <a href="/categories"><code>/categories</code></a>.
      </p>
    </main>
  </body>
</html>`);
});
rootRouter.use("/", NovelDailyStatsRoutes);
rootRouter.use("/authors", AuthorRoutes);
rootRouter.use("/auth", AuthRoutes);
rootRouter.use("/novels", NovelRoutes);
rootRouter.use("/users", UserRoutes);
rootRouter.use("/comments", CommentRoutes);
rootRouter.use("/library", LibraryRoutes);
rootRouter.use("/categories", CategoryRoutes);
rootRouter.use("/replies", ReplyRouter);
rootRouter.use("/tags", TagRouter);
rootRouter.use("/chapters", ChapterRoutes);
rootRouter.use("/chapter-comments", ChapterCommentRoutes);
rootRouter.use("/banners", BannerRoutes);
rootRouter.use("/volumes", VolumeRoutes);
rootRouter.use("/feedback", FeedbackRoutes);
rootRouter.use("/admin", adminMiddleware, AdminRoutes);

export default rootRouter;
