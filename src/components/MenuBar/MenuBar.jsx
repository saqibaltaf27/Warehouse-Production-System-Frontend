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
  IconHome
} from "@tabler/icons-react";
import BrandLogo from "../../global-components/BrandLogo/BrandLogo";
import "./MenuBar.css";
import { usePermission } from "../../context/permissioncheck";

const MenuBar = ({ onLogout, onNavigate, user, isOpen }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [expandedSubMenu, setExpandedSubMenu] = useState(null);
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

  const toggleMenu = (title, e) => {
    e.preventDefault();
    setExpandedMenu(expandedMenu === title ? null : title);
    setExpandedSubMenu(null); // Reset sub-menu when top-level toggles
  };

  const toggleSubMenu = (title, e) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedSubMenu(expandedSubMenu === title ? null : title);
  };

  const menuItems = [
    {
      title: "Production",
      path: "/production",
      main_module: "Production",
      icon: <IconSettings size={18} stroke={1.5} />,
      subItems: [
        { title: 'Dashboard', path: '/production?tab=dashboard', tabKey: 'dashboard' },
        { title: 'Overview', path: '/production?tab=quality-control', tabKey: 'quality-control' },
        { title: 'Production Orders', path: '/production?tab=production-orders', tabKey: 'production-orders' },
        { title: 'Purchase Request', path: '/production?tab=purchase-order', tabKey: 'purchase-order' },     
        { title: 'Production Planning', path: '/production?tab=production-planning', tabKey: 'production-planning' },
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
      title: "Staff",
      path: "/staff",
      main_module: "Staff",
      icon: <IconUsers size={18} stroke={1.5} />,
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
      allowedModules.has(item.main_module),
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
          <NavLink to="/" className={({ isActive }) => `nav-workspace-header ${isActive || location.pathname === '/' ? 'active' : ''}`}>
            <div className="nav-item-left">
              <span className="nav-item-icon">
                <IconHome size={18} stroke={1.5} />
              </span>
              <span>My Workspace</span>
            </div>
          </NavLink>
          
          <nav className="sidebar-nav-list">
            {visibleMenuItems.map((item, index) => {
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedMenu === item.title;
              
              const isGroupActive = location.pathname.startsWith(item.path) || (hasSubItems && item.subItems.some(sub => {
                if (sub.subItems) return sub.subItems.some(ss => location.pathname.startsWith(ss.path.split('?')[0]));
                return location.pathname.startsWith(sub.path.split('?')[0]);
              }));

              return (
                <div key={index} className="nav-item-group">
                  <NavLink
                    to={hasSubItems ? "#" : item.path}
                    className={({ isActive }) =>
                      `sidebar-nav-item ${(!hasSubItems && isActive) || (hasSubItems && isGroupActive) ? "active" : ""}`
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
                        const isSubExpanded = expandedSubMenu === subItem.title;

                        return (
                          <div key={subIdx}>
                            {hasSubSubItems ? (
                              <a
                                href="#"
                                className={`sidebar-subnav-item ${isSubExpanded ? 'active' : ''}`}
                                style={{ fontWeight: 600, color: '#4b5563', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                onClick={(e) => toggleSubMenu(subItem.title, e)}
                              >
                                <span>{subItem.title}</span>
                                <IconChevronRight size={14} className={`nav-chevron ${isSubExpanded ? "expanded" : ""}`} />
                              </a>
                            ) : (
                              <NavLink
                                to={subItem.path}
                                className={() => `sidebar-subnav-item ${location.search.includes(subItem.tabKey) ? "active" : ""}`}
                                onClick={() => {
                                  onNavigate();
                                }}
                              >
                                {subItem.title}
                              </NavLink>
                            )}
                            
                            {hasSubSubItems && isSubExpanded && (
                              <div className="sidebar-sub-subnav-list" style={{ display: 'flex', flexDirection: 'column', marginLeft: '12px', borderLeft: '1px solid #e5e7eb', paddingLeft: '8px', marginTop: '4px' }}>
                                {subItem.subItems.map((ssItem, ssIdx) => (
                                  <NavLink
                                    key={`ss-${ssIdx}`}
                                    to={ssItem.path}
                                    className={() => `sidebar-subnav-item ${location.search.includes(ssItem.tabKey) ? "active" : ""}`}
                                    onClick={() => {
                                      onNavigate();
                                    }}
                                  >
                                    {ssItem.title}
                                  </NavLink>
                                ))}
                              </div>
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
