import deviceRepository from '../repository/deviceRepository.mjs';
import ownerTokenService from './ownerTokenService.mjs';
import sitDataRepository from '../repository/sitDataRepository.mjs';
import { v7 as uuidV7 } from 'uuid';

const handleSittingStateChange = async (deviceUuid, isSitting) => {
  try {
    const latest = await sitDataRepository.getLatestSitDataByDevice(deviceUuid);
    
    if (isSitting) {
      if (latest && latest.end_at === null) {
        return;
      }
      
      if (latest && latest.end_at !== null) {
        const diffMs = Date.now() - new Date(latest.end_at).getTime();
        if (diffMs < 2 * 60 * 1000) { // 2 minutes
          await sitDataRepository.updateSitData(latest.uuid, deviceUuid, null);
          return;
        }
      }
      
      const newUuid = uuidV7();
      await sitDataRepository.createSitData(newUuid, deviceUuid, null);
      
    } else {
      if (latest && latest.end_at === null) {
        const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await sitDataRepository.updateSitData(latest.uuid, deviceUuid, nowStr);
      }
    }
  } catch (error) {
    console.error(`[SittingStateChange Error] deviceUuid=${deviceUuid}:`, error);
  }
};


const deviceService = {
  getAllDevices: async () => {
    try {
      const devices = await deviceRepository.getAllDevices();
      return { status: 200, data: devices };
    } catch (error) {
      throw new Error(`DB Error: ${error.message}`);
    }
  },

  getDeviceById: async (uuid) => {
    try {
      const device = await deviceRepository.getDeviceById(uuid);
      if (!device) {
        return { status: 404, message: 'Device not found' };
      }
      return { status: 200, data: device };
    } catch (error) {
      throw new Error(`DB Error: ${error.message}`);
    }
  },

  createDevice: async (userUuid, name, type, status) => {
    try {
      const newUuid = uuidV7();
      const newDevice = await deviceRepository.createDevice(
        newUuid,
        userUuid,
        name,
        type,
        status
      );
      return {
        status: 201,
        message: 'Device created successfully',
        data: newDevice,
      };
    } catch (error) {
      throw new Error(`DB Error: ${error.message}`);
    }
  },

  updateDevice: async (uuid, name, type, status) => {
    try {
      const existing = await deviceRepository.getDeviceById(uuid);
      if (!existing) {
        return { status: 404, message: 'Device not found' };
      }

      const nextName   = name   ?? existing.name;
      const nextType   = type   ?? existing.type;
      const nextStatus = status ?? existing.status;

      const updated = await deviceRepository.updateDevice(uuid, nextName, nextType, nextStatus);
      return {
        status: 200,
        message: 'Device updated successfully',
        data: updated,
      };
    } catch (error) {
      throw new Error(`DB Error: ${error.message}`);
    }
  },

  deleteDevice: async (uuid) => {
    try {
      const existing = await deviceRepository.getDeviceById(uuid);
      if (!existing) {
        return { status: 404, message: 'Device not found' };
      }
      
      // OwnerToken のクリーンアップ
      const ownerTokenRepo = await import('../repository/ownerTokenRepository.mjs');
      await ownerTokenRepo.default.deleteOwnerTokenByDeviceUuid(uuid);

      await deviceRepository.deleteDevice(uuid);
      return { status: 200, message: 'Device deleted successfully' };
    } catch (error) {
      throw new Error(`DB Error: ${error.message}`);
    }
  },

  // App → サーバー: OwnerToken 発行申請（deviceUuid は不要）
  issueOwnerToken: async (userUuid, name) => {
    return await ownerTokenService.issueOwnerToken(userUuid, name);
  },

  // デバイス → サーバー: 自己登録
  // デバイスが自分で生成した uuid と OwnerToken を紐づけてサーバーに送信する
  selfRegister: async (token, deviceUuid, model) => {
    try {
      // すでに同じUUIDのデバイスが登録済みか確認
      const existing = await deviceRepository.getDeviceById(deviceUuid);
      if (existing) {
        return { status: 409, message: 'このデバイスUUIDはすでに登録されています。', data: existing };
      }

      // OwnerToken と deviceUuid を紐づける（DB更新）
      const bindResult = await ownerTokenService.bindDeviceToToken(token, deviceUuid);
      if (bindResult.status !== 200) {
        return { status: bindResult.status, message: bindResult.message };
      }

      // デバイスレコードを作成
      const device = await deviceRepository.selfRegisterDevice(
        deviceUuid,
        bindResult.userUuid,
        bindResult.name,
        model || null
      );

      return {
        status: 201,
        message: 'デバイスを登録しました。',
        data: device,
      };
    } catch (error) {
      throw new Error(`DB Error: ${error.message}`);
    }
  },

  // デバイス → サーバー: OwnerToken 更新
  refreshOwnerToken: async (currentToken) => {
    return await ownerTokenService.refreshOwnerToken(currentToken);
  },

  // 1. ポーリング用
  polling: async (deviceUuid, userUuid, isSitting) => {
    try {
      const repo = await import('../repository/deviceCommandRepository.mjs');
      await repo.default.updateLastPing(deviceUuid);

      // 着座状態の管理
      await handleSittingStateChange(deviceUuid, isSitting);

      // コマンドの取得
      const pendingCommands = await repo.default.getPendingCommands(deviceUuid);

      // スケジュールチェックによる間隔制御 (通常10000ms、イベント接近時1000ms等)
      let interval_ms = 10000;
      const now = new Date();
      const dayOfWeek = now.getDay();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const schedules = await repo.default.getActiveSchedulesByDay(userUuid, dayOfWeek);
      for (const sched of schedules) {
        // start_time / end_time は 'HH:MM:SS' 形式としてパース
        const startParts = sched.start_time.split(':');
        const startMinutes = parseInt(startParts[0], 10) * 60 + parseInt(startParts[1], 10);
        
        const endParts = sched.end_time.split(':');
        const endMinutes = parseInt(endParts[0], 10) * 60 + parseInt(endParts[1], 10);

        // イベント（開始または終了）の15分以内なら間隔を短くする
        if (Math.abs(currentMinutes - startMinutes) <= 15 || Math.abs(currentMinutes - endMinutes) <= 15) {
          interval_ms = 1000;
          break;
        }
      }

      return {
        status: 200,
        data: {
          interval_ms,
          pending_commands: pendingCommands,
        }
      };
    } catch (error) {
      throw new Error(`DB Error: ${error.message}`);
    }
  },

  // 2. コマンド詳細取得
  getCommandDetails: async (deviceUuid, commandId) => {
    try {
      const repo = await import('../repository/deviceCommandRepository.mjs');
      const command = await repo.default.getCommandById(commandId, deviceUuid);
      if (!command) {
        return { status: 404, message: 'コマンドが見つかりません。' };
      }
      return { status: 200, data: command };
    } catch (error) {
      throw new Error(`DB Error: ${error.message}`);
    }
  },

  // 3. 自己ステータス送信
  updateDeviceStatus: async (deviceUuid, batteryLevel, isSitting, otherStatus) => {
    try {
      const repo = await import('../repository/deviceCommandRepository.mjs');
      await repo.default.insertDeviceStatusLog(deviceUuid, batteryLevel, isSitting, otherStatus);

      // 着座状態の管理
      await handleSittingStateChange(deviceUuid, isSitting);

      return { status: 200, message: 'ステータスを更新しました。' };
    } catch (error) {
      throw new Error(`DB Error: ${error.message}`);
    }
  },

  // 4. デバイス設定取得
  getDeviceSettings: async (deviceUuid) => {
    try {
      // 現在設定テーブルはないため、仮の設定を返す
      return {
        status: 200,
        data: {
          vibration_intensity: 'medium',
          detection_sensitivity: 'high',
        }
      };
    } catch (error) {
      throw new Error(`DB Error: ${error.message}`);
    }
  },

  // 5. デバイスの生存確認
  ping: async (deviceUuid) => {
    try {
      const repo = await import('../repository/deviceCommandRepository.mjs');
      await repo.default.updateLastPing(deviceUuid);
      return { status: 200, message: 'pong' };
    } catch (error) {
      throw new Error(`DB Error: ${error.message}`);
    }
  },

  // 6. 実行確認 (ACK)
  ackCommand: async (deviceUuid, commandId) => {
    try {
      const repo = await import('../repository/deviceCommandRepository.mjs');
      const command = await repo.default.getCommandById(commandId, deviceUuid);
      if (!command) {
        return { status: 404, message: 'コマンドが見つかりません。' };
      }
      await repo.default.updateCommandStatus(commandId, deviceUuid, 'completed');
      return { status: 200, message: 'コマンドを完了としてマークしました。' };
    } catch (error) {
      throw new Error(`DB Error: ${error.message}`);
    }
  },

};

export default deviceService;