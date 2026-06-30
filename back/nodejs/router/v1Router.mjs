import { Router } from "express";
import usersRouter from "./usersRouter.mjs";
import authRouter from "./authRouter.mjs";
import deviceRouter from "./deviceRouter.mjs";
import sitDataRouter from "./sitDataRouter.mjs";
import activityDataRouter from "./activityDataRouter.mjs";
import scheduleRouter from "./scheduleRouter.mjs";

const v = Router();

v.use('/users', usersRouter);
v.use('/auth', authRouter);
v.use('/device', deviceRouter);
v.use('/sit_data', sitDataRouter);
v.use('/activity_data', activityDataRouter);
v.use('/schedule', scheduleRouter);

export default v;
