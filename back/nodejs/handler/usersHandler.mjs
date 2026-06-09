// [UPDATE] usersService を呼び出してハンドラーを実装
import usersService from "../service/usersService.mjs";
import xss from "xss";

const sanitize = (value) => typeof value === 'string' ? xss(value) : value;

const test = async (req, res, next) => {
  try {
    const result = await usersService.test("OK");
    res.status(result.status).json({
        status: result.status,
        message: result.message,
        error: result.error
    });
  } catch (error) {
    next(error);
  }
};

// [NEW] 全ユーザー取得
const getAllUsers = async (req, res, next) => {
  try {
    const result = await usersService.getAllUsers();
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

// [NEW] UUID でユーザー取得
const getUserById = async (req, res, next) => {
  try {
    const uuid = sanitize(req.params.uuid);
    const result = await usersService.getUserById(uuid);
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

// [NEW] ユーザー作成
const createUser = async (req, res, next) => {
  try {
    // [UPDATE] リクエストボディから username, password, email を取得
    // UUID はサーバー側（service層）で自動生成される
    const username = sanitize(req.body.username);
    const password = sanitize(req.body.password);
    const email = sanitize(req.body.email);
    const result = await usersService.createUser(username, password, email);
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const uuid = sanitize(req.params.uuid);
    const username = sanitize(req.body.username);
    const password = sanitize(req.body.password);
    const email = sanitize(req.body.email);

    const result = await usersService.updateUser(uuid, username, password, email);
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const uuid = sanitize(req.params.uuid);
    const result = await usersService.deleteUser(uuid);
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

export default {
  test,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
