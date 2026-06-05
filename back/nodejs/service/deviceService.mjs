import deviceRepository from '../repository/deviceRepository.mjs';
import crypto from 'crypto';

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
      const newUuid = crypto.randomUUID();
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
};

export default deviceService;