import activityDataRepository from '../repository/activityDataRepository.mjs';
import { v7 as uuidV7 } from 'uuid';

const activityDataService = {
  getAllActivityData: async () => {
    try {
      const records = await activityDataRepository.getAllActivityData();
      return { status: 200, data: records };
    } catch (error) {
      throw new Error(`DB Error: ${error.message}`);
    }
  },

  getActivityDataById: async (uuid) => {
    try {
      const record = await activityDataRepository.getActivityDataById(uuid);
      if (!record) {
        return { status: 404, message: 'Activity data not found' };
      }
      return { status: 200, data: record };
    } catch (error) {
      throw new Error(`DB Error: ${error.message}`);
    }
  },

  createActivityData: async (deviceUuid, type) => {
    try {
      const newUuid = uuidV7();
      const newRecord = await activityDataRepository.createActivityData(
        newUuid,
        deviceUuid,
        type
      );
      return {
        status: 201,
        message: 'Activity data created successfully',
        data: newRecord,
      };
    } catch (error) {
      throw new Error(`DB Error: ${error.message}`);
    }
  },

  deleteActivityData: async (uuid) => {
    try {
      const existing = await activityDataRepository.getActivityDataById(uuid);
      if (!existing) {
        return { status: 404, message: 'Activity data not found' };
      }
      await activityDataRepository.deleteActivityData(uuid);
      return { status: 200, message: 'Activity data deleted successfully' };
    } catch (error) {
      throw new Error(`DB Error: ${error.message}`);
    }
  },
};

export default activityDataService;