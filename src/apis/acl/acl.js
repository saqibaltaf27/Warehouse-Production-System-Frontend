import { axiosInstance } from '../axiosinstance';
import { API_ENDPOINTS } from '../endpoints';

export const aclApi = {
  getEmployees: async (params) => {
    return axiosInstance.get(API_ENDPOINTS.ACL.EMPLOYEES, { params });
  },

  getEmployeeById: async (id) => {
    return axiosInstance.get(API_ENDPOINTS.ACL.EMPLOYEE_BY_ID(id));
  },

  getPermissions: async () => {
    return axiosInstance.get(API_ENDPOINTS.ACL.PERMISSIONS);
  },

  addPermission: async (data) => {
    return axiosInstance.post(API_ENDPOINTS.ACL.PERMISSIONS, data);
  },

  updatePermission: async (id, data) => {
    return axiosInstance.put(API_ENDPOINTS.ACL.PERMISSION_BY_ID(id), data);
  },

  deletePermission: async (id) => {
    return axiosInstance.delete(API_ENDPOINTS.ACL.PERMISSION_BY_ID(id));
  },

  getUserPermissions: async (id) => {
    return axiosInstance.get(API_ENDPOINTS.ACL.USER_PERMISSIONS(id));
  },

  saveUserPermissions: async (id, permissionIds) => {
    return axiosInstance.post(API_ENDPOINTS.ACL.USER_PERMISSIONS(id), { permissionIds });
  }
};
