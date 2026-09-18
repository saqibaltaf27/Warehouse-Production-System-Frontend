import React, { useState, useEffect } from 'react';
import Tabs from '../../global-components/Tabs/Tabs';
import QCSampling from './QCSampling';
import UnderInspection from './UnderInspection';
import QualityAssurance from './QualityAssurance';
import './Sampling.css';

const Sampling = () => {
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('mainSamplingActiveTab') || 'qc';
  });

  useEffect(() => {
    sessionStorage.setItem('mainSamplingActiveTab', activeTab);
  }, [activeTab]);

  const tabs = [
    { key: 'qc', label: 'Sampling' },
    { key: 'Under Inspection', label: 'Under Inspection' },
    { key: 'quality-assurance', label: 'Quality' },
  ];

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
      </div>
    </div>
  );
};

export default Sampling;
