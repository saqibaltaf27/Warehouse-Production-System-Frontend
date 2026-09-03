import React, { useState } from 'react';
import DashboardTab from './DashboardTab';
import RecordDataTab from './RecordDataTab';
import Tabs from '../../global-components/Tabs/Tabs';
import './EngineeringDashboard.css';

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'Line wise Equipments & PM', label: 'Line wise Equipments & PM' }
];

const EngineeringDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="engineering-dashboard-container">
      <div className="inventory-tabs pm-tabs">
        <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      
      <div className="tab-content">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'Line wise Equipments & PM' && <RecordDataTab />}
      </div>
    </div>
  );
};

export default EngineeringDashboard;
