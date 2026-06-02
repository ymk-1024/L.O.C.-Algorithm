// [UPDATE] usersService を呼び出してハンドラーを実装
import usersService from "../service/usersService.mjs";
import xss from "xss";

const test = async (req, res) => {
  try {
    const result = await usersService.test("OK");
    res.status(result.status).json({
        status: result.status,
        message: result.message,
        error: result.error
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// [NEW] 全ユーザー取得
const getAllUsers = async (req, res) => {
  try {
    const result = await usersService.getAllUsers();
    res.status(result.status).json(result);
  } catch (error) {
    res.status(500).json({ status: 500, error: error.message });
  }
};

// [NEW] UUID でユーザー取得
const getUserById = async (req, res) => {
  try {
    const { uuid } = req.params;
    const result = await usersService.getUserById(uuid);
    res.status(result.status).json(result);
  } catch (error) {
    res.status(500).json({ status: 500, error: error.message });
  }
};

// [NEW] ユーザー作成
const createUser = async (req, res) => {
  try {
    // [UPDATE] リクエストボディから username, password, email を取得
    // UUID はサーバー側（service層）で自動生成される
    const { username, password, email } = req.body;
    const result = await usersService.createUser(username, password, email);
    res.status(result.status).json(result);
  } catch (error) {
    res.status(500).json({ status: 500, error: error.message });
  }
};

export default {
  test,
  getAllUsers,
  getUserById,
  createUser
};
