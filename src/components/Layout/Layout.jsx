import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, useSearchParams, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { IconMenu2, IconLock, IconChevronDown, IconUser } from "@tabler/icons-react";
import MenuBar from "../MenuBar/MenuBar";
import Breadcrumb from "../../global-components/Breadcrumb/Breadcrumb";
import { usePermission } from "../../context/permissioncheck";
import "./Layout.css";

const Layout = () => {
  const { user, logout, fetchUser } = useAuth();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const { allowedModules, loadingPermissions } = usePermission();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (fetchUser) {
      fetchUser();
    }
  }, [pathname, fetchUser]);

  const firstName = user?.FirstName || "";
  const lastName = user?.LastName || "";
  const fullName = `${firstName} ${lastName}`.trim() || "Admin User";
  const roleName = user?.DesignationName || user?.RoleName || "Manager";

  const moduleTitles = {
    "/workspace": "My Workspace",
    "/workspace/ticket": "Tickets",
    "/production/tickets": "Production Tickets",
    "/qc/tickets": "Quality Tickets",
    "/engineering-dashboard/tickets": "Engineering Tickets",
    "/production": "Production",
    "/production-plan/add": "Create Production Plan",
    "/production-plan/edit": "Edit Production Plan",
    "/production-plan/view": "View Production Plan",
    "/qc": "Quality Control",
    "/engineering-dashboard": "Engineering Dashboard",
    "/inventory": "Inventory",
    "/machine": "Machine",
    "/machine-efficiency": "Machine Efficiency",
    // "/cost-analysis": "Cost Analysis",
    "/staff": "Staff",
    "/sampling": "Sampling",
    "/access-control": "Access Control",
    "/costing/overview": "Costing Overview",
    "/costing": "Costing",
    "/dashboard": "Dashboard",
    "/": "My Workspace"
  };

  const tabTitles = {
    'dashboard': 'Dashboard',
    'production-orders': 'Production Orders',
    'purchase-order': 'Purchase Orders',
    'production-planning': 'Production Planning',
    'critical-material': 'Critical Material',
    'material-shortages': 'Critical Material',
    'batch-expiry': 'Batch Expiry',
    'material-capacity': 'Material-based Production Capacity',
    // 'cost-analysis': 'Cost Analysis',
    'quality-control': 'Production Dashboard',
    'complaints': 'Complain Management',
    'coa': 'Certificate of Analysis',
    'template': 'COA Templates',
    'qc': 'Sampling',
    'Under Inspection': 'Under Inspection',
    'qc-test-report': 'QC Test Report',
    'QC Parameters': 'QC Parameters',
    'equipment-pm': 'Line wise Equipments & PM',
    'machine': 'Machine',
    'overview': 'Inventory Overview',
    'master': 'Item Master',
    'staff': 'Staff',
    'hr-cost': 'HR Cost',
    'material-cost': 'Material Cost',
    'quality-testing-cost': 'Quality Testing Cost',
    'factory-overhead': 'Factory Overhead'
  };

  const costingSubTitles = {
    'management': 'HR Cost — Management',
    'direct-hr': 'HR Cost — Direct HR',
    'quality': 'HR Cost — Quality',
    'repair-maintenance': 'Factory Overhead — Repair & Maintenance',
    'stationary-printing': 'Factory Overhead — Stationary & Printing',
    'generator-diesel': 'Factory Overhead — Generator / Diesel',
    'drap': 'Factory Overhead — DRAP',
    'utilities': 'Factory Overhead — Utilities',
    'pest-control': 'Factory Overhead — Pest Control',
    'facilitation': 'Factory Overhead — Facilitation',
    'depreciation': 'Factory Overhead — Depreciation'
  };

  const planTitles = {
    'production-order': 'Production Planning',
    'man-effiency': 'Man Efficiency',
    'machine-efficiency': 'Machine Efficiency',
    'shortages': 'Material Shortages',
    'expiry': 'Batch Expiry'
  };

  let pageTitle = "Dashboard";
  const currentTab = searchParams.get('tab');
  const planTab = searchParams.get('planTab');
  const currentSub = searchParams.get('sub');

  if (pathname.startsWith('/costing') && currentSub && costingSubTitles[currentSub]) {
    pageTitle = costingSubTitles[currentSub];
  } else if (planTab && planTitles[planTab]) {
    pageTitle = planTitles[planTab];
  } else if (currentTab && tabTitles[currentTab]) {
    pageTitle = tabTitles[currentTab];
  } else if (moduleTitles[pathname]) {
    pageTitle = moduleTitles[pathname];
  } else {
    const matchedPath = Object.keys(moduleTitles).find(key => key !== '/' && pathname.startsWith(key));
    if (matchedPath) {
      pageTitle = moduleTitles[matchedPath];
    }
  }

  if (loadingPermissions) {
    return (
      <div className="layout-loading">
        Loading your workspace...
      </div>
    );
  }

  if (allowedModules.size === 0 && !user?.isSuperAdmin) {
    return (
      <div className="layout-denied">
        <IconLock className="layout-denied-icon" size={64} />
        <h1 className="layout-denied-title">Access Denied</h1>
        <p className="layout-denied-text">
          You don't have any permissions assigned to your account. Please contact the <strong>Enterprise Technology</strong> department for access.
        </p>
        <button className="layout-denied-button" onClick={logout}>
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="dribbble-layout">
      {/* Full-width Top Bar */}
      <header className="dribbble-top-header">
        <div className="header-left">
          <button
            type="button"
            className="mobile-menu-button"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <IconMenu2 size={22} />
          </button>

          <NavLink to="/workspace" className="header-brand-link">
            <img
              src="/images/ldslogo.png"
              alt="LDS Logo"
              className="header-brand-logo"
            />
            <div className="header-brand-text-wrap">
              <span className="header-brand-title">Production Management System</span>
              <span className="header-brand-subtitle">ViSole Group of Companies</span>
            </div>
          </NavLink>
        </div>

        <div className="header-right">
          <div className="header-profile-wrap" ref={profileMenuRef}>
            <div
              className="header-profile-card"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="profile-avatar-circle"><IconUser size={18} stroke={1.2} /></div>
              <div className="profile-info-text">
                <span className="profile-name-text">{fullName}</span>
                <span className="profile-role-text">{roleName}</span>
              </div>
              <IconChevronDown size={14} className="profile-chevron-icon" />
            </div>

            {showProfileMenu && (
              <div className="profile-dropdown-menu">
                <button onClick={logout} className="dropdown-logout-btn">
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Body: Menu bar on left below topbar, content on right */}
      <div className="dribbble-body-wrapper">
        <MenuBar
          user={user}
          isOpen={sidebarOpen}
          onNavigate={() => setSidebarOpen(false)}
        />
        <main className="dribbble-content">
          <div className="content-page-title-bar">
            <h1 className="content-page-title-text">{pageTitle}</h1>
          </div>
          <div className="content-page-inner">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
