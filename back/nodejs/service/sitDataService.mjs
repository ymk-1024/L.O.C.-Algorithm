import sitDataRepository from '../repository/sitDataRepository.mjs';
import crypto from 'crypto';

const normalizeDateTime = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 19).replace('T', ' ');
  }

  return trimmed;
};

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
      const normalizedEndAt = normalizeDateTime(endAt);
      const newRecord = await sitDataRepository.createSitData(
        newUuid,
        deviceUuid,
        normalizedEndAt
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

  updateSitData: async (uuid, deviceUuid, endAt) => {
    try {
      const existingRecord = await sitDataRepository.getSitDataById(uuid);
      if (!existingRecord) {
        return { status: 404, message: 'Sit data not found' };
      }

      const nextDeviceUuid = deviceUuid ?? existingRecord.device_uuid;
      const nextEndAt = normalizeDateTime(endAt ?? existingRecord.end_at);

      const updatedRecord = await sitDataRepository.updateSitData(
        uuid,
        nextDeviceUuid,
        nextEndAt
      );

      return {
        status: 200,
        message: 'Sit data updated successfully',
        data: updatedRecord,
      };
    } catch (error) {
      throw new Error(`DB Error: ${error.message}`);
    }
  },

  deleteSitData: async (uuid) => {
    try {
      const existingRecord = await sitDataRepository.getSitDataById(uuid);
      if (!existingRecord) {
        return { status: 404, message: 'Sit data not found' };
      }

      await sitDataRepository.deleteSitData(uuid);

      return {
        status: 200,
        message: 'Sit data deleted successfully',
      };
    } catch (error) {
      throw new Error(`DB Error: ${error.message}`);
    }
  },
};

export default sitDataService;