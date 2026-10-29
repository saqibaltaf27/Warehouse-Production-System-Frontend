import { axiosInstance } from "../axiosinstance";
import { API_ENDPOINTS } from "../endpoints";

export const ldsDxApi = {
  getDashboard: (params) =>
    axiosInstance.get(API_ENDPOINTS.LDS_DX.DASHBOARD, { params, skipGlobalLoading: true }).then((res) => res.data),
};
