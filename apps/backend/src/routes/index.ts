import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { paperRouter } from "../modules/papers/paper.routes.js";
import { syncRouter } from "../modules/api-sync/sync.routes.js";
import { searchRouter } from "../modules/search/search.routes.js";
import { embeddingRouter } from "../modules/embeddings/embedding.routes.js";
import { trendRouter } from "../modules/trends/trend.routes.js";
import { reportRouter } from "../modules/reports/report.routes.js";

export const apiRouter: Router = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/papers", paperRouter);
apiRouter.use("/search", searchRouter); // Phase B — semantic search
apiRouter.use("/trends", trendRouter); // Phase B/C — publication trends
apiRouter.use("/reports", reportRouter); // Phase C — RAG analytical reports
apiRouter.use("/admin", syncRouter); // /admin/sync
apiRouter.use("/admin", embeddingRouter); // /admin/embed

// More routers will be mounted here as modules land:
//   apiRouter.use("/bookmarks", bookmarkRouter);
