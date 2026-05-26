import { Router } from "express";
import v1Router from './v1Router.mjs';

const router = Router();

router.use('/v1.0', v1Router);

export default router;
