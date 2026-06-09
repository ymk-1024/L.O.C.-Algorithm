import { Router } from "express";
import usersHandler from "../handler/usersHandler.mjs";
// [NEW] 検証ミドルウェア
import { validateUserCreation } from "../middleware/validationMiddleware.mjs";

const user = Router();

user.get('/test', usersHandler.test);
// [NEW] GET / - 全ユーザー取得
user.get('/', usersHandler.getAllUsers);
// [NEW] GET /:uuid - UUID でユーザー取得
user.get('/:uuid', usersHandler.getUserById);
// [NEW] POST / - ユーザー作成（username, password, email のみ必須。uuid はサーバー側で自動生成）
user.post('/', validateUserCreation, usersHandler.createUser);
// [NEW] PUT /:uuid - ユーザー更新
user.put('/:uuid', usersHandler.updateUser);
// [NEW] DELETE /:uuid - ユーザー削除
user.delete('/:uuid', usersHandler.deleteUser);

export default user;
