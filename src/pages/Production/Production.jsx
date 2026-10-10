import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Tabs from '../../global-components/Tabs/Tabs';
import PurchaseOrder from '../PurchaseOrder/PurchaseOrder';
import ProductionPlanning from '../ProductionPlanning/ProductionPlanning';
import ProductionTrend from '../ProductionTrend/ProductionTrend';
import ProductionOrders from '../ProductionOrders/ProductionOrders';
import ProductionTemplate from '../ProductionTemplate/ProductionTemplate';
import Dashboard from '../dashboard/Dashboard';
import CostAnalysis from '../CostAnalysis/CostAnalysis';
import ProductionOverview from '../ProductionOverview/ProductionOverview';
import './Production.css';

const Production = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(() => {
    if (tabParam) return tabParam;
    return sessionStorage.getItem('mainProductionActiveTab') || 'dashboard';
  });

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
      sessionStorage.setItem('mainProductionActiveTab', tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    sessionStorage.setItem('mainProductionActiveTab', newTab);
    navigate(`/production?tab=${newTab}`);
  };

  useEffect(() => {
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
   // { key: 'production-trend', label: 'Production Trend' },
   { key: 'quality-control', label: 'Overview' },
    // { key: 'production-template', label: 'Production Template' },

  ];

  return (
    <div className="production-page-container">
      {/* <div className="production-tabs-wrapper">
        <Tabs 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
        />
      </div> */}
      <div className="production-tab-content">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'purchase-order' && <PurchaseOrder />}
        {activeTab === 'production-planning' && <ProductionPlanning />}
        {activeTab === 'production-trend' && <ProductionTrend />}
        {activeTab === 'production-orders' && <ProductionOrders />}
        {activeTab === 'production-template' && <ProductionTemplate />}
        {activeTab === 'cost-analysis' && <CostAnalysis />}
        {activeTab === 'quality-control' && <ProductionOverview />}
      </div>
    </div>
  );
};

export default Production;
