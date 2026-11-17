import { axiosInstance } from '../axiosinstance';
import { API_ENDPOINTS } from '../endpoints';

export const authApi = {
  login: async (credentials) => {
    return axiosInstance.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
  },

  logout: async () => {
    return axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT);
  },

  getMe: async () => {
    return axiosInstance.get(API_ENDPOINTS.AUTH.ME, { skipGlobalLoading: true });
  }
};
