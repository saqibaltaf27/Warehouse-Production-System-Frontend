import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardTab from './DashboardTab';
import RecordDataTab from './RecordDataTab';
import Tabs from '../../global-components/Tabs/Tabs';
import './EngineeringDashboard.css';

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'equipment-pm', label: 'Line wise Equipments & PM' }
];

const EngineeringDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(() => {
    if (tabParam) return tabParam;
    return sessionStorage.getItem('mainEngineeringActiveTab') || 'dashboard';
  });

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
      sessionStorage.setItem('mainEngineeringActiveTab', tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    sessionStorage.setItem('mainEngineeringActiveTab', newTab);
    navigate(`/engineering-dashboard?tab=${encodeURIComponent(newTab)}`);
  };

  useEffect(() => {
    return () => {
      sessionStorage.removeItem('mainEngineeringActiveTab');
    };
  }, []);

  return (
    <div className="engineering-dashboard-container">
      {/* <div className="inventory-tabs pm-tabs">
        <Tabs variant="underline" tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />
      </div> */}
      
      <div className="tab-content">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'equipment-pm' && <RecordDataTab />}
      </div>
    </div>
  );
};

export default EngineeringDashboard;
