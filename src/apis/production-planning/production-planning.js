import { axiosInstance } from '../axiosinstance';

export const productionPlanningApi = {
  getManpowerProductivity: async (page = 1, pageSize = 10) => {
    return await axiosInstance.get(`/production-planning/manpower?page=${page}&pageSize=${pageSize}`);
  },
  
  addManpowerProductivity: async (data) => {
    return await axiosInstance.post('/production-planning/manpower', data);
  }
};
