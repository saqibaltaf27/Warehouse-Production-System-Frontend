import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { IconMenu2, IconLock } from "@tabler/icons-react";
import MenuBar from "../MenuBar/MenuBar";
import Breadcrumb from "../../global-components/Breadcrumb/Breadcrumb";
import { usePermission } from "../../context/permissioncheck";
import "./Layout.css";

const Layout = () => {
  const { user, logout, fetchUser } = useAuth();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { allowedModules, loadingPermissions } = usePermission();

  useEffect(() => {
    if (fetchUser) {
      fetchUser();
    }
  }, [pathname, fetchUser]);
  const moduleTitles = {
    "/dashboard": "Dashboard",
    "/engineering-dashboard": "Engineering Dashboard",
    "/analytics": "Analytics",
    "/production-trend": "Production Trend",
    "/machine-efficiency": "Machine Efficiency",
    "/inventory": "Inventory",
    "/orders": "Orders",
    "/delivery": "Delivery",
    "/cost-analysis": "Cost Analysis",
    "/production-planning": "Production Planning",
    "/production-orders": "Production Orders",
    "/production-template": "Production Template",
    "/qc": "QC",
    "/access-control": "Access Control",
  };

  let breadcrumbItems = [];
  if (pathname.startsWith('/inventory/item-master/')) {
    const parts = pathname.split('/');
    const itemCode = decodeURIComponent(parts[parts.length - 1]);
    breadcrumbItems = [
      { label: 'Inventory', href: '/inventory' },
      { label: itemCode, current: true }
    ];
  } else if (pathname.startsWith('/access-control/')) {
    const isPermissionControl = pathname.includes('/permission-control');
    const isAccessPermission = pathname.includes('/access-permission');
    
    breadcrumbItems = [
      { label: 'Access Control', href: '/access-control' }
    ];
    
    if (isPermissionControl) {
      breadcrumbItems.push({ label: 'Permission Control', current: true });
    } else if (isAccessPermission) {
      breadcrumbItems.push({ label: 'User Permissions', current: true });
    }
  } else {
    let pageTitle = "Dashboard";
    
    // Exact match
    if (moduleTitles[pathname]) {
      pageTitle = moduleTitles[pathname];
    } else {
      // Find matching base path for sub-routes
      const matchedPath = Object.keys(moduleTitles).find(key => pathname.startsWith(key + '/'));
      if (matchedPath) {
        pageTitle = moduleTitles[matchedPath];
      }
    }
    
    breadcrumbItems = [{ label: pageTitle, current: true }];
  }

  if (loadingPermissions) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', color: '#64748b' }}>
        Loading your workspace...
      </div>
    );
  }

  if (allowedModules.size === 0 && !user?.isSuperAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f8fafc', padding: '2rem', textAlign: 'center' }}>
        <IconLock size={64} color="#94a3b8" style={{ marginBottom: '1.5rem' }} />
        <h1 style={{ color: '#0f172a', fontSize: '2rem', marginBottom: '1rem', fontWeight: 'bold' }}>Access Denied</h1>
        <p style={{ color: '#475569', fontSize: '1.1rem', marginBottom: '2.5rem', maxWidth: '400px' }}>
          You don't have any permissions assigned to your account. Please contact the <strong>Enterprise Technology</strong> department for access.
        </p>
        <button 
          onClick={logout} 
          style={{ padding: '0.75rem 2rem', backgroundColor: '#023e25', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="dribbble-layout">
      <MenuBar
        user={user}
        onLogout={logout}
        isOpen={sidebarOpen}
        onNavigate={() => setSidebarOpen(false)}
      />
      <div className="dribbble-main-wrapper">
        <header className="dribbble-top-header">
          <div className="header-left">
            <button
              type="button"
              className="mobile-menu-button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <IconMenu2 size={22} />
            </button>
          </div>
        </header>
        <main className="dribbble-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
