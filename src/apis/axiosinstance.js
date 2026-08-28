import axios from 'axios';
import { API_ENDPOINTS } from './endpoints';

// Create the Axios instance
export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // Important: This allows sending and receiving HttpOnly cookies (like the refresh token)
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let refreshSubscribers = [];
const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

// Helper to resolve all queued requests once the token is refreshed
const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// Global Loading Event Handlers
let activeRequests = 0;
const startGlobalLoading = () => {
  if (activeRequests === 0) {
    window.dispatchEvent(new Event('show-global-loading'));
  }
  activeRequests++;
};

const stopGlobalLoading = () => {
  activeRequests = Math.max(0, activeRequests - 1);
  if (activeRequests === 0) {
    window.dispatchEvent(new Event('hide-global-loading'));
  }
};

// --- REQUEST INTERCEPTOR ---
axiosInstance.interceptors.request.use(
  (config) => {
    // We don't attach the access token to authentication endpoints
    const noAuthEndpoints = [
      API_ENDPOINTS.AUTH.LOGIN,
      API_ENDPOINTS.AUTH.REFRESH,
      API_ENDPOINTS.AUTH.LOGOUT
    ];

    if (!noAuthEndpoints.includes(config.url)) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Do not show global loading for background refresh calls or if explicitly skipped
    if (config.url !== API_ENDPOINTS.AUTH.REFRESH && !config.skipGlobalLoading) {
      startGlobalLoading();
    }
    
    return config;
  },
  (error) => {
    stopGlobalLoading();
    return Promise.reject(error);
  }
);

// --- RESPONSE INTERCEPTOR ---
axiosInstance.interceptors.response.use(
  (response) => {
    if (response.config.url !== API_ENDPOINTS.AUTH.REFRESH && !response.config.skipGlobalLoading) {
      stopGlobalLoading();
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // We make sure to stop loading if it's an error and not retrying yet
    if (originalRequest && originalRequest.url !== API_ENDPOINTS.AUTH.REFRESH && !originalRequest.skipGlobalLoading && error.response?.status !== 401) {
      stopGlobalLoading();
    } else if (originalRequest && originalRequest._retry && !originalRequest.skipGlobalLoading) {
      // If we are already retrying and it fails, stop loading
      stopGlobalLoading();
    }

    // If the error is 401 (Unauthorized) and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // If the failing request WAS the refresh endpoint, it means our refresh token is dead.
      // We must log out the user.
      if (originalRequest.url === API_ENDPOINTS.AUTH.REFRESH) {
        localStorage.removeItem('accessToken');
        window.location.href = '/login'; // Redirect to login
        return Promise.reject(error);
      }

      // Mark this request so we don't retry it infinitely
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          // Attempt to refresh the token.
          // We use the same axiosInstance because it already has withCredentials: true
          const res = await axiosInstance.post(API_ENDPOINTS.AUTH.REFRESH);
          
          const newAccessToken = res.data?.data?.accessToken;
          if (newAccessToken) {
            localStorage.setItem('accessToken', newAccessToken);
            
            // Re-run all queued requests with the new token
            onRefreshed(newAccessToken);
            isRefreshing = false;

            // Retry the original request immediately
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            // This is a retry, so it will go through the request interceptor again.
            // We shouldn't double increment, so we let the request interceptor handle it
            return axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed (e.g. cookie expired or invalid). Log out.
          isRefreshing = false;
          refreshSubscribers = []; // Clear queue
          stopGlobalLoading();
          localStorage.removeItem('accessToken');
          window.location.href = '/login'; 
          return Promise.reject(refreshError);
        }
      } else {
        // If a refresh is already happening, we put this request into the queue
        // It returns a promise that resolves once the refresh succeeds.
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(axiosInstance(originalRequest));
          });
        });
      }
    }

    if (error.response?.status === 403 || error.response?.status === 429) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }

    // For all other errors, just reject
    return Promise.reject(error);
  }
);
