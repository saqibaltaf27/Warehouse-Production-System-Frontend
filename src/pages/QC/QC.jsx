import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Complaints from '../Complaints/Complaints';
import COA from './COA';
import COATemplates from './COATemplates';
import Tabs from '../../global-components/Tabs/Tabs';
import { IconAlertTriangle, IconFileCertificate } from '@tabler/icons-react';
import './QC.css';

const QC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(() => {
    if (tabParam) return tabParam;
    return sessionStorage.getItem('mainQCActiveTab') || 'complaints';
  });

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
      sessionStorage.setItem('mainQCActiveTab', tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    sessionStorage.setItem('mainQCActiveTab', newTab);
    navigate(`/qc?tab=${newTab}`);
  };

  useEffect(() => {
    return () => {
      sessionStorage.removeItem('mainQCActiveTab');
    };
  }, []);

  return (
    <div>
      <div className="qc-header">
        
        {/* <div style={{ marginBottom: '20px' }}>
          <Tabs
            variant="underline"
            tabs={[
              { key: 'complaints', label: 'Complaints', icon: <IconAlertTriangle size={18} /> },
              { key: 'coa', label: 'COA', icon: <IconFileCertificate size={18} /> },
              {key: 'template', label: 'COA Templates', icon: <IconFileCertificate size={18} />}
            ]}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div> */}
      </div>
      
      <div className="qc-content">
        {activeTab === 'complaints' && <Complaints />}
        {activeTab === 'coa' && <COA />}
        {activeTab === 'template' && <COATemplates />}
      </div>
    </div>
  );
};

export default QC;
