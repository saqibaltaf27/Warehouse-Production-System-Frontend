import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { IconMenu2 } from "@tabler/icons-react";
import MenuBar from "../MenuBar/MenuBar";
import Breadcrumb from "../../global-components/Breadcrumb/Breadcrumb";
import "./Layout.css";

const Layout = () => {
  const { user, logout, fetchUser } = useAuth();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (fetchUser) {
      fetchUser();
    }
  }, [pathname, fetchUser]);
  const moduleTitles = {
    "/dashboard": "Dashboard",
    "/analytics": "Analytics",
    "/production-trend": "Production Trend",
    "/machine-efficiency": "Machine Efficiency",
    "/inventory": "Inventory",
    "/orders": "Orders",
    "/delivery": "Delivery",
    "/cost-analysis": "Cost Analysis",
    "/production-planning": "Production Planning",
    "/settings": "Settings",
  };

  let breadcrumbItems = [];
  if (pathname.startsWith('/inventory/item-master/')) {
    const parts = pathname.split('/');
    const itemCode = decodeURIComponent(parts[parts.length - 1]);
    breadcrumbItems = [
      { label: 'Inventory', href: '/inventory' },
      { label: itemCode, current: true }
    ];
  } else {
    const pageTitle = moduleTitles[pathname] || "Dashboard";
    breadcrumbItems = [{ label: pageTitle, current: true }];
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
            <div>
              <Breadcrumb items={breadcrumbItems} />
            </div>
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
