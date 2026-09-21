import React, { useState, useEffect } from 'react';
import Tabs from '../../global-components/Tabs/Tabs';
import QCSampling from './QCSampling';
import UnderInspection from './UnderInspection';
import QualityAssurance from './QualityAssurance';
import QCParameters from './QCParameters';
import './Sampling.css';
import { usePermission } from '../../context/permissioncheck';
import { useAuth } from '../../context/AuthContext';

const Sampling = () => {
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('mainSamplingActiveTab') || 'qc';
  });

  useEffect(() => {
    sessionStorage.setItem('mainSamplingActiveTab', activeTab);
  }, [activeTab]);

  const { allowedSubModules, loadingPermissions } = usePermission();
  const { user } = useAuth();

  const allTabs = [
    { key: 'qc', label: 'Sampling', sub_module: 'QC Sampling' },
    { key: 'Under Inspection', label: 'Under Inspection', sub_module: 'Under Inspection' },
    { key: 'quality-assurance', label: 'Quality', sub_module: 'Quality' },
    { key: 'QC Parameters', label: 'QC Parameters', sub_module: 'QC Parameters' },
  ];

  let tabs = allTabs;
  if (!user?.isSuperAdmin && !loadingPermissions) {
    tabs = allTabs.filter(tab => allowedSubModules.has(tab.sub_module));
  } else if (loadingPermissions) {
    tabs = [];
  }

  // Effect to ensure activeTab is valid if the default one is hidden
  useEffect(() => {
    if (tabs.length > 0 && !tabs.find(t => t.key === activeTab)) {
      setActiveTab(tabs[0].key);
    }
  }, [tabs, activeTab]);

  return (
    <div className="sampling-page-container">
      <div className="sampling-tabs-wrapper">
        <Tabs 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
      </div>
      <div className="sampling-tab-content">
        {activeTab === 'qc' && (
          <QCSampling />
        )}
        {activeTab === 'Under Inspection' && (
          <UnderInspection />
        )}
        {activeTab === 'quality-assurance' && (
          <QualityAssurance />
        )}
        {activeTab === 'QC Parameters' && (
          <QCParameters />
        )}
      </div>
    </div>
  );
};

export default Sampling;
