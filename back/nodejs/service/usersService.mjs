// service/usersService.mjs
// [UPDATE] db ではなく usersRepository をインポート
import usersRepository from '../repository/usersRepository.mjs'; 
import crypto from 'crypto';
import { v7 as uuidV7 } from 'uuid';

const usersService = {
    // テスト用
    test: async (msg) => {
        return { status: 200, message: `Service layer is working! Received: ${msg}` };
    },

    // 全ユーザー取得
    getAllUsers: async () => {
        try {
            // [UPDATE] SQL は書かずに Repository にお願いするだけ！
            const users = await usersRepository.getAllUsers();
            return { status: 200, data: users };
        } catch (error) {
            throw new Error(`DB Error: ${error.message}`);
        }
    },

    // UUID でユーザー取得
    getUserById: async (uuid) => {
        try {
            const user = await usersRepository.getUserById(uuid);
            if (!user) {
                return { status: 404, message: 'User not found' };
            }
            return { status: 200, data: user };
        } catch (error) {
            throw new Error(`DB Error: ${error.message}`);
        }
    }
};

// パスワードハッシュ化
const hashPassword = (password) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const key = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${key}`;
};

const verifyPassword = (password, storedPassword) => {
    if (!storedPassword || typeof storedPassword !== 'string') return false;

    if (!storedPassword.includes(':')) {
        return crypto.timingSafeEqual(Buffer.from(password), Buffer.from(storedPassword));
    }

    const [salt, expectedHash] = storedPassword.split(':');
    const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(expectedHash, 'hex'), Buffer.from(derivedKey, 'hex'));
};

// ユーザー作成
usersService.createUser = async (username, password, email) => {
    try {
        const newUuid = uuidV7();
        const hashedPassword = hashPassword(password);
        const newUser = await usersRepository.createUser(newUuid, username, hashedPassword, email);

        return {
            status: 201,
            message: 'User created successfully',
            data: newUser
        };
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return { status: 409, message: 'Email already exists' };
        }
        throw new Error(`DB Error: ${error.message}`);
    }
};

usersService.updateUser = async (uuid, username, password, email) => {
    try {
        const existingUser = await usersRepository.getUserById(uuid);
        if (!existingUser) {
            return { status: 404, message: 'User not found' };
        }

        const nextUsername = username ?? existingUser.username;
        const nextEmail = email ?? existingUser.email;
        const nextPassword = password ? hashPassword(password) : existingUser.password;

        const updatedUser = await usersRepository.updateUser(uuid, nextUsername, nextPassword, nextEmail);

        return {
            status: 200,
            message: 'User updated successfully',
            data: updatedUser
        };
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return { status: 409, message: 'Email already exists' };
        }
        throw new Error(`DB Error: ${error.message}`);
    }
};

usersService.verifyPassword = verifyPassword;

usersService.findUserForLogin = async (identifier) => {
    try {
        return await usersRepository.findUserByEmailOrUsername(identifier);
    } catch (error) {
        throw new Error(`DB Error: ${error.message}`);
    }
};

usersService.deleteUser = async (uuid) => {
    try {
        const existingUser = await usersRepository.getUserById(uuid);
        if (!existingUser) {
            return { status: 404, message: 'User not found' };
        }

        await usersRepository.deleteUser(uuid);

        return {
            status: 200,
            message: 'User deleted successfully'
        };
    } catch (error) {
        throw new Error(`DB Error: ${error.message}`);
    }
};

export default usersService;