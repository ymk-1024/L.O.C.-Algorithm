import { Router } from "express";
import usersHandler from "../handler/usersHandler.mjs";
import { validateUserCreation } from "../middleware/validationMiddleware.mjs";
import authMiddleware from "../middleware/authMiddleware.mjs";

const user = Router();

user.get('/test', usersHandler.test);

// 読み取り系：認証不要
user.get('/', usersHandler.getAllUsers);
user.get('/:uuid', usersHandler.getUserById);
user.get('/:uuid/settings', authMiddleware.autoRefreshAuth, usersHandler.getUserSettings);

// 書き込み系：JWT 認証必須
user.post('/',              validateUserCreation, usersHandler.createUser);
user.put('/:uuid',          authMiddleware.autoRefreshAuth, usersHandler.updateUser);
user.put('/:uuid/settings', authMiddleware.autoRefreshAuth, usersHandler.updateUserSettings);
user.delete('/:uuid',       authMiddleware.autoRefreshAuth, usersHandler.deleteUser);

export default user;
