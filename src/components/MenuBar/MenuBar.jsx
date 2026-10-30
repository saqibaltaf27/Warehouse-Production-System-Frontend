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
  const { allowedModules, allowedSubModules, allowedChildModules, loadingPermissions } = usePermission();
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
      public: true,
      icon: <IconStack2 size={18} stroke={1.5} />,
    },
    {
      title: "Production",
      path: "/production",
      main_module: "Production",
      icon: <IconSettings size={18} stroke={1.5} />,
      subItems: [
        // { title: 'Dashboard', path: '/production?tab=dashboard', tabKey: 'dashboard' },
        { title: 'Production Dashboard', path: '/production?tab=quality-control', tabKey: 'quality-control', sub_module: 'Production Dashboard' },
        { title: 'Production Orders', path: '/production?tab=production-orders', tabKey: 'production-orders', sub_module: 'Production Orders' },
        { title: 'Production Plans', path: '/production?tab=production-planning', tabKey: 'production-planning', sub_module: 'Production Plans' },
        { title: 'Purchase Orders', path: '/production?tab=purchase-order', tabKey: 'purchase-order', sub_module: 'Purchase Orders' },
     //   { title: 'Production Tracking ', path: '/production?tab=production-tracking', tabKey: 'production-tracking', sub_module: 'Production Tracking' },
        { title: 'Production Forecast', path: '/production?tab=lds-dx-forecast', tabKey: 'lds-dx-forecast', sub_module: 'Production Forecast' },
        { title: 'Tickets', path: '/production/tickets' ,sub_module: 'ProductionTickets' },

        {
          title: 'Reports',
          sub_module: 'Reports',
          subItems: [
            { title: 'Critical Material', path: '/production?tab=critical-material', tabKey: 'critical-material', child_module: 'Critical Material' },
            { title: 'Batch Expiry', path: '/production?tab=batch-expiry', tabKey: 'batch-expiry', child_module: 'Batch Expiry' },
            { title: 'Material-based Capacity', path: '/production?tab=material-capacity', tabKey: 'material-capacity', child_module: 'Material-based Capacity' },
          ]
        },
        // { title: 'Cost Analysis', path: '/production?tab=cost-analysis', tabKey: 'cost-analysis' },

      ]
    },
    {
      title: "Quality",
      path: "/qc",
      main_module: "QC",
      icon: <IconChecklist size={18} stroke={1.5} />,
      subItems: [
        {
          title: 'Quality Testing',
          sub_module: 'Quality Testing',
          subItems: [
            { title: 'Create Sample', path: '/sampling?tab=qc&create=1', tabKey: 'create=1', child_module: 'Create Sample' },
            { title: 'Sample Management', path: '/sampling?tab=qc&view=list', tabKey: 'view=list', child_module: 'Sample Management' },
            // { title: 'Under Inspection', path: '/sampling?tab=Under Inspection', tabKey: 'Under Inspection' },
            { title: 'QC Test Report', path: '/sampling?tab=qc-test-report', tabKey: 'qc-test-report', child_module: 'QC Test Report' },
            { title: 'Testing Standard', path: '/sampling?tab=QC Parameters', tabKey: 'QC Parameters', child_module: 'Testing Standard' },
          ]
        },
        { title: 'Complain Management', path: '/qc?tab=complaints', tabKey: 'complaints', sub_module: 'Complain Management' },
        { title: 'Certificate of Analysis', path: '/qc?tab=coa', tabKey: 'coa', sub_module: 'Certificate of Analysis' },
        { title: 'COA Templates', path: '/qc?tab=template', tabKey: 'template', sub_module: 'COA Templates' },
        { title: 'Tickets', path: '/qc/tickets' ,sub_module: 'QC Tickets' },
      ]
    },
    {
      title: "Engineering",
      path: "/engineering-dashboard",
      main_module: "Engineering Dashboard",
      icon: <IconTool size={18} stroke={1.5} />,
      subItems: [
        { title: 'Dashboard', path: '/engineering-dashboard?tab=dashboard', tabKey: 'dashboard', sub_module: 'Dashboard' },
        { title: 'Line wise Equipments & PM', path: '/engineering-dashboard?tab=equipment-pm', tabKey: 'equipment-pm', sub_module: 'Line wise Equipments & PM' },
        { title: 'Machine', path: '/machine', tabKey: 'machine', sub_module: 'Machine' },
        { title: 'Tickets', path: '/engineering-dashboard/tickets' ,sub_module: 'Engineering Tickets' },
      ]
    },
    {
      title: "Inventory",
      path: "/inventory",
      main_module: "Inventory",
      icon: <IconBox size={18} stroke={1.5} />,
      subItems: [
        { title: 'Inventory Overview', path: '/inventory?tab=overview', tabKey: 'overview', sub_module: 'Inventory Overview' },
        { title: 'Item Master', path: '/inventory?tab=master', tabKey: 'master', sub_module: 'Item Master' },
      ]
    },

    {
      title: "Cost Overview",
      path: "/costing",
      main_module: "Costing Overview",
      icon: <IconReportMoney size={18} stroke={1.5} />,
      subItems: [
        {
          title: 'Dashboard',
          path: '/costing?tab=dashboard',
          tabKey: 'tab=dashboard',
          sub_module: 'Costing Overview Dashboard'
        },
        {
          title: 'HR Cost',
          path: '/costing?tab=hr-cost&sub=management',
          tabKey: 'tab=hr-cost',
          sub_module: 'HR Cost',
          subItems: [
            { title: 'Management', path: '/costing?tab=hr-cost&sub=management', tabKey: 'sub=management', child_module: 'Management' },
            { title: 'Direct HR', path: '/costing?tab=hr-cost&sub=direct-hr', tabKey: 'sub=direct-hr', child_module: 'Direct HR' },
            { title: 'Quality', path: '/costing?tab=hr-cost&sub=quality', tabKey: 'sub=quality', child_module: 'Quality' },
          ]
        },
        {
          title: 'Material Cost',
          path: '/costing?tab=material-cost',
          tabKey: 'tab=material-cost',
          sub_module: 'Material Cost'
        },
        {
          title: 'Quality Testing Cost',
          path: '/costing?tab=quality-testing-cost',
          tabKey: 'tab=quality-testing-cost',
          sub_module: 'Quality Testing Cost'
        },
        {
          title: 'Factory Overhead',
          path: '/costing?tab=factory-overhead&sub=repair-maintenance',
          tabKey: 'tab=factory-overhead',
          sub_module: 'Factory Overhead',
          subItems: [
            { title: 'Repair & maintenance', path: '/costing?tab=factory-overhead&sub=repair-maintenance', tabKey: 'sub=repair-maintenance', child_module: 'Repair & maintenance' },
            { title: 'Stationary & printing', path: '/costing?tab=factory-overhead&sub=stationary-printing', tabKey: 'sub=stationary-printing', child_module: 'Stationary & printing' },
            { title: 'Generator/Diesel', path: '/costing?tab=factory-overhead&sub=generator-diesel', tabKey: 'sub=generator-diesel', child_module: 'Generator/Diesel' },
            { title: 'DRAP', path: '/costing?tab=factory-overhead&sub=drap', tabKey: 'sub=drap', child_module: 'DRAP' },
            { title: 'Utilities', path: '/costing?tab=factory-overhead&sub=utilities', tabKey: 'sub=utilities', child_module: 'Utilities' },
            { title: 'Pest Control', path: '/costing?tab=factory-overhead&sub=pest-control', tabKey: 'sub=pest-control', child_module: 'Pest Control' },
            { title: 'Facilitation', path: '/costing?tab=factory-overhead&sub=facilitation', tabKey: 'sub=facilitation', child_module: 'Facilitation' },
            { title: 'Depreciation', path: '/costing?tab=factory-overhead&sub=depreciation', tabKey: 'sub=depreciation', child_module: 'Depreciation' },
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
    const allowed = (set, ...names) => names.some((name) => name && set.has(name));

    // Match ACL keys only — do not fall back to menu titles (avoids
    // collisions like Workspace "Quality" unlocking Costing HR Cost → Quality).
    const childAllowed = (child) =>
      allowed(allowedChildModules, child.child_module);

    const filterSubItems = (subItems) => subItems.flatMap((sub) => {
      if (sub.subItems) {
        const groupAllowed = allowed(allowedSubModules, sub.sub_module);
        if (groupAllowed) return [{ ...sub, subItems: sub.subItems }];
        const children = sub.subItems.filter(childAllowed);
        return children.length > 0 ? [{ ...sub, subItems: children }] : [];
      }

      if (!sub.sub_module && !sub.child_module) return [sub];

      const subAllowed =
        allowed(allowedSubModules, sub.sub_module) ||
        allowed(allowedChildModules, sub.child_module);
      return subAllowed ? [sub] : [];
    });

    visibleMenuItems = menuItems.flatMap((item) => {
      if (item.public) return [item];

      const mainAllowed = allowed(allowedModules, item.main_module);

      if (!item.subItems) {
        if (item.sub_module) return allowed(allowedSubModules, item.sub_module) ? [item] : [];
        return mainAllowed ? [item] : [];
      }

      // Always filter children — main module alone must not unlock the full tree.
      const subItems = filterSubItems(item.subItems);
      return subItems.length > 0 ? [{ ...item, subItems }] : [];
    });
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
                      `sidebar-nav-item ${(!hasSubItems && (isActive || location.pathname.startsWith(`${item.path}/`)) && !coveredByGroup) || (hasSubItems && isGroupActive) ? "active" : ""}`
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
