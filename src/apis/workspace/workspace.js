import { axiosInstance } from '../axiosinstance';
import { API_ENDPOINTS } from '../endpoints';

export const workspaceApi = {
  getOpenProductionOrders: async (params) => {
    const response = await axiosInstance.get(API_ENDPOINTS.DASHBOARD.OPEN_PRODUCTION_ORDERS, {
      params,
      skipGlobalLoading: true,
    });
    return response.data;
  },
  getTodayWorkingPlans: async (params) => {
    const response = await axiosInstance.get(API_ENDPOINTS.PRODUCTION_PLANNING.TODAY_WORKING_PLANS, {
      params,
      skipGlobalLoading: true,
    });
    return response.data;
  },
};
