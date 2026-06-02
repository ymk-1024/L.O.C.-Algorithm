// [UPDATE] usersRepository を使用してビジネスロジック実装
import usersRepository from '../repository/usersRepository.mjs';
import { v4 as uuidv4 } from 'uuid';

const test = async (testStr) => {
    let testSStr = 'NG';
    if (testStr == 'OK') {
        testSStr = 'OK';
    }

    return { status: 200, message: 'HANDLER/SERVICE OK', error: 'noError' };
};

// 全ユーザー取得
const getAllUsers = async () => {
    try {
        const results = await usersRepository.getAllUsers();
        return { status: 200, data: results, error: null };
    } catch (error) {
        console.error('getAllUsers error:', error);
        return { status: 500, data: null, error: error.message };
    }
};

// UUID でユーザー取得
const getUserById = async (uuid) => {
    try {
        const user = await usersRepository.getUserById(uuid);
        if (!user) {
            return { status: 404, data: null, error: 'User not found' };
        }
        return { status: 200, data: user, error: null };
    } catch (error) {
        console.error('getUserById error:', error);
        return { status: 500, data: null, error: error.message };
    }
};

// ユーザー作成
const createUser = async (username, password, email) => {
    try {
        const uuid = uuidv4();
        const user = await usersRepository.createUser(uuid, username, password, email);
        return { status: 201, data: user, error: null };
    } catch (error) {
        console.error('createUser error:', error);
        return { status: 500, data: null, error: error.message };
    }
};

export default {
    test,
    getAllUsers,
    getUserById,
    createUser
};
