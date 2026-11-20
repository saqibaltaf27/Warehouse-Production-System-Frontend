import { axiosInstance } from '../axiosinstance';
import { API_ENDPOINTS } from '../endpoints';

export const inventoryPlanningApi = {
  getRawMaterials: async ({ page = 1, pageSize = 20, search = '', productLine = '', sortBy = '', sortOrder = '', all = false } = {}) => {
    const response = await axiosInstance.get(API_ENDPOINTS.INVENTORY_PLANNING.RAW_MATERIALS, {
      skipGlobalLoading: true,
      params: { page, pageSize, search, productLine, sortBy, sortOrder, all: all ? '1' : undefined },
    });
    return response.data;
  },
};
