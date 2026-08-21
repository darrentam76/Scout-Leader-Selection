import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scoutRouter from "./scout";

const router: IRouter = Router();

router.use(healthRouter);
router.use(scoutRouter);

export default router;
