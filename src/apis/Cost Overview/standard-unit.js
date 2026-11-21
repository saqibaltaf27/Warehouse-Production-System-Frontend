import { axiosInstance } from '../axiosinstance';
import { API_ENDPOINTS } from '../endpoints';

export const standardUnitApi = {
  getItems: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.STANDARD_UNIT_MAN_HOURS.ITEMS, {
      skipGlobalLoading: true,
    });
    return response.data;
  },

  list: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.STANDARD_UNIT_MAN_HOURS.LIST, {
      skipGlobalLoading: true,
    });
    return response.data;
  },

  create: async (payload) => {
    const response = await axiosInstance.post(
      API_ENDPOINTS.STANDARD_UNIT_MAN_HOURS.CREATE,
      payload,
    );
    return response.data;
  },

  update: async (id, payload) => {
    const response = await axiosInstance.put(
      API_ENDPOINTS.STANDARD_UNIT_MAN_HOURS.UPDATE(id),
      payload,
    );
    return response.data;
  },
};
