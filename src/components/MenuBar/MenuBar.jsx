import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  IconSearch,
  IconChevronRight,
  IconSettings,
  IconChecklist,
  IconTool,
  IconBox,
  IconStack2,
  IconEngine,
  IconUsers,
  IconFlask,
  IconSettingsAutomation,
  IconReportMoney
} from "@tabler/icons-react";
import "./MenuBar.css";
import { usePermission } from "../../context/permissioncheck";

const MenuBar = ({ onNavigate, user, isOpen }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [openFlyoutTitle, setOpenFlyoutTitle] = useState(null);
  const [flyoutDismissed, setFlyoutDismissed] = useState(false);
  const { allowedModules, loadingPermissions } = usePermission();
  const location = useLocation();

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
      icon: <IconStack2 size={18} stroke={1.5} />,
    },
    {
      title: "Production",
      path: "/production",
      main_module: "Production",
      icon: <IconSettings size={18} stroke={1.5} />,
      subItems: [
        { title: 'Dashboard', path: '/production?tab=dashboard', tabKey: 'dashboard' },
        { title: 'Production Orders', path: '/production?tab=production-orders', tabKey: 'production-orders' },
        { title: 'Production Plans', path: '/production?tab=production-planning', tabKey: 'production-planning' },
        { title: 'Purchase Orders', path: '/production?tab=purchase-order', tabKey: 'purchase-order' },

        {
          title: 'Reports',
          subItems: [
            { title: 'Production Summary', path: '/production?tab=quality-control', tabKey: 'quality-control' },
            { title: 'Material Shortages', path: '/production?tab=material-shortages', tabKey: 'material-shortages' },
            { title: 'Batch Expiry', path: '/production?tab=batch-expiry', tabKey: 'batch-expiry' },
          ]
        },
        { title: 'Cost Analysis', path: '/production?tab=cost-analysis', tabKey: 'cost-analysis' },

      ]
    },
    {
      title: "Quality",
      path: "/qc",
      main_module: "QC",
      icon: <IconChecklist size={18} stroke={1.5} />,
      subItems: [
        {
          title: 'Sample Management',
          subItems: [
            { title: 'Quality Sampling', path: '/sampling?tab=qc', tabKey: 'qc' },
            { title: 'Under Inspection', path: '/sampling?tab=Under Inspection', tabKey: 'Under Inspection' },
            { title: 'Quality Assurance', path: '/sampling?tab=quality-assurance', tabKey: 'quality-assurance' },
            { title: 'QC Parameters', path: '/sampling?tab=QC Parameters', tabKey: 'QC Parameters' },
          ]
        },
        { title: 'Complain Management', path: '/qc?tab=complaints', tabKey: 'complaints' },
        { title: 'Certificate of Analysis', path: '/qc?tab=coa', tabKey: 'coa' },
        { title: 'COA Templates', path: '/qc?tab=template', tabKey: 'template' },
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
      title: "Cost Overview",
      path: "/costing",
      main_module: "Costing",
      icon: <IconReportMoney size={18} stroke={1.5} />,
      subItems: [
        {
          title: 'Dashboard',
          path: '/costing?tab=dashboard',
          tabKey: 'tab=dashboard'
        },
        {
          title: 'HR Cost',
          path: '/costing?tab=hr-cost&sub=management',
          tabKey: 'tab=hr-cost',
          subItems: [
            { title: 'Management', path: '/costing?tab=hr-cost&sub=management', tabKey: 'sub=management' },
            { title: 'Direct HR', path: '/costing?tab=hr-cost&sub=direct-hr', tabKey: 'sub=direct-hr' },
            { title: 'Quality', path: '/costing?tab=hr-cost&sub=quality', tabKey: 'sub=quality' },
          ]
        },
        {
          title: 'Material Cost',
          path: '/costing?tab=material-cost',
          tabKey: 'tab=material-cost'
        },
        {
          title: 'Quality Testing Cost',
          path: '/costing?tab=quality-testing-cost',
          tabKey: 'tab=quality-testing-cost'
        },
        {
          title: 'Factory Overhead',
          path: '/costing?tab=factory-overhead&sub=repair-maintenance',
          tabKey: 'tab=factory-overhead',
          subItems: [
            { title: 'Repair & maintenance', path: '/costing?tab=factory-overhead&sub=repair-maintenance', tabKey: 'sub=repair-maintenance' },
            { title: 'Stationary & printing', path: '/costing?tab=factory-overhead&sub=stationary-printing', tabKey: 'sub=stationary-printing' },
            { title: 'Generator/Diesel', path: '/costing?tab=factory-overhead&sub=generator-diesel', tabKey: 'sub=generator-diesel' },
            { title: 'DRAP', path: '/costing?tab=factory-overhead&sub=drap', tabKey: 'sub=drap' },
            { title: 'Utilities', path: '/costing?tab=factory-overhead&sub=utilities', tabKey: 'sub=utilities' },
            { title: 'Pest Control', path: '/costing?tab=factory-overhead&sub=pest-control', tabKey: 'sub=pest-control' },
            { title: 'Facilitation', path: '/costing?tab=factory-overhead&sub=facilitation', tabKey: 'sub=facilitation' },
            { title: 'Depreciation', path: '/costing?tab=factory-overhead&sub=depreciation', tabKey: 'sub=depreciation' },
          ]
        },
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



  const displayedItems = searchTerm.trim()
    ? visibleMenuItems.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSub = item.subItems?.some((sub) =>
        sub.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return matchTitle || matchSub;
    })
    : visibleMenuItems;

  return (
    <aside className={`left-sidebar-container ${isOpen ? "open" : ""}`}>

      <div className="sidebar-scrollable-content">
        <div className="sidebar-nav-section">
          <nav className="sidebar-nav-list">
            {displayedItems.map((item, index) => {
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
                                const isFlySubActive = subItem.subItems?.some(flyItem =>
                                  flyItem.path &&
                                  (flyItem.path.includes('?')
                                    ? location.pathname === flyItem.path.split('?')[0] && (flyItem.tabKey ? location.search.includes(flyItem.tabKey) : true)
                                    : location.pathname === flyItem.path)
                                );

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
                                      className={`sidebar-subnav-item sidebar-subnav-toggle sidebar-subnav-flyout-trigger ${isOpen ? 'open' : ''} ${isFlySubActive ? 'active' : ''}`}
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

    </aside>
  );
};

export default MenuBar;
