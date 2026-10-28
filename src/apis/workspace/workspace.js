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
  getMonthWorkingPos: async (params) => {
    const response = await axiosInstance.get(API_ENDPOINTS.PRODUCTION_PLANNING.MONTH_WORKING_POS, {
      params,
      skipGlobalLoading: true,
    });
    return response.data;
  },
  getPostedGrns: async (params) => {
    const response = await axiosInstance.get(API_ENDPOINTS.SAMPLING.POSTED_GRNS, {
      params,
      skipGlobalLoading: true,
    });
    return response.data;
  },
};
