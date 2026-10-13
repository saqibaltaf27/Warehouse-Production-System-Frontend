import React from "react";
import { IconReportMoney } from "@tabler/icons-react";
import "./CostingOverview.css";

const CostingOverview = () => {
  return (
    <div className="costing-overview-container">
      <div className="costing-overview-header">
        <h1 className="costing-overview-title">Costing Overview</h1>
        <p className="costing-overview-subtitle">
          Overview and financial analytics for production costing
        </p>
      </div>

      <div className="costing-overview-content">
        <div className="costing-overview-icon-box">
          <IconReportMoney size={32} stroke={1.5} />
        </div>
        <h2 className="costing-overview-placeholder-title">Costing Overview Module</h2>
        <p className="costing-overview-placeholder-desc">
          This module is ready for development. You can now build out the overview dashboard, cost metrics, and financial breakdown charts from scratch.
        </p>
      </div>
    </div>
  );
};

export default CostingOverview;
