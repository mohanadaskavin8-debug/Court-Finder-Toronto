import { Router, type IRouter } from "express";
import healthRouter from "./health";
import courtsRouter from "./courts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(courtsRouter);

export default router;
