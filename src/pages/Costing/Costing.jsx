import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import CostingDashboard from './CostingDashboard';
import HRCostView from './HRCostView';
import MaterialCostView from './MaterialCostView';
import QualityTestingCostView from './QualityTestingCostView';
import FactoryOverheadView from './FactoryOverheadView';
import './Costing.css';

export default function Costing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'dashboard';
  const sub = searchParams.get('sub') || '';

  const navigateTab = (newTab, newSub) => {
    const params = { tab: newTab };
    if (newSub) {
      params.sub = newSub;
    }
    setSearchParams(params);
  };

  const handleSubChange = (newSub) => {
    const params = { tab };
    if (newSub && newSub !== 'all') {
      params.sub = newSub;
    }
    setSearchParams(params);
  };

  return (
    <div className="costing-module-wrapper">
      {tab === 'dashboard' && (
        <CostingDashboard onNavigateTab={navigateTab} />
      )}

      {tab === 'hr-cost' && (
        <HRCostView
          key={sub || 'management'}
          initialSub={sub || 'management'}
          onSubChange={handleSubChange}
        />
      )}

      {tab === 'material-cost' && (
        <MaterialCostView />
      )}

      {tab === 'quality-testing-cost' && (
        <QualityTestingCostView />
      )}

      {tab === 'factory-overhead' && (
        <FactoryOverheadView
          key={sub || 'repair-maintenance'}
          initialSub={sub || 'repair-maintenance'}
          onSubChange={handleSubChange}
        />
      )}
    </div>
  );
}
