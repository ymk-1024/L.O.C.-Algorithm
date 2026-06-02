// service/usersService.mjs
// [UPDATE] db ではなく usersRepository をインポート
import usersRepository from '../repository/usersRepository.mjs'; 
import crypto from 'crypto';

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
    },

    // ユーザー作成
    createUser: async (username, password, email) => {
        try {
            // UUID の生成は「ビジネスロジック」なので Service 層の仕事！
            const newUuid = crypto.randomUUID();
            
            // Repository にデータを渡して保存してもらう
            const newUser = await usersRepository.createUser(newUuid, username, password, email);

            return { 
                status: 201, 
                message: 'User created successfully',
                data: newUser
            };
        } catch (error) {
            // メールアドレス重複などのエラーキャッチ
            if (error.code === 'ER_DUP_ENTRY') {
                return { status: 409, message: 'Email already exists' };
            }
            throw new Error(`DB Error: ${error.message}`);
        }
    }
};

export default usersService;