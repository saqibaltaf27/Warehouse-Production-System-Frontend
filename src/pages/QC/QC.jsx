import React, { useState } from 'react';
import Complaints from '../Complaints/Complaints';
import COA from './COA';
import Tabs from '../../global-components/Tabs/Tabs';
import { IconAlertTriangle, IconFileCertificate } from '@tabler/icons-react';
import './QC.css';

const QC = () => {
  const [activeTab, setActiveTab] = useState('complaints');

  return (
    <div>
      <div className="qc-header">
        
        <div style={{ marginBottom: '20px' }}>
          <Tabs
            tabs={[
              { key: 'complaints', label: 'Complaints', icon: <IconAlertTriangle size={18} /> },
              { key: 'coa', label: 'COA', icon: <IconFileCertificate size={18} /> }
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </div>
      
      <div className="qc-content">
        {activeTab === 'complaints' && <Complaints />}
        {activeTab === 'coa' && <COA />}
      </div>
    </div>
  );
};

export default QC;
