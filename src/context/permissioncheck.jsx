import React, { createContext, useState, useEffect, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { aclApi } from '../apis/acl/acl';
import { useAuth } from './AuthContext';

const PermissionContext = createContext(null);

export const PermissionProvider = ({ children }) => {
  const { user } = useAuth();
  const [allowedModules, setAllowedModules] = useState(new Set());
  const [allowedRoutes, setAllowedRoutes] = useState(new Set());
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) {
        setLoadingPermissions(false);
        return;
      }
      
      // Super admins don't need to fetch specific permissions
      if (user.isSuperAdmin) {
        setLoadingPermissions(false);
        return;
      }

      try {
        const empId = user.empId || user.EmpID || user.emp_id;
        
        const [allPermsRes, userPermsRes] = await Promise.all([
          aclApi.getPermissions(),
          aclApi.getUserPermissions(empId)
        ]);

        if (allPermsRes.data?.success && userPermsRes.data?.success) {
          const allPermissions = allPermsRes.data.data;
          const userPermissionIds = userPermsRes.data.data;
          
          const allowedMainModules = new Set();
          const allowedRouteSet = new Set();
          
          allPermissions.forEach(perm => {
            if (userPermissionIds.includes(perm.Id)) {
              if (perm.main_module) {
                allowedMainModules.add(perm.main_module);
              }
              if (perm.Route) {
                allowedRouteSet.add(perm.Route);
              }
            }
          });
          
          setAllowedModules(allowedMainModules);
          setAllowedRoutes(allowedRouteSet);
        }
      } catch (err) {
        console.error("Failed to load permissions", err);
      } finally {
        setLoadingPermissions(false);
      }
    };

    fetchPermissions();
  }, [user]);

  return (
    <PermissionContext.Provider value={{ allowedModules, allowedRoutes, loadingPermissions }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermission = () => useContext(PermissionContext);

export const ProtectedRoute = ({ children, requiredRoute }) => {
  const { allowedRoutes, loadingPermissions } = usePermission();
  const { user } = useAuth();

  if (loadingPermissions) {
    return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', color: '#64748b' }}>Loading...</div>;
  }

  // Super admins bypass route protection
  if (user?.isSuperAdmin) {
    return children;
  }

  // If they don't have access to this route, show the Access Restricted view
  if (requiredRoute && !allowedRoutes.has(requiredRoute)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
