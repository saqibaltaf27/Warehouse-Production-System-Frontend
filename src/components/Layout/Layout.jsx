import { useState, useEffect } from "react";
import { Outlet, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { IconMenu2, IconLock } from "@tabler/icons-react";
import MenuBar from "../MenuBar/MenuBar";
import Breadcrumb from "../../global-components/Breadcrumb/Breadcrumb";
import { usePermission } from "../../context/permissioncheck";
import "./Layout.css";

const Layout = () => {
  const { user, logout, fetchUser } = useAuth();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { allowedModules, loadingPermissions } = usePermission();

  useEffect(() => {
    if (fetchUser) {
      fetchUser();
    }
  }, [pathname, fetchUser]);

  const moduleTitles = {
    "/production": "Production",
    "/qc": "QC",
    "/engineering-dashboard": "Engineering Dashboard",
    "/inventory": "Inventory",
    "/machine": "Machine",
    "/staff": "Staff",
    "/sampling": "Sampling",
    "/access-control": "Access Control",
    "/": "My Workspace"
  };

  const tabTitles = {
    'dashboard': 'Dashboard',
    'production-orders': 'Production Orders',
    'purchase-order': 'Purchase Request',
    'production-planning': 'Production Planning',
    'cost-analysis': 'Cost Analysis',
    'quality-control': 'Overview',
    'complaints': 'Complaints',
    'coa': 'COA',
    'template': 'COA Templates',
    'qc': 'Sampling',
    'Under Inspection': 'Under Inspection',
    'quality-assurance': 'Quality Assurance',
    'QC Parameters': 'QC Parameters',
    'equipment-pm': 'Line wise Equipments & PM',
    'machine': 'Machine',
    'overview': 'Inventory Overview',
    'master': 'Item Master'
  };

  let pageTitle = "Dashboard";
  const currentTab = searchParams.get('tab');
  
  if (currentTab && tabTitles[currentTab]) {
    pageTitle = tabTitles[currentTab];
  } else if (moduleTitles[pathname]) {
    pageTitle = moduleTitles[pathname];
  } else {
    const matchedPath = Object.keys(moduleTitles).find(key => pathname.startsWith(key + '/'));
    if (matchedPath) {
      pageTitle = moduleTitles[matchedPath];
    }
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
        <header className="dribbble-top-header" style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e2e4e8', backgroundColor: '#fff' }}>
          <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              type="button"
              className="mobile-menu-button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <IconMenu2 size={22} />
            </button>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: 0 }}>
              {pageTitle}
            </h1>
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
