import sitDataRepository from '../repository/sitDataRepository.mjs';
import crypto from 'crypto';

const sitDataService = {
  getAllSitData: async () => {
    try {
      const records = await sitDataRepository.getAllSitData();
      return { status: 200, data: records };
    } catch (error) {
      throw new Error(`DB Error: ${error.message}`);
    }
  },

  getSitDataById: async (uuid) => {
    try {
      const record = await sitDataRepository.getSitDataById(uuid);
      if (!record) {
        return { status: 404, message: 'Sit data not found' };
      }
      return { status: 200, data: record };
    } catch (error) {
      throw new Error(`DB Error: ${error.message}`);
    }
  },

  createSitData: async (deviceUuid, endAt = null) => {
    try {
      const newUuid = crypto.randomUUID();
      const newRecord = await sitDataRepository.createSitData(
        newUuid,
        deviceUuid,
        endAt
      );
      return {
        status: 201,
        message: 'Sit data created successfully',
        data: newRecord,
      };
    } catch (error) {
      throw new Error(`DB Error: ${error.message}`);
    }
  },
};

export default sitDataService;