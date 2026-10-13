import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  IconSearch,
  IconChevronRight,
  IconHelp,
  IconSettings,
  IconChecklist,
  IconTool,
  IconBox,
  IconEngine,
  IconUsers,
  IconFlask,
  IconSettingsAutomation,
  IconReportMoney
} from "@tabler/icons-react";
import BrandLogo from "../../global-components/BrandLogo/BrandLogo";
import "./MenuBar.css";
import { usePermission } from "../../context/permissioncheck";

const MenuBar = ({ onLogout, onNavigate, user, isOpen }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [openFlyoutTitle, setOpenFlyoutTitle] = useState(null);
  const [flyoutDismissed, setFlyoutDismissed] = useState(false);
  const { allowedModules, loadingPermissions } = usePermission();
  const location = useLocation();
  const profileMenuRef = useRef(null);

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
    setOpenFlyoutTitle(null);
  }, [location.pathname, location.search]);

  const toggleMenu = (title, e) => {
    e.preventDefault();
    setExpandedMenu(expandedMenu === title ? null : title);
    setOpenFlyoutTitle(null);
  };

  const menuItems = [
    {
      title: "My Workspace",
      path: "/workspace",
      main_module: "Production",
      icon: <IconSettings size={18} stroke={1.5} />, 
    },
    {
      title: "Production",
      path: "/production",
      main_module: "Production",
      icon: <IconSettings size={18} stroke={1.5} />,
      subItems: [
        { title: 'Dashboard', path: '/production?tab=dashboard', tabKey: 'dashboard' },
        { title: 'Monthly Report', path: '/production?tab=quality-control', tabKey: 'quality-control' },
        { title: 'Production Orders', path: '/production?tab=production-orders', tabKey: 'production-orders' },
        { title: 'Purchase Request', path: '/production?tab=purchase-order', tabKey: 'purchase-order' },     
        {
          title: 'Production Planning',
          subItems: [
            { title: 'Production Planning', path: '/production?tab=production-planning&planTab=production-order', tabKey: 'production-order' },
            { title: 'Man Effiency', path: '/production?tab=production-planning&planTab=man-effiency', tabKey: 'man-effiency' },
            { title: 'Machine Efficiency', path: '/production?tab=production-planning&planTab=machine-efficiency', tabKey: 'machine-efficiency' },
            { title: 'Material Shortages', path: '/production?tab=production-planning&planTab=shortages', tabKey: 'shortages' },
            { title: 'Batch Expiry', path: '/production?tab=production-planning&planTab=expiry', tabKey: 'expiry' },
          ]
        },
        { title: 'Cost Analysis', path: '/production?tab=cost-analysis', tabKey: 'cost-analysis' },
       //{ title: 'Production Trend', path: '/production?tab=production-trend', tabKey: 'production-trend' },
       
      ]
    },
    {
      title: "Quality",
      path: "/qc",
      main_module: "QC",
      icon: <IconChecklist size={18} stroke={1.5} />,
      subItems: [
        { title: 'Complaints', path: '/qc?tab=complaints', tabKey: 'complaints' },
        { title: 'COA', path: '/qc?tab=coa', tabKey: 'coa' },
        { title: 'COA Templates', path: '/qc?tab=template', tabKey: 'template' },
        { 
          title: 'Sampling', 
          subItems: [
            { title: 'Sampling', path: '/sampling?tab=qc', tabKey: 'qc' },
            { title: 'Under Inspection', path: '/sampling?tab=Under Inspection', tabKey: 'Under Inspection' },
            { title: 'Quality Assurance', path: '/sampling?tab=quality-assurance', tabKey: 'quality-assurance' },
            { title: 'QC Parameters', path: '/sampling?tab=QC Parameters', tabKey: 'QC Parameters' },
          ]
        },
      ]
    },
    {
      title: "Engineering",
      path: "/engineering-dashboard",
      main_module: "Engineering Dashboard",
      icon: <IconTool size={18} stroke={1.5} />,
      subItems: [
        { title: 'Dashboard', path: '/engineering-dashboard?tab=dashboard', tabKey: 'dashboard' },
        { title: 'Line wise Equipments & PM', path: '/engineering-dashboard?tab=equipment-pm', tabKey: 'equipment-pm' },
        { title: 'Machine', path: '/machine', tabKey: 'machine' },
      ]
    },
    {
      title: "Inventory",
      path: "/inventory",
      main_module: "Inventory",
      icon: <IconBox size={18} stroke={1.5} />,
      subItems: [
        { title: 'Inventory Overview', path: '/inventory?tab=overview', tabKey: 'overview' },
        { title: 'Item Master', path: '/inventory?tab=master', tabKey: 'master' },
      ]
    },

    {
      title: "Costing",
      path: "/costing",
      main_module: "Costing",
      icon: <IconReportMoney size={18} stroke={1.5} />,
      subItems: [
       // { title: 'Overview', path: '/costing/overview', tabKey: 'overview', main_module: 'Costing' },
        { title: 'Staff', path: '/staff', tabKey: 'staff', main_module: 'Staff' },
      ]
    },
  
  ];

  let visibleMenuItems = menuItems;

  if (user?.isSuperAdmin) {
    visibleMenuItems.push({
      title: "Access Control",
      path: "/access-control",
      main_module: "Access Control",
      icon: <IconSettingsAutomation size={18} stroke={1.5} />,
    });
  } else if (!loadingPermissions) {
    visibleMenuItems = menuItems.filter((item) =>
      allowedModules.has(item.main_module) ||
      (item.subItems && item.subItems.some((sub) =>
        allowedModules.has(sub.main_module) ||
        allowedModules.has(sub.title)
      ))
    );
  } else {
    visibleMenuItems = [];
  }

  const firstName = user?.FirstName || "";
  const lastName = user?.LastName || "";
  const fullName = `${firstName} ${lastName}`.trim() || "Admin User";
  const roleName = user?.DesignationName || user?.RoleName || "Manager";

  let initials = "AD";
  if (firstName) {
    initials = firstName.charAt(0).toUpperCase();
    if (lastName) {
      initials += lastName.charAt(0).toUpperCase();
    }
  }

  return (
    <aside className={`left-sidebar-container ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header-section">
        {/*
        <div className="sidebar-brand-wrapper">
          <BrandLogo size="sm" />
        </div>
        */}
      </div>

      <div className="sidebar-scrollable-content">
        <div className="sidebar-nav-section">
          <nav className="sidebar-nav-list">
            {visibleMenuItems.map((item, index) => {
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedMenu === item.title;
              
              const isGroupActive = location.pathname.startsWith(item.path) || (hasSubItems && item.subItems.some(sub => {
                if (sub.subItems) return sub.subItems.some(ss => ss.path && location.pathname.startsWith(ss.path.split('?')[0]));
                return sub.path && location.pathname.startsWith(sub.path.split('?')[0]);
              }));
              const coveredByGroup = !hasSubItems && visibleMenuItems.some((other) =>
                other.subItems?.length &&
                other.path === item.path &&
                location.pathname.startsWith(other.path)
              );

              return (
                <div key={index} className="nav-item-group">
                  <NavLink
                    to={hasSubItems ? "#" : item.path}
                    className={({ isActive }) =>
                      `sidebar-nav-item ${(!hasSubItems && isActive && !coveredByGroup) || (hasSubItems && isGroupActive) ? "active" : ""}`
                    }
                    onClick={(e) => {
                      if (hasSubItems) {
                        toggleMenu(item.title, e);
                      } else {
                        onNavigate();
                      }
                    }}
                  >
                    <div className="nav-item-left">
                      {item.icon && <span className="nav-item-icon">{item.icon}</span>}
                      <span className="nav-item-text">{item.title}</span>
                    </div>
                    {hasSubItems && (
                      <IconChevronRight size={14} className={`nav-chevron ${isExpanded ? "expanded" : ""}`} />
                    )}
                  </NavLink>
                  {hasSubItems && isExpanded && (
                    <div className="sidebar-subnav-list">
                      {item.subItems.map((subItem, subIdx) => {
                        const hasSubSubItems = subItem.subItems && subItem.subItems.length > 0;
                        const isSubActive = Boolean(
                          !hasSubSubItems &&
                          subItem.path &&
                          (subItem.path.includes('?')
                            ? location.pathname === subItem.path.split('?')[0] && (subItem.tabKey ? location.search.includes(subItem.tabKey) : true)
                            : location.pathname === subItem.path)
                        );

                        return (
                          <div key={subIdx}>
                            {hasSubSubItems ? (
                              (() => {
                                const isOpen = openFlyoutTitle === subItem.title;

                                return (
                                  <div
                                    className={`sidebar-subnav-group-relative ${isOpen ? 'open' : ''} ${flyoutDismissed ? 'flyout-dismissed' : ''}`}
                                    onMouseLeave={() => {
                                      setFlyoutDismissed(false);
                                      setOpenFlyoutTitle(null);
                                    }}
                                  >
                                    <button
                                      type="button"
                                      className={`sidebar-subnav-item sidebar-subnav-toggle sidebar-subnav-flyout-trigger ${isOpen ? 'open' : ''}`}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setOpenFlyoutTitle(openFlyoutTitle === subItem.title ? null : subItem.title);
                                      }}
                                    >
                                      <span>{subItem.title}</span>
                                      <IconChevronRight size={14} className="nav-chevron" />
                                    </button>

                                    <div className="sidebar-flyout-menu">
                                      {subItem.subItems.map((flyItem, flyIdx) => {
                                        const isFlyActive = Boolean(
                                          flyItem.path &&
                                          (flyItem.path.includes('?')
                                            ? location.pathname === flyItem.path.split('?')[0] && (flyItem.tabKey ? location.search.includes(flyItem.tabKey) : true)
                                            : location.pathname === flyItem.path)
                                        );

                                        return (
                                          <NavLink
                                            key={`fly-${flyIdx}`}
                                            to={flyItem.path}
                                            className={() => `sidebar-flyout-item ${isFlyActive ? 'active' : ''}`}
                                            onClick={() => {
                                              setOpenFlyoutTitle(null);
                                              setFlyoutDismissed(true);
                                              onNavigate();
                                            }}
                                          >
                                            <span className="sidebar-flyout-text">{flyItem.title}</span>
                                          </NavLink>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })()
                            ) : (
                              <NavLink
                                to={subItem.path}
                                className={() => `sidebar-subnav-item ${isSubActive ? "active" : ""}`}
                                onClick={() => {
                                  onNavigate();
                                }}
                              >
                                {subItem.title}
                              </NavLink>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="sidebar-footer">
        {/* <nav className="sidebar-footer-nav">
          <button className="sidebar-footer-item">
            <IconHelp size={18} stroke={1.5} />
            <span>Help & Support</span>
          </button>
          <button className="sidebar-footer-item">
            <IconSettings size={18} stroke={1.5} />
            <span>Settings</span>
          </button>
        </nav> */}

        <div className="sidebar-profile-wrap" ref={profileMenuRef}>
          <div
            className="sidebar-profile-card"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="profile-avatar-circle">{initials}</div>
            <div className="profile-info-text">
              <span className="profile-name-text">{fullName}</span>
              <span className="profile-role-text">{roleName}</span>
            </div>
          </div>
          
          {showProfileMenu && (
            <div className="profile-dropdown-menu">
              <button onClick={onLogout} className="dropdown-logout-btn">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default MenuBar;
