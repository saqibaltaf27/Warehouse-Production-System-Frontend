import React, { useState } from 'react';
import Tabs from '../../global-components/Tabs/Tabs';
import PurchaseOrder from '../PurchaseOrder/PurchaseOrder';
import ProductionPlanning from '../ProductionPlanning/ProductionPlanning';
import ProductionTrend from '../ProductionTrend/ProductionTrend';
import ProductionOrders from '../ProductionOrders/ProductionOrders';
import ProductionTemplate from '../ProductionTemplate/ProductionTemplate';
import './Production.css';

const Production = () => {
  const [activeTab, setActiveTab] = useState('purchase-order');

  const tabs = [
    { key: 'purchase-order', label: 'Purchase Order' },
    { key: 'production-planning', label: 'Production Planning' },
    { key: 'production-trend', label: 'Production Trend' },
    { key: 'production-orders', label: 'Production Orders' },
    { key: 'production-template', label: 'Production Template' }
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
        {activeTab === 'purchase-order' && <PurchaseOrder />}
        {activeTab === 'production-planning' && <ProductionPlanning />}
        {activeTab === 'production-trend' && <ProductionTrend />}
        {activeTab === 'production-orders' && <ProductionOrders />}
        {activeTab === 'production-template' && <ProductionTemplate />}
      </div>
    </div>
  );
};

export default Production;
