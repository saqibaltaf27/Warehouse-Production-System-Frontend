import React, { useState } from 'react';
import Complaints from '../Complaints/Complaints';
import COA from './COA';
import './QC.css';

const QC = () => {
  const [activeTab, setActiveTab] = useState('complaints');

  return (
    <div>
      <div className="qc-header">
        
        <div className="qc-tabs">
          <button 
            className={`qc-tab ${activeTab === 'complaints' ? 'active' : ''}`}
            onClick={() => setActiveTab('complaints')}
          >
            Complaints
          </button>
          <button 
            className={`qc-tab ${activeTab === 'coa' ? 'active' : ''}`}
            onClick={() => setActiveTab('coa')}
          >
            COA
          </button>
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
