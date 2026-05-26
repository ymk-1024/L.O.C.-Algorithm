import { Router } from "express";
import usersHandler from "../handler/usersHandler.mjs";

const user = Router();

user.get('/test', usersHandler.test);

export default user;
