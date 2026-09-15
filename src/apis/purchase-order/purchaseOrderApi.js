import { axiosInstance } from '../axiosinstance';
import { API_ENDPOINTS } from '../endpoints';

export const purchaseOrderApi = {
  getPurchaseRequests: async (params) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.PURCHASE_ORDER.REQUESTS, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getPurchaseRequestDetails: async (docEntry) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.PURCHASE_ORDER.DETAILS(docEntry));
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
