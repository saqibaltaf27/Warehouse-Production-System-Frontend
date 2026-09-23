import React, { useState } from 'react';
import Tabs from '../../global-components/Tabs/Tabs';
import PurchaseOrder from '../PurchaseOrder/PurchaseOrder';
import ProductionPlanning from '../ProductionPlanning/ProductionPlanning';
import ProductionTrend from '../ProductionTrend/ProductionTrend';
import ProductionOrders from '../ProductionOrders/ProductionOrders';
import ProductionTemplate from '../ProductionTemplate/ProductionTemplate';
import Dashboard from '../dashboard/Dashboard';
import CostAnalysis from '../CostAnalysis/CostAnalysis';
import './Production.css';

const Production = () => {
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('mainProductionActiveTab') || 'dashboard';
  });

  React.useEffect(() => {
    sessionStorage.setItem('mainProductionActiveTab', activeTab);
  }, [activeTab]);

  // Clear the saved tab when navigating away to another page.
  // This cleanup function does NOT run when the browser is refreshed,
  // so the tab will still be remembered on refresh!
  React.useEffect(() => {
    return () => {
      sessionStorage.removeItem('mainProductionActiveTab');
    };
  }, []);

  const tabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'cost-analysis', label: 'Cost Analysis' },
    { key: 'production-orders', label: 'Production Orders' },
    { key: 'production-planning', label: 'Production Planning' },
    { key: 'purchase-order', label: 'Purchase Request' },
    { key: 'production-trend', label: 'Production Trend' },
    // { key: 'production-template', label: 'Production Template' },

  ];

  return (
    <div className="production-page-container">
      <div className="production-tabs-wrapper">
        <Tabs 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
      </div>
      <div className="production-tab-content">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'purchase-order' && <PurchaseOrder />}
        {activeTab === 'production-planning' && <ProductionPlanning />}
        {activeTab === 'production-trend' && <ProductionTrend />}
        {activeTab === 'production-orders' && <ProductionOrders />}
        {activeTab === 'production-template' && <ProductionTemplate />}
        {activeTab === 'cost-analysis' && <CostAnalysis />}
      </div>
    </div>
  );
};

export default Production;
