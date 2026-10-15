import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconCurrencyDollar,
  IconUsers,
  IconBox,
  IconFlask,
  IconBuildingFactory2,
  IconTrendingUp,
  IconPlus,
  IconArrowRight,
  IconDownload,
  IconSearch,
  IconCalendar
} from "@tabler/icons-react";
import { costingService } from "./costingStorage";

const CostingDashboard = ({ onNavigateTab }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(costingService.getOverallStats());
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setStats(costingService.getOverallStats());
  }, []);

  const formatPKR = (amount) => {
    return `PKR ${Number(amount || 0).toLocaleString()}`;
  };

  const filteredEntries = stats.recentEntries.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.title.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      item.id.toLowerCase().includes(term)
    );
  });

  const exportCSV = () => {
    const headers = ["ID", "Title/Item", "Category", "Sub-Type", "Date", "Amount (PKR)"];
    const rows = stats.recentEntries.map((e) => [
      e.id,
      `"${e.title.replace(/"/g, '""')}"`,
      e.category,
      e.sub || "",
      e.date,
      e.amount
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Costing_Summary_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="costing-view-wrapper">
      {/* Top Banner / Actions Bar */}
      <div className="costing-dashboard-hero">
        <div className="costing-hero-left">
          <span className="costing-hero-badge">Financial Analytics</span>
          <h2 className="costing-hero-title">Production & Operational Cost Overview</h2>
          <p className="costing-hero-desc">
            Consolidated manufacturing expenditures across Human Resources, Direct Materials, Laboratory Testing, and Factory Overheads.
          </p>
        </div>

        <div className="costing-hero-quick-actions">
          <button
            type="button"
            className="cost-action-chip"
            onClick={() => onNavigateTab("material-cost")}
          >
            <IconPlus size={16} /> Record Material Cost
          </button>
          <button
            type="button"
            className="cost-action-chip"
            onClick={() => onNavigateTab("hr-cost", "management")}
          >
            <IconPlus size={16} /> Log HR Expense
          </button>
          <button
            type="button"
            className="cost-action-chip"
            onClick={() => onNavigateTab("factory-overhead", "repair-maintenance")}
          >
            <IconPlus size={16} /> Add Overhead
          </button>
        </div>
      </div>

      {/* Main KPI Stats Grid */}
      <div className="costing-kpi-grid">
        <div className="costing-kpi-card highlight-card">
          <div className="kpi-icon-wrap primary">
            <IconCurrencyDollar size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total Recorded Cost</span>
            <h3 className="kpi-value">{formatPKR(stats.grandTotal)}</h3>
            <span className="kpi-subtitle">Across {stats.totalEntries} cost entries</span>
          </div>
        </div>

        <div className="costing-kpi-card" onClick={() => onNavigateTab("material-cost")}>
          <div className="kpi-icon-wrap blue">
            <IconBox size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Material Cost</span>
            <h3 className="kpi-value">{formatPKR(stats.matTotal)}</h3>
            <span className="kpi-ratio">
              {stats.grandTotal > 0 ? Math.round((stats.matTotal / stats.grandTotal) * 100) : 0}% of total cost
            </span>
          </div>
        </div>

        <div className="costing-kpi-card" onClick={() => onNavigateTab("hr-cost", "management")}>
          <div className="kpi-icon-wrap green">
            <IconUsers size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Human Resource Cost</span>
            <h3 className="kpi-value">{formatPKR(stats.hrTotal)}</h3>
            <span className="kpi-ratio">
              {stats.grandTotal > 0 ? Math.round((stats.hrTotal / stats.grandTotal) * 100) : 0}% of total cost
            </span>
          </div>
        </div>

        <div className="costing-kpi-card" onClick={() => onNavigateTab("factory-overhead", "repair-maintenance")}>
          <div className="kpi-icon-wrap amber">
            <IconBuildingFactory2 size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Factory Overhead</span>
            <h3 className="kpi-value">{formatPKR(stats.fohTotal)}</h3>
            <span className="kpi-ratio">
              {stats.grandTotal > 0 ? Math.round((stats.fohTotal / stats.grandTotal) * 100) : 0}% of total cost
            </span>
          </div>
        </div>

        <div className="costing-kpi-card" onClick={() => onNavigateTab("quality-testing-cost")}>
          <div className="kpi-icon-wrap purple">
            <IconFlask size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Quality Testing Cost</span>
            <h3 className="kpi-value">{formatPKR(stats.qtTotal)}</h3>
            <span className="kpi-ratio">
              {stats.grandTotal > 0 ? Math.round((stats.qtTotal / stats.grandTotal) * 100) : 0}% of total cost
            </span>
          </div>
        </div>
      </div>

      {/* Cost Distribution Progress Bars */}
      <div className="costing-distribution-card">
        <div className="distribution-card-header">
          <div>
            <h4 className="distribution-card-title">Cost Category Distribution</h4>
            <p className="distribution-card-subtitle">Percentage proportion of total monthly operating expenses</p>
          </div>
          <button type="button" className="btn-secondary-sm" onClick={exportCSV}>
            <IconDownload size={15} /> Export CSV
          </button>
        </div>

        <div className="multi-progress-bar">
          {stats.categoryBreakdown.map((cat, idx) => {
            const pct = stats.grandTotal > 0 ? (cat.value / stats.grandTotal) * 100 : 0;
            return (
              <div
                key={idx}
                className="progress-slice"
                style={{ width: `${pct}%`, backgroundColor: cat.color }}
                title={`${cat.name}: ${pct.toFixed(1)}%`}
              />
            );
          })}
        </div>

        <div className="distribution-legend-grid">
          {stats.categoryBreakdown.map((cat, idx) => {
            const pct = stats.grandTotal > 0 ? ((cat.value / stats.grandTotal) * 100).toFixed(1) : 0;
            return (
              <div key={idx} className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: cat.color }} />
                <div className="legend-text">
                  <span className="legend-name">{cat.name} ({pct}%)</span>
                  <span className="legend-amount">{formatPKR(cat.value)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Cost Entries Table */}
      <div className="costing-table-section">
        <div className="costing-table-header-row">
          <div>
            <h4 className="costing-section-heading">Recent Expenditure Logs</h4>
            <p className="costing-section-subheading">Latest 10 transactions recorded across all costing modules</p>
          </div>
          <div className="costing-search-wrap">
            <IconSearch size={16} className="search-input-icon" />
            <input
              type="text"
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="costing-search-input"
            />
          </div>
        </div>

        <div className="costing-data-table-container">
          <table className="costing-modern-table">
            <thead>
              <tr>
                <th>Entry ID</th>
                <th>Title / Reference</th>
                <th>Category</th>
                <th>Sub-Type</th>
                <th>Date / Period</th>
                <th className="text-right">Amount</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-empty-row">
                    No matching cost records found.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className="table-id-badge">{row.id}</span>
                    </td>
                    <td>
                      <span className="table-item-title">{row.title}</span>
                    </td>
                    <td>
                      <span className={`table-category-tag ${row.category.toLowerCase().replace(/\s+/g, '-')}`}>
                        {row.category}
                      </span>
                    </td>
                    <td>
                      <span className="table-sub-text">{row.sub || "General"}</span>
                    </td>
                    <td>
                      <span className="table-date-text">
                        <IconCalendar size={13} /> {row.date}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="table-amount-bold">{formatPKR(row.amount)}</span>
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        className="table-jump-btn"
                        onClick={() => {
                          if (row.category === 'HR Cost') onNavigateTab('hr-cost', row.sub);
                          else if (row.category === 'Material Cost') onNavigateTab('material-cost');
                          else if (row.category === 'Quality Testing') onNavigateTab('quality-testing-cost');
                          else onNavigateTab('factory-overhead', row.sub);
                        }}
                      >
                        View <IconArrowRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CostingDashboard;
