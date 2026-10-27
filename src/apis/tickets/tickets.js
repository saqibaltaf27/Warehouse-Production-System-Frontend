import { axiosInstance } from '../axiosinstance';
import { API_ENDPOINTS } from '../endpoints';

export const ticketsApi = {
  getTickets: async (params) => {
    const response = await axiosInstance.get(API_ENDPOINTS.TICKETS.LIST, { params, skipGlobalLoading: true });
    return response.data;
  },
  createTicket: async (payload) => {
    const response = await axiosInstance.post(API_ENDPOINTS.TICKETS.CREATE, payload, { skipGlobalLoading: true });
    return response.data;
  },
  getTicket: async (id) => {
    const response = await axiosInstance.get(API_ENDPOINTS.TICKETS.DETAIL(id), { skipGlobalLoading: true });
    return response.data;
  },
  updateTicket: async (id, payload) => {
    const response = await axiosInstance.patch(API_ENDPOINTS.TICKETS.UPDATE(id), payload, { skipGlobalLoading: true });
    return response.data;
  },
  addRemark: async (id, remark) => {
    const response = await axiosInstance.post(API_ENDPOINTS.TICKETS.REMARKS(id), { remark }, { skipGlobalLoading: true });
    return response.data;
  },
  getEmployees: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.TICKETS.EMPLOYEES, { skipGlobalLoading: true });
    return response.data;
  },
};
