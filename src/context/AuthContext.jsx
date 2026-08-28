import { createContext, useState, useEffect, useContext, useCallback } from "react";
import { authApi } from "../apis/auth/auth";

const AuthContext = createContext(null);

const SUPER_ADMIN_IDS = ["2142", "1949"]; // List of EmpIDs to treat as super admins

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await authApi.getMe();
      if (response.data.success) {
        const userData = response.data.data;
        const empIdStr = String(userData.empId || userData.EmpID || userData.id || userData.emp_id);
        const isSuperAdmin = SUPER_ADMIN_IDS.includes(empIdStr);
        setUser({ ...userData, isSuperAdmin });
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      // We don't remove token here because the interceptor will handle 401s and refresh it if possible.
      // If refresh fails, the interceptor will clear the token and redirect to login.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (credentials) => {
    const response = await authApi.login(credentials);
    const { accessToken } = response.data.data;
    localStorage.setItem("accessToken", accessToken);
    await fetchUser();
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      localStorage.removeItem("accessToken");
      setUser(null);
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, fetchUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
