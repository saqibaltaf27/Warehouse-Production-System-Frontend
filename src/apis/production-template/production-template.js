import { axiosInstance } from '../axiosinstance';
import { API_ENDPOINTS } from '../endpoints';

export const productionTemplateApi = {
  getProductionOrders: () => {
    return axiosInstance.get(API_ENDPOINTS.PRODUCTION_TEMPLATE.ORDERS, { skipGlobalLoading: true });
  },
  
  getManpowerProductivity: async (page = 1, pageSize = 10) => {
    return await axiosInstance.get(`/production-template/manpower?page=${page}&pageSize=${pageSize}`);
  },
  
  addManpowerProductivity: async (data) => {
    return await axiosInstance.post('/production-template/manpower', data);
  },
  
  getDailyEfficiency: async (page = 1, pageSize = 10) => {
    return await axiosInstance.get(`/production-template/efficiency?page=${page}&pageSize=${pageSize}`);
  },
  
  addDailyEfficiency: async (data) => {
    return await axiosInstance.post('/production-template/efficiency', data);
  },
  
  getQualityPerformance: async (page = 1, pageSize = 10) => {
    return await axiosInstance.get(`/production-template/quality?page=${page}&pageSize=${pageSize}`);
  },
  
  addQualityPerformance: async (data) => {
    return await axiosInstance.post('/production-template/quality', data);
  }
};
