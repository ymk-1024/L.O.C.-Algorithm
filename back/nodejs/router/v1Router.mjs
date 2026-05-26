import { Router } from "express";
import usersRouter from "./usersRouter.mjs";

const v = Router();

v.use('/users', usersRouter);

export default v;
