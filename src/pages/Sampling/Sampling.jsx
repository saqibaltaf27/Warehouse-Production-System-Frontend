import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Tabs from '../../global-components/Tabs/Tabs';
import QCSampling from './QCSampling';
import UnderInspection from './UnderInspection';
import QualityAssurance from './QualityAssurance';
import QCParameters from './QCParameters';
import './Sampling.css';
import { usePermission } from '../../context/permissioncheck';
import { useAuth } from '../../context/AuthContext';

const Sampling = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(() => {
    if (tabParam) return tabParam;
    return sessionStorage.getItem('mainSamplingActiveTab') || 'qc';
  });

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
      sessionStorage.setItem('mainSamplingActiveTab', tabParam);
    }
  }, [tabParam]);

  // Survives child tab remount (QC Test Report → Sampling); Strict Mode safe
  useEffect(() => {
    const onSamplingTab = (tabParam || activeTab) === 'qc';
    if (!onSamplingTab) return;
    const msg = sessionStorage.getItem('wps_sampling_toast');
    if (!msg) return;
    const timer = window.setTimeout(() => {
      const pending = sessionStorage.getItem('wps_sampling_toast');
      if (!pending) return;
      sessionStorage.removeItem('wps_sampling_toast');
      toast.success(pending, { duration: 4500, id: 'sampling-qc-decision' });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [activeTab, tabParam, searchParams]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    sessionStorage.setItem('mainSamplingActiveTab', newTab);
    navigate(`/sampling?tab=${encodeURIComponent(newTab)}`);
  };

  useEffect(() => {
    return () => {
      sessionStorage.removeItem('mainSamplingActiveTab');
    };
  }, []);

  const { allowedSubModules, loadingPermissions } = usePermission();
  const { user } = useAuth();

  const allTabs = [
    { key: 'qc', label: 'Sampling', sub_module: 'QC Sampling' },
    { key: 'Under Inspection', label: 'Under Inspection', sub_module: 'Under Inspection' },
    { key: 'qc-test-report', label: 'QC Test Report', sub_module: 'Quality' },
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
      handleTabChange(tabs[0].key);
    }
  }, [tabs, activeTab]);

  return (
    <div className="sampling-page-container layout-page-padding">
      <div className="sampling-tabs-wrapper">
        {/* <Tabs 
          variant="underline"
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
        /> */}
      </div>
      <div className="sampling-tab-content ">
        {activeTab === 'qc' && (
          <QCSampling />
        )}
        {activeTab === 'Under Inspection' && (
          <UnderInspection />
        )}
        {activeTab === 'qc-test-report' && (
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
