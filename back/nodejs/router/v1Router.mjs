import { Router } from "express";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import usersRouter from "./usersRouter.mjs";
import authRouter from "./authRouter.mjs";
import deviceRouter from "./deviceRouter.mjs";
import sitDataRouter from "./sitDataRouter.mjs";
import activityDataRouter from "./activityDataRouter.mjs";
import scheduleRouter from "./scheduleRouter.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const v = Router();

v.get('/version', (req, res) => {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), 'utf8'));
    res.json({ status: 200, version: pkg.version || '1.0.0' });
  } catch (error) {
    res.json({ status: 200, version: '1.0.0' });
  }
});

v.use('/users', usersRouter);
v.use('/auth', authRouter);
v.use('/device', deviceRouter);
v.use('/sit_data', sitDataRouter);
v.use('/activity_data', activityDataRouter);
v.use('/schedule', scheduleRouter);

export default v;
