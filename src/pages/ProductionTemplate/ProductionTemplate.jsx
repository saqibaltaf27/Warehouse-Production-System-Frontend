import React, { useState } from 'react';
import Tabs from '../../global-components/Tabs/Tabs';
import { IconUsers, IconFileDescription } from '@tabler/icons-react';
import Tab1 from './Tab1';
import Tab2 from './Tab2';
import Tab3 from './Tab3';
import './ProductionTemplate.css';

const ProductionTemplate = () => {
  const [activeTab, setActiveTab] = useState('tab1');

  return (
    <div className="production-template-container">
      <h2>Production Template</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <Tabs
          tabs={[
            { key: 'tab1', label: 'Manpower', icon: <IconUsers size={18} /> },
            { key: 'tab2', label: 'Quality Performance', icon: <IconFileDescription size={18} /> },
            { key: 'tab3', label: 'Daily Production Efficiency', icon: <IconFileDescription size={18} /> }
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
      
      <div className="production-template-tab-content">
        {activeTab === 'tab1' && <Tab1 />}
        {activeTab === 'tab2' && <Tab2 />}
        {activeTab === 'tab3' && <Tab3 />}
      </div>
    </div>
  );
};

export default ProductionTemplate;
