import deviceRepository from '../repository/deviceRepository.mjs';
import { v7 as uuidV7 } from 'uuid';

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
      await deviceRepository.deleteDevice(uuid);
      return { status: 200, message: 'Device deleted successfully' };
    } catch (error) {
      throw new Error(`DB Error: ${error.message}`);
    }
  },
};

export default deviceService;