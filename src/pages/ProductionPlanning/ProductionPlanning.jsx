import React, { useState, useEffect, useCallback } from 'react';
import { axiosInstance } from '../../apis/axiosinstance';
import { API_ENDPOINTS } from '../../apis/endpoints';
import Card from '../../global-components/Card/Card';
import Pagination from '../../global-components/Pagination/Pagination';
import ProductionHistory from './ProductionHistory';
import ProductionTrend from './ProductionTrend';
import ProductionRecommendation from './ProductionRecommendation';
import ManpowerProductivity from './ManpowerProductivity';
import Table from '../../global-components/Table/Table';
import Tabs from '../../global-components/Tabs/Tabs';
import {
  IconChecklist,
  IconClock,
  IconAlertTriangle,
  IconReportAnalytics,
  IconCalendarEvent,
  IconHistory,
  IconChartBar,
  IconBulb,
  IconUsers
} from '@tabler/icons-react';
import './ProductionPlanning.css';

/* ── Formatters ── */
const fmt = (n) => {
  if (n == null || isNaN(n)) return '0';
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
};

const fmtDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); // e.g., 1 Jan 2026
};

/* ── Status badge renderer ── */
const StatusBadge = ({ status }) => {
  const cls = (status || '').toLowerCase().replace(/\s+/g, '-');
  return <span className={`status-badge ${cls}`}>{status}</span>;
};

const ProductionPlanning = () => {
  const [activeTab, setActiveTab] = useState('orders');

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [bucket, setBucket] = useState('');

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Orders State
  const [kpiData, setKpiData] = useState(null);
  const [ordersData, setOrdersData] = useState([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPageSize, setOrdersPageSize] = useState(20);
  const [ordersTotal, setOrdersTotal] = useState(0);

  // Shortages State
  const [shortagesData, setShortagesData] = useState([]);
  const [shortagesPage, setShortagesPage] = useState(1);
  const [shortagesPageSize, setShortagesPageSize] = useState(20);
  const [shortagesTotal, setShortagesTotal] = useState(0);

  // Batch Expiry State
  const [batchExpiryData, setBatchExpiryData] = useState([]);
  const [batchPage, setBatchPage] = useState(1);
  const [batchPageSize, setBatchPageSize] = useState(20);
  const [batchTotal, setBatchTotal] = useState(0);

  const fetchKpisAndOrders = useCallback(async () => {
    try {
      const params = { page: ordersPage, pageSize: ordersPageSize, search: debouncedSearch, status, warehouse };
      const res = await axiosInstance.get(API_ENDPOINTS.PRODUCTION_PLANNING.KPIS, { params });
      if (res.data?.success) {
        setKpiData(res.data.data.kpis);
        setOrdersData(res.data.data.orders);
        setOrdersTotal(res.data.pagination.totalRecords);
      }
    } catch (err) {
      console.error('Production Planning KPIs error:', err);
    }
  }, [ordersPage, ordersPageSize, debouncedSearch, status, warehouse]);

  const fetchShortages = useCallback(async () => {
    try {
      const params = { page: shortagesPage, pageSize: shortagesPageSize, search: debouncedSearch };
      const res = await axiosInstance.get(API_ENDPOINTS.PRODUCTION_PLANNING.SHORTAGES, { params });
      if (res.data?.success) {
        setShortagesData(res.data.data);
        setShortagesTotal(res.data.pagination.totalRecords);
      }
    } catch (err) {
      console.error('Production Planning Shortages error:', err);
    }
  }, [shortagesPage, shortagesPageSize, debouncedSearch]);

  const fetchBatchExpiry = useCallback(async () => {
    try {
      const params = { page: batchPage, pageSize: batchPageSize, search: debouncedSearch, warehouse, bucket };
      const res = await axiosInstance.get(API_ENDPOINTS.PRODUCTION_PLANNING.BATCH_EXPIRY, { params });
      if (res.data?.success) {
        setBatchExpiryData(res.data.data);
        setBatchTotal(res.data.pagination.totalRecords);
      }
    } catch (err) {
      console.error('Production Planning Batch Expiry error:', err);
    }
  }, [batchPage, batchPageSize, debouncedSearch, warehouse, bucket]);

  // Reset pagination on filter change
  useEffect(() => {
    setOrdersPage(1);
    setShortagesPage(1);
    setBatchPage(1);
  }, [debouncedSearch, status, warehouse, bucket]);

  // Fetch data based on active tab
  useEffect(() => {
    if (activeTab === 'orders') fetchKpisAndOrders();
    else if (activeTab === 'shortages') fetchShortages();
    else if (activeTab === 'expiry') fetchBatchExpiry();
  }, [activeTab, fetchKpisAndOrders, fetchShortages, fetchBatchExpiry]);

  // Always fetch KPIs on mount so cards populate
  useEffect(() => {
    if (activeTab !== 'orders') fetchKpisAndOrders();
  }, [fetchKpisAndOrders]);

  // ── Tables Columns ──
  const ordersColumns = [
    { header: 'Order #', key: 'ProductionOrder' },
    { header: 'Finished Good', key: 'FinishedGoodCode' },
    { header: 'Item Name', key: 'FinishedGoodName', render: (r) => <span title={r.FinishedGoodName}>{(r.FinishedGoodName || '').substring(0, 30)}</span> },
    { header: 'Status', key: 'Status', render: (r) => <StatusBadge status={r.Status === 'R' ? 'Released' : 'Planned'} /> },
    { header: 'Planned', key: 'PlannedQty', render: (r) => <span className="tabular-nums">{fmt(r.PlannedQty)}</span> },
    { header: 'Produced', key: 'ProducedQty', render: (r) => <span className="tabular-nums">{fmt(r.ProducedQty)}</span> },
    { header: 'Completion %', key: 'CompletionPct', render: (r) => <span className="tabular-nums">{Number(r.CompletionPct).toFixed(1)}%</span> },
    { header: 'Start Date', key: 'StartDate', render: (r) => fmtDate(r.StartDate) },
    { header: 'Due Date', key: 'DueDate', render: (r) => fmtDate(r.DueDate) },
    { 
      header: 'Delay', key: 'DaysDelayed', render: (r) => 
        r.DaysDelayed > 0 ? <span className="status-badge critical">{r.DaysDelayed}d delayed</span> : <span className="status-badge success">On Time</span> 
    },
  ];

  const shortagesColumns = [
    { header: 'Component', key: 'ComponentCode' },
    { header: 'Component Name', key: 'ComponentName', render: (r) => <span title={r.ComponentName}>{(r.ComponentName || '').substring(0, 35)}</span> },
    { header: 'Required Qty', key: 'RemainingRequired', render: (r) => <span className="tabular-nums">{fmt(r.RemainingRequired)}</span> },
    { header: 'Available Stock', key: 'TotalAvailable', render: (r) => <span className="tabular-nums">{fmt(r.TotalAvailable)}</span> },
    { 
      header: 'Shortage', key: 'ShortageQty', render: (r) => 
      <span className="status-badge critical tabular-nums">{fmt(r.ShortageQty)}</span>
    },
  ];

  const expiryColumns = [
    { header: 'Item Code', key: 'ItemCode' },
    { header: 'Item Name', key: 'ItemName', render: (r) => <span title={r.ItemName}>{(r.ItemName || '').substring(0, 35)}</span> },
    { header: 'Batch Number', key: 'BatchNumber' },
    { header: 'Warehouse', key: 'WhsCode' },
    { header: 'Quantity', key: 'Quantity', render: (r) => <span className="tabular-nums">{fmt(r.Quantity)}</span> },
    { header: 'Expiry Date', key: 'ExpiryDate', render: (r) => fmtDate(r.ExpiryDate) },
    { 
      header: 'Aging Bucket', key: 'ExpiryBucket', render: (r) => {
        const bucketVal = r.ExpiryBucket || '';
        let cls = 'normal';
        if(bucketVal.includes('Expired')) cls = 'expired';
        if(bucketVal.includes('0-30')) cls = 'critical';
        if(bucketVal.includes('31-90')) cls = 'warning';
        return <span className={`status-badge ${cls}`}>{bucketVal.substring(3)}</span>;
      }
    },
  ];

  return (
    <div className="production-planning-page fade-in-up">
      
      {/* Filters Bar */}
      <div className="planning-filters">
        <input
          className="search-input"
          type="text"
          placeholder="Search items or orders..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        {(activeTab === 'orders' || activeTab === 'expiry') && (
          <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
            <option value="">All Warehouses</option>
            <option value="01">General Warehouse (01)</option>
            <option value="02">Main Warehouse (02)</option>
            <option value="04">Finished Goods (04)</option>
            <option value="06">Quarantine (06)</option>
            <option value="07">Rejection (07)</option>
            <option value="08">Raw Material (08)</option>
          </select>
        )}
        {activeTab === 'orders' && (
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="R">Released</option>
            <option value="P">Planned</option>
          </select>
        )}
        {activeTab === 'expiry' && (
          <select value={bucket} onChange={(e) => setBucket(e.target.value)}>
            <option value="">All Expiry Buckets</option>
            <option value="Expired">Expired</option>
            <option value="0-30 Days">0-30 Days</option>
            <option value="31-90 Days">31-90 Days</option>
            <option value="90+ Days">90+ Days</option>
          </select>
        )}
      </div>

      {kpiData && (
        <div className="fade-in-up mb-6">
          <Card items={[
            {
              title: "Open Orders",
              value: fmt(kpiData.totalOpen),
              trendText: "Released & Planned",
              icon: IconChecklist
            },
            {
              title: "Delayed Orders",
              value: fmt(kpiData.delayedOrders),
              trendText: "Past Due Date",
              icon: IconClock
            },
            {
              title: "Material Shortages",
              value: fmt(shortagesTotal),
              trendText: "Missing Components",
              icon: IconAlertTriangle
            },
            {
              title: "Production Completion",
              value: `${kpiData.completionPct}%`,
              trendText: "Overall Backlog Yield",
              icon: IconReportAnalytics
            }
          ]} />
        </div>
      )}

      <div className="planning-tabs">
        <Tabs
          tabs={[
            { key: 'orders', label: 'Daily Execution', icon: <IconCalendarEvent size={18} /> },
            { key: 'shortages', label: 'Material Shortages', icon: <IconAlertTriangle size={18} /> },
            { key: 'expiry', label: 'Batch Expiry', icon: <IconClock size={18} /> },
            { key: 'history', label: 'Production History', icon: <IconHistory size={18} /> },
            { key: 'trend', label: 'Trend', icon: <IconChartBar size={18} /> },
            { key: 'recommendation', label: 'Planner', icon: <IconBulb size={18} /> },
            { key: 'manpower', label: 'Manpower Productivity', icon: <IconUsers size={18} /> }
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      <div className="planning-content fade-in-up delay-100">
        {activeTab === 'orders' && (
          <div className="planning-section">
            <h3>Open Production Orders</h3>
            <Table
              data={ordersData}
              columns={ordersColumns}
              totalEntries={ordersTotal}
              showActions={false}
              showPagination={true}
              currentPage={ordersPage}
              pageSize={ordersPageSize}
              onPageChange={setOrdersPage}
              onItemsPerPageChange={(size) => { setOrdersPageSize(size); setOrdersPage(1); }}
            />
          </div>
        )}

        {activeTab === 'shortages' && (
          <div className="planning-section">
            <h3>Critical Material Shortages</h3>
            <p className="section-desc">Components missing to fulfill currently released production orders.</p>
            <Table
              data={shortagesData}
              columns={shortagesColumns}
              totalEntries={shortagesTotal}
              showActions={false}
              showPagination={true}
              currentPage={shortagesPage}
              pageSize={shortagesPageSize}
              onPageChange={setShortagesPage}
              onItemsPerPageChange={(size) => { setShortagesPageSize(size); setShortagesPage(1); }}
            />
          </div>
        )}

        {activeTab === 'expiry' && (
          <div className="planning-section">
            <h3>Batch Expiry & FEFO Priorities</h3>
            <p className="section-desc">Available batches sorted by nearest expiry to ensure First-Expired-First-Out consumption.</p>
            <Table
              data={batchExpiryData}
              columns={expiryColumns}
              totalEntries={batchTotal}
              showActions={false}
              showPagination={true}
              currentPage={batchPage}
              pageSize={batchPageSize}
              onPageChange={setBatchPage}
              onItemsPerPageChange={(size) => { setBatchPageSize(size); setBatchPage(1); }}
            />
          </div>
        )}

        {activeTab === 'history' && <ProductionHistory />}
        {activeTab === 'trend' && <ProductionTrend />}
        {activeTab === 'recommendation' && <ProductionRecommendation />}
        {activeTab === 'manpower' && <ManpowerProductivity />}
      </div>
    </div>
  );
};

export default ProductionPlanning;
