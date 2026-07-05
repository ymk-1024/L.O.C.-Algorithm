/**
 * L.O.C. API - 統合テスト（E2E）
 * api-test.http の全リクエストを自動実行します。
 *
 * 前提条件:
 *   - Docker でMySQLが起動していること（back/docker-compose.yml）
 *   - .env が正しく設定されていること
 *   - バックエンドサーバーが起動していること（npm run dev / docker-compose up）
 *
 * 実行方法:
 *   npm test
 */

import request from 'supertest';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// .env を back/ から読み込む
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const BASE_URL = `http://localhost:${process.env.NODE_PORT || 3005}`;
const api = request(BASE_URL);

// ======================================================
// テスト間で共有する状態
// ======================================================
let userUuid    = '';
let accessToken = '';
let ownerToken  = '';
const deviceUuid  = 'test-device-jest-' + Date.now();
let sitUuid     = '';
let actUuid     = '';
let scheduleUuid = '';

const testEmail    = `jest_${Date.now()}@example.com`;
const testUsername = `jestuser_${Date.now()}`;
const testPassword = 'TestPass123!';

// ======================================================
// 1. サーバー疎通確認
// ======================================================
describe('1. サーバー疎通確認', () => {
  test('1-1. GET / → 200 "API is running"', async () => {
    const res = await api.get('/');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/API is running/i);
  });
});

// ======================================================
// 2. ユーザー (users)
// ======================================================
describe('2. ユーザー (users)', () => {
  test('2-1. POST /users → 201 ユーザー作成', async () => {
    const res = await api
      .post('/api/v1.0/users')
      .set('Content-Type', 'application/json')
      .send({ username: testUsername, password: testPassword, email: testEmail });
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('uuid');
    userUuid = res.body.data.uuid;
    console.log('  userUuid:', userUuid);
  });

  test('2-2. GET /users → 200 全ユーザー取得', async () => {
    const res = await api.get('/api/v1.0/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('2-3. GET /users/:uuid → 200 ユーザー取得', async () => {
    const res = await api.get(`/api/v1.0/users/${userUuid}`);
    expect(res.status).toBe(200);
    expect(res.body.data.uuid).toBe(userUuid);
  });
});

// ======================================================
// 3. 認証 (auth)
// ======================================================
describe('3. 認証 (auth)', () => {
  test('3-1. POST /auth/login → 200 ログイン & accessToken 取得', async () => {
    const res = await api
      .post('/api/v1.0/auth/login')
      .set('Content-Type', 'application/json')
      .send({ identifier: testEmail, password: testPassword });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    accessToken = res.body.data.accessToken;
    console.log('  accessToken 取得済み');
  });

  test('3-2. GET /auth/me → 200 認証確認', async () => {
    const res = await api
      .get('/api/v1.0/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
  });
});

// ======================================================
// 4. デバイス登録・認証 (OwnerToken Flow)
// ======================================================
describe('4. デバイス登録・認証 (OwnerToken Flow)', () => {
  test('4-1. POST /device/issue-token → 201 OwnerToken 発行', async () => {
    const res = await api
      .post('/api/v1.0/device/issue-token')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Jestテスト用センサー' });
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('ownerToken');
    ownerToken = res.body.data.ownerToken;
    console.log('  ownerToken 取得済み');
  });

  test('4-2. POST /device/self-register → 201 デバイス自己登録', async () => {
    const res = await api
      .post('/api/v1.0/device/self-register')
      .set('Content-Type', 'application/json')
      .set('Authorization', `OwnerToken ${ownerToken}`)
      .set('X-Timestamp', Math.floor(Date.now() / 1000).toString())
      .set('X-Nonce', 'jestnonce123')
      .set('X-Device-UUID', deviceUuid)
      .send({ uuid: deviceUuid, model: 'LOC-jest-test' });
    expect(res.status).toBe(201);
    console.log('  デバイス登録完了:', deviceUuid);
  });

  test('4-3. POST /device/token/refresh → 200 OwnerToken 更新', async () => {
    const res = await api
      .post('/api/v1.0/device/token/refresh')
      .set('Authorization', `OwnerToken ${ownerToken}`)
      .set('X-Timestamp', Math.floor(Date.now() / 1000).toString())
      .set('X-Nonce', 'jestnonce123')
      .set('X-Device-UUID', deviceUuid);
    expect(res.status).toBe(200);
    // newOwnerToken キーで返ってくる
    if (res.body.data?.newOwnerToken) {
      ownerToken = res.body.data.newOwnerToken;
      console.log('  ownerToken 更新済み (新トークン)');
    }
  });
});

// ======================================================
// 5. デバイス機能
// ======================================================
describe('5. デバイス機能', () => {
  test('5-1. GET /device/ping → 200 生存確認', async () => {
    const res = await api
      .get('/api/v1.0/device/ping')
      .set('Authorization', `OwnerToken ${ownerToken}`)
      .set('X-Timestamp', Math.floor(Date.now() / 1000).toString())
      .set('X-Nonce', 'jestnonce123')
      .set('X-Device-UUID', deviceUuid);
    expect(res.status).toBe(200);
  });

  test('5-2. GET /device/polling → 200 ポーリング', async () => {
    const res = await api
      .get('/api/v1.0/device/polling?is_sitting=true')
      .set('Authorization', `OwnerToken ${ownerToken}`)
      .set('X-Timestamp', Math.floor(Date.now() / 1000).toString())
      .set('X-Nonce', 'jestnonce123')
      .set('X-Device-UUID', deviceUuid);
    expect(res.status).toBe(200);
  });

  test('5-3. POST /device/status → 200 ステータス送信', async () => {
    const res = await api
      .post('/api/v1.0/device/status')
      .set('Content-Type', 'application/json')
      .set('Authorization', `OwnerToken ${ownerToken}`)
      .set('X-Timestamp', Math.floor(Date.now() / 1000).toString())
      .set('X-Nonce', 'jestnonce123')
      .set('X-Device-UUID', deviceUuid)
      .send({ battery_level: 85, is_sitting: true, other_status: { firmware_version: 'jest-v1' } });
    expect(res.status).toBe(200);
  });

  test('5-4. GET /device/settings → 200 デバイス設定取得', async () => {
    const res = await api
      .get('/api/v1.0/device/settings')
      .set('Authorization', `OwnerToken ${ownerToken}`)
      .set('X-Timestamp', Math.floor(Date.now() / 1000).toString())
      .set('X-Nonce', 'jestnonce123')
      .set('X-Device-UUID', deviceUuid);
    expect(res.status).toBe(200);
  });
});

// ======================================================
// 6. 着席データ (sit_data)
// ======================================================
describe('6. 着席データ (sit_data)', () => {
  test('6-1. POST /sit_data → 201 着席データ登録', async () => {
    const res = await api
      .post('/api/v1.0/sit_data')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ deviceUuid });
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('uuid');
    sitUuid = res.body.data.uuid;
    console.log('  sitUuid:', sitUuid);
  });

  test('6-2. GET /sit_data → 200 全着席データ取得', async () => {
    const res = await api.get('/api/v1.0/sit_data');
    expect(res.status).toBe(200);
  });

  test('6-3. GET /sit_data/:uuid → 200 UUID で取得', async () => {
    const res = await api.get(`/api/v1.0/sit_data/${sitUuid}`);
    expect(res.status).toBe(200);
    expect(res.body.data.uuid).toBe(sitUuid);
  });

  test('6-4. PUT /sit_data/:uuid → 200 終了時刻更新', async () => {
    const res = await api
      .put(`/api/v1.0/sit_data/${sitUuid}`)
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ endAt: new Date().toISOString() });
    expect(res.status).toBe(200);
  });

  test('6-5. DELETE /sit_data/:uuid → 200 削除', async () => {
    const res = await api
      .delete(`/api/v1.0/sit_data/${sitUuid}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
  });
});

// ======================================================
// 7. 活動データ (activity_data)
// ======================================================
describe('7. 活動データ (activity_data)', () => {
  test('7-1. POST /activity_data → 201 活動データ登録', async () => {
    const res = await api
      .post('/api/v1.0/activity_data')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ deviceUuid, type: 'walk' });
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('uuid');
    actUuid = res.body.data.uuid;
    console.log('  actUuid:', actUuid);
  });

  test('7-2. GET /activity_data → 200 全活動データ取得', async () => {
    const res = await api.get('/api/v1.0/activity_data');
    expect(res.status).toBe(200);
  });

  test('7-3. GET /activity_data/:uuid → 200 UUID で取得', async () => {
    const res = await api.get(`/api/v1.0/activity_data/${actUuid}`);
    expect(res.status).toBe(200);
    expect(res.body.data.uuid).toBe(actUuid);
  });

  test('7-4. DELETE /activity_data/:uuid → 200 削除', async () => {
    const res = await api
      .delete(`/api/v1.0/activity_data/${actUuid}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
  });
});

// ======================================================
// 8. スケジュール (schedule)
// ======================================================
describe('8. スケジュール (schedule)', () => {
  test('8-1. POST /schedule → 201 スケジュール登録', async () => {
    const res = await api
      .post('/api/v1.0/schedule')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Jestテスト授業', day_of_week: 1, start_time: '09:00', end_time: '10:30' });
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('uuid');
    scheduleUuid = res.body.data.uuid;
    console.log('  scheduleUuid:', scheduleUuid);
  });

  test('8-2. GET /schedule → 200 全スケジュール取得', async () => {
    const res = await api
      .get('/api/v1.0/schedule')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('8-3. GET /schedule/:uuid → 200 UUID で取得', async () => {
    const res = await api
      .get(`/api/v1.0/schedule/${scheduleUuid}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.uuid).toBe(scheduleUuid);
  });

  test('8-4. PUT /schedule/:uuid → 200 更新', async () => {
    const res = await api
      .put(`/api/v1.0/schedule/${scheduleUuid}`)
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Jestテスト授業（変更後）', day_of_week: 2, start_time: '10:00', end_time: '11:30', is_active: true });
    expect(res.status).toBe(200);
  });

  test('8-5. DELETE /schedule/:uuid → 200 削除', async () => {
    const res = await api
      .delete(`/api/v1.0/schedule/${scheduleUuid}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
  });
});

// ======================================================
// 9. クリーンアップ（ユーザー更新・ログアウト・削除）
// ======================================================
describe('9. クリーンアップ', () => {
  test('2-4. PUT /users/:uuid → 200 ユーザー更新', async () => {
    const res = await api
      .put(`/api/v1.0/users/${userUuid}`)
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ username: testUsername + '_upd', email: testEmail });
    expect(res.status).toBe(200);
  });

  test('3-3. POST /auth/logout → 200 ログアウト', async () => {
    const res = await api
      .post('/api/v1.0/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
  });

  test('2-5. DELETE /users/:uuid → 200 ユーザー削除（再ログイン後）', async () => {
    // 再ログインしてトークン更新
    const login = await api
      .post('/api/v1.0/auth/login')
      .set('Content-Type', 'application/json')
      .send({ identifier: testEmail, password: testPassword });
    const token = login.body.data?.accessToken || accessToken;

    const res = await api
      .delete(`/api/v1.0/users/${userUuid}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

