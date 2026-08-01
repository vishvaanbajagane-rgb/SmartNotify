import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import messagesRouter from "./messages.js";
import dashboardRouter from "./dashboard.js";
import uploadRouter from "./upload.js";
import exportRouter from "./export.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(messagesRouter);
router.use(dashboardRouter);
router.use(uploadRouter);
router.use(exportRouter);

export default router;
