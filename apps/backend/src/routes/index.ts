import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { paperRouter } from "../modules/papers/paper.routes.js";
import { syncRouter } from "../modules/api-sync/sync.routes.js";
import { searchRouter } from "../modules/search/search.routes.js";
import { embeddingRouter } from "../modules/embeddings/embedding.routes.js";
import { trendRouter } from "../modules/trends/trend.routes.js";
import { reportRouter } from "../modules/reports/report.routes.js";
import { gapsRouter } from "../modules/gaps/gaps.routes.js";
import { bookmarkRouter } from "../modules/bookmarks/bookmark.routes.js";
import { analyticsRouter } from "../modules/analytics/analytics.routes.js";
import { qualityRouter } from "../modules/quality/quality.routes.js";
import { adminRouter } from "../modules/admin/admin.routes.js";

export const apiRouter: Router = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/papers", paperRouter);
apiRouter.use("/search", searchRouter); // Phase B — semantic search
apiRouter.use("/trends", trendRouter); // Phase B/C — publication trends
apiRouter.use("/reports", reportRouter); // Phase C — RAG analytical reports
apiRouter.use("/gaps", gapsRouter); // Phase D — research gaps
apiRouter.use("/bookmarks", bookmarkRouter); // Sprint 3 — bookmarks
apiRouter.use("/analytics", analyticsRouter); // Phase D — search analytics
apiRouter.use("/quality", qualityRouter); // Quality & Feedback — LLM-judge + user ratings
apiRouter.use("/admin", syncRouter); // /admin/sync
apiRouter.use("/admin", embeddingRouter); // /admin/embed
apiRouter.use("/admin", adminRouter); // /admin/users, /admin/stats — user management
