import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IconLock, IconShieldLock } from '@tabler/icons-react';
import BrandLogo from '../../global-components/BrandLogo/BrandLogo';
import './UnauthorizedPage.css';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <main className="unauthorized-container">
      <div className="unauthorized-card">
        <div className="unauthorized-brand">
          <BrandLogo size="sm" />
        </div>
        
        <div className="unauthorized-icon-wrapper">
          <div className="unauthorized-icon-pulse"></div>
          <IconShieldLock size={72} stroke={1.5} className="unauthorized-icon" />
        </div>

        <h1 className="unauthorized-title">Access Restricted</h1>
        
        <p className="unauthorized-description">
          You do not have permission to view this specific page. Please contact the <strong>Enterprise Technology</strong> department if you believe this is a mistake.
        </p>

        <div className="unauthorized-actions">
          <button 
            className="unauthorized-btn-primary" 
            onClick={() => navigate('/')}
          >
            Return to Authorized Modules
          </button>
        </div>
      </div>
    </main>
  );
};

export default UnauthorizedPage;
