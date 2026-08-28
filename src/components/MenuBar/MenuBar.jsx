import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  IconBell,
  IconCircleCheck,
  IconPackage,
  IconAlertCircle
} from '@tabler/icons-react';
import BrandLogo from '../../global-components/BrandLogo/BrandLogo';
import './MenuBar.css';

const MenuBar = ({ onLogout, onNavigate, user }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const menuItems = [
    { title: 'Dashboard', path: '/dashboard' },
    //{ title: 'Analytics', path: '/analytics' },
    { title: 'Cost Analysis', path: '/cost-analysis' },
    { title: 'Inventory', path: '/inventory' },
    { title: 'Machine Efficiency', path: '/machine-efficiency' },
    { title: 'Production Planning', path: '/production-planning' },
    { title: 'Production Trend', path: '/production-trend' },
    { title: 'Production Orders', path: '/production-orders' },
    { title: 'QC', path: '/qc' },
  ];

  const firstName = user?.FirstName || "";
  const middleName = user?.MiddleName || "";
  const lastName = user?.LastName || "";
  const fullName = `${firstName} ${middleName}`.trim() || "Admin User";
  const roleName = user?.DesignationName || user?.RoleName || "Warehouse Manager";

  let initials = "AD";
  if (firstName) {
    initials = firstName.charAt(0).toUpperCase();
    if (lastName) {
      initials += lastName.charAt(0).toUpperCase();
    } else if (middleName) {
      initials += middleName.charAt(0).toUpperCase();
    }
  }

  return (
    <header className="top-menu-bar-container">
      <div className="top-menu-bar">
        {/* Brand Section */}
        <div className="menu-bar-brand">
          <BrandLogo size="sm" />
        </div>

        {/* Horizontal Navigation Menu Items */}
        <nav className="menu-bar-nav">
          {menuItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) => `menu-bar-item ${isActive ? 'active' : ''}`}
              onClick={onNavigate}
            >
              <span className="menu-bar-text">{item.title}</span>
            </NavLink>
          ))}
        </nav>

        {/* Action Controls (Right side) */}
        <div className="menu-bar-actions">
          <div className="menu-notification-wrap">
            {/* <button
              className="menu-action-btn"
              aria-label="Notifications"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <IconBell size={18} />
              <span className="notification-dot"></span>
            </button> */}
            {/* {showNotifications && (
              <div className="header-popover notification-popover">
                <div className="notification-popover-header">
                  <div>
                    <strong>Notifications</strong>
                    <span>Stay up to date with warehouse activity</span>
                  </div>
                  <span className="notification-unread-count">3 new</span>
                </div>
                <div className="notification-list">
                  <div className="notification-item">
                    <span className="notification-item-icon notification-item-icon--success"><IconCircleCheck size={17} /></span>
                    <div><strong>Production order completed</strong><span>Order #1048 was completed successfully.</span><small>Just now</small></div>
                  </div>
                  <div className="notification-item">
                    <span className="notification-item-icon notification-item-icon--primary"><IconPackage size={17} /></span>
                    <div><strong>Inventory needs attention</strong><span>5 items are below their reorder level.</span><small>12 minutes ago</small></div>
                  </div>
                  <div className="notification-item">
                    <span className="notification-item-icon notification-item-icon--warning"><IconAlertCircle size={17} /></span>
                    <div><strong>Delivery update</strong><span>A delivery is waiting for confirmation.</span><small>1 hour ago</small></div>
                  </div>
                </div>
              </div>
            )} */}
          </div>

          <div className="menu-profile-wrap">
            <button
              className="menu-profile-btn"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <span className="profile-avatar-gradient">
                <span className="profile-avatar-inner">{initials}</span>
              </span>
            </button>
            {showProfileMenu && (
              <div className="header-popover profile-popover">
                <div className="profile-popover-header">
                  <strong>{fullName}</strong>
                  <span>{roleName}</span>
                </div>
                <div className="profile-popover-actions">
                  <button onClick={onLogout} className="logout-action">Logout</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default MenuBar;
