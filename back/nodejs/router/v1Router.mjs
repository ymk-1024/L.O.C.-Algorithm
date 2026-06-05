import { Router } from "express";
import usersRouter from "./usersRouter.mjs";
import deviceRouter from "./deviceRouter.mjs";
import sitDataRouter from "./sitDataRouter.mjs";
import activityDataRouter from "./activityDataRouter.mjs";

const v = Router();

v.use('/users', usersRouter);
v.use('/device', deviceRouter);
v.use('/sit_data', sitDataRouter);
v.use('/activity_data', activityDataRouter);

export default v;
