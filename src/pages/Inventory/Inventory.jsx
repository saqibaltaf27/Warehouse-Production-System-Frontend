import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../../apis/axiosinstance';
import { API_ENDPOINTS } from '../../apis/endpoints';
import Card from '../../global-components/Card/Card';
import Table from '../../global-components/Table/Table';
import Tabs from '../../global-components/Tabs/Tabs';
import {
  IconPackage,
  IconBox,
  IconCategory,
  IconBuildingWarehouse,
  IconAlertCircle,
  IconClock,
  IconTruckDelivery,
  IconSearch,
  IconDownload,
  IconRefresh,
} from '@tabler/icons-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './Inventory.css';

const fmt = (n) => {
  if (n == null || isNaN(n)) return '0';
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
};

const TABS = [
  { key: 'overview', label: 'Inventory Overview' },
  { key: 'master', label: 'Item Master' },
];

const AGING_TABS = [
  { key: 'EXPIRED', label: 'Expired' },
  { key: '0-30', label: '0-30 Days' },
  { key: '31-60', label: '31-60 Days' },
  { key: '61-90', label: '61-90 Days' },
  { key: '91-180', label: '91-180 Days' },
  { key: '180+', label: '180+ Days' },
  { key: 'ALL', label: 'Total Inventory' },
];

const Inventory = () => {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('overview');
  const [filterOptions, setFilterOptions] = useState(null);

  // Filters
  const [company, setCompany] = useState('LDS');
  const [warehouse, setWarehouse] = useState('');
  const [itemGroup, setItemGroup] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [agingBucket, setAgingBucket] = useState('ALL');

  // Overview Tab Data
  const [dashboardCards, setDashboardCards] = useState(null);
  const [dashboardItems, setDashboardItems] = useState([]);
  const [dashboardPage, setDashboardPage] = useState(1);
  const [dashboardPageSize, setDashboardPageSize] = useState(25);
  const [dashboardTotal, setDashboardTotal] = useState(0);
  const [summaryBuckets, setSummaryBuckets] = useState(null);
  const [categorySummary, setCategorySummary] = useState([]);

  // Item Master Tab Data
  const [itemMasterData, setItemMasterData] = useState([]);
  const [masterPage, setMasterPage] = useState(1);
  const [masterPageSize, setMasterPageSize] = useState(25);
  const [masterTotal, setMasterTotal] = useState(0);

  // ── Fetch helpers ──────────────────────────────────
  const fetchFilters = useCallback(async () => {
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.INVENTORY.FILTERS, { params: { company } });
      if (res.data?.success) setFilterOptions(res.data.data);
    } catch (err) {
      console.error('Inventory filter error:', err);
    }
  }, [company]);

  const fetchDashboardCards = useCallback(async () => {
    try {
      const params = { company, warehouse, group: itemGroup, category };
      const res = await axiosInstance.get(API_ENDPOINTS.INVENTORY.DASHBOARD_CARDS, { params });
      if (res.data?.success) setDashboardCards(res.data.data.kpiTotals);
    } catch (err) {
      console.error('Dashboard cards error:', err);
    }
  }, [company, warehouse, itemGroup, category]);

  const fetchDashboardItems = useCallback(async () => {
    try {
      const params = { 
        company, warehouse, group: itemGroup, category, search, agingBucket,
        page: dashboardPage, limit: dashboardPageSize 
      };
      const res = await axiosInstance.get(API_ENDPOINTS.INVENTORY.DASHBOARD_ITEMS, { params });
      if (res.data?.success) {
        setDashboardItems(res.data.data.shortExpiryItemsTable || []);
        setDashboardTotal(res.data.data.totalRecords || 0);
        setSummaryBuckets(res.data.data.summaryBuckets || null);
        setCategorySummary(res.data.data.categorySummary || []);
      }
    } catch (err) {
      console.error('Dashboard items error:', err);
    }
  }, [company, warehouse, itemGroup, category, search, agingBucket, dashboardPage, dashboardPageSize]);

  const fetchItemMaster = useCallback(async () => {
    try {
      const params = { 
        company, warehouse, group: itemGroup, category, search, 
        page: masterPage, limit: masterPageSize 
      };
      const res = await axiosInstance.get(API_ENDPOINTS.INVENTORY.ITEMS, { params });
      if (res.data?.success) {
        setItemMasterData(res.data.data.items || []);
        setMasterTotal(res.data.data.total || 0);
      }
    } catch (err) {
      console.error('Item master error:', err);
    }
  }, [company, warehouse, itemGroup, category, search, masterPage, masterPageSize]);

  // ── Effects ────────────────────────────────────────
  useEffect(() => { fetchFilters(); }, [fetchFilters]);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchDashboardCards();
      fetchDashboardItems();
    } else if (activeTab === 'master') {
      fetchItemMaster();
    }
  }, [activeTab, fetchDashboardCards, fetchDashboardItems, fetchItemMaster]);

  // Reset page when filters change
  useEffect(() => { setDashboardPage(1); setMasterPage(1); }, [company, warehouse, itemGroup, category, search, agingBucket]);

  // ── Overview Cards items ───────────────────────────
  const overviewCards = dashboardCards
    ? [
        {
          title: 'Total Items',
          value: fmt(dashboardCards.TotalActiveItems),
          trend: 12,
          trendText: 'Last month',
          icon: IconPackage,
        },
        {
          title: 'Item Groups',
          value: fmt(dashboardCards.TotalItemGroups),
          trend: 4,
          trendText: 'Last month',
          icon: IconBox,
        },
        {
          title: 'Categories',
          value: fmt(dashboardCards.TotalCategories),
          trend: 8,
          trendText: 'Last month',
          icon: IconCategory,
        },
        {
          title: 'Warehouses',
          value: fmt(dashboardCards.TotalWarehouses),
          trend: 0,
          trendText: 'Last month',
          icon: IconBuildingWarehouse,
        },
        {
          title: 'Goods Received',
          value: fmt(dashboardCards.TotalGoodsReceived),
          trend: -2,
          trendText: 'Last month',
          icon: IconTruckDelivery,
        },
        {
          title: 'Goods Issued',
          value: fmt(dashboardCards.TotalGoodsIssued),
          trend: 5,
          trendText: 'Last month',
          icon: IconTruckDelivery,
        },
      ]
    : [];

  // ── Columns ─────────────────────────────────────────
  const dashboardColumns = [
    { header: 'COMPANY', key: 'Company' },
    { header: 'ITEM CODE', key: 'ItemCode' },
    { header: 'ITEM NAME', key: 'ItemName', render: (r) => <span title={r.ItemName}>{(r.ItemName || '').substring(0, 30)}</span> },
    { header: 'CATEGORY', key: 'Category' },
    { header: 'LOT / SERIAL NO', key: 'BatchNumber' },
    { header: 'EXPIRY DATE', key: 'ExpiryDate', render: (r) => r.ExpiryDate ? new Date(r.ExpiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
    { header: 'DAYS TO EXPIRY', key: 'DaysToExpiry', render: (r) => r.DaysToExpiry != null ? `${Math.abs(r.DaysToExpiry)} days` : '—' },
    { 
      header: 'EXPIRY AGING', key: 'AgingBucket', render: (r) => {
        if (!r.AgingBucket || r.AgingBucket === 'ALL') return '—';
        if (r.AgingBucket === 'EXPIRED') return <span className="status-badge expired">Expired</span>;
        return <span className="status-badge near-expiry">{r.AgingBucket} Days</span>;
      }
    },
    { header: 'STOCK UNITS', key: 'StockQty', render: (r) => <span className="text-right tabular-nums font-bold">{fmt(r.StockQty)}</span> },
  ];

  const masterColumns = [
    { header: 'ITEM CODE', key: 'ItemCode' },
    { header: 'ITEM NAME', key: 'ItemName', render: (r) => <span title={r.ItemName}>{(r.ItemName || '').substring(0, 35)}</span> },
    { header: 'CAT NO', key: 'FrgnName' },
    { header: 'COMPANY', key: 'Company' },
    { header: 'CATEGORY', key: 'Category' },
    { header: 'QUANTITY', key: 'Stock', render: (r) => <span className="text-right tabular-nums">{fmt(r.Stock)}</span> },
  ];

  return (
    <div className="inventory-page fade-in-up">
      {/* Filters */}
      <div className="inventory-filters">
        {activeTab !== 'overview' && (
          <input
            className="search-input"
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        )}
        <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
          <option value="">All Warehouses</option>
          {filterOptions?.warehouses?.map((w) => (
            <option key={w.value} value={w.value}>{w.label}</option>
          ))}
        </select>
        <select value={itemGroup} onChange={(e) => setItemGroup(e.target.value)}>
          <option value="">All Item Groups</option>
          {filterOptions?.itemGroups?.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {filterOptions?.categories?.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="inventory-tabs">
        <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div className="fade-in-up">
          {dashboardCards && (
            <div className="inventory-overview-cards">
              <Card items={overviewCards} />
            </div>
          )}

          {summaryBuckets && (
            <div className="expiry-cards-wrapper">
              <Card items={[
                {
                  title: 'EXPIRED',
                  value: fmt(summaryBuckets['EXPIRED']?.stockQty),
                  trend: -12,
                  trendText: `${fmt(summaryBuckets['EXPIRED']?.batchCount)} Batches`,
                  icon: IconAlertCircle,
                },
                {
                  title: '0-30 DAYS',
                  value: fmt(summaryBuckets['0-30']?.stockQty),
                  trend: -5,
                  trendText: `${fmt(summaryBuckets['0-30']?.batchCount)} Batches`,
                  icon: IconClock,
                },
                {
                  title: '31-60 DAYS',
                  value: fmt(summaryBuckets['31-60']?.stockQty),
                  trend: 2,
                  trendText: `${fmt(summaryBuckets['31-60']?.batchCount)} Batches`,
                  icon: IconClock,
                },
                {
                  title: '61-90 DAYS',
                  value: fmt(summaryBuckets['61-90']?.stockQty),
                  trend: 8,
                  trendText: `${fmt(summaryBuckets['61-90']?.batchCount)} Batches`,
                  icon: IconClock,
                },
                {
                  title: '91-180 DAYS',
                  value: fmt(summaryBuckets['91-180']?.stockQty),
                  trend: 14,
                  trendText: `${fmt(summaryBuckets['91-180']?.batchCount)} Batches`,
                  icon: IconClock,
                },
                {
                  title: '180+ DAYS',
                  value: fmt(summaryBuckets['180+']?.stockQty),
                  trend: 22,
                  trendText: `${fmt(summaryBuckets['180+']?.batchCount)} Batches`,
                  icon: IconClock,
                },
                {
                  title: 'TOTAL INVENTORY',
                  value: fmt(summaryBuckets['ALL']?.stockQty),
                  trend: 5,
                  trendText: `${fmt(summaryBuckets['ALL']?.batchCount)} Batches`,
                  icon: IconPackage,
                },
              ]} />
            </div>
          )}

          {summaryBuckets && categorySummary && (
            <div className="dashboard-bottom-grid">
              {/* Bar Chart */}
              <div className="chart-section">
                <h3>Inventory Expiry Risk</h3>
                <div className="inventory-chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={[
                        { name: '91-180 Days', value: summaryBuckets['91-180']?.stockQty || 0, color: '#10B981' },
                        { name: '61-90 Days', value: summaryBuckets['61-90']?.stockQty || 0, color: '#3B82F6' },
                        { name: '31-60 Days', value: summaryBuckets['31-60']?.stockQty || 0, color: '#F59E0B' },
                        { name: '0-30 Days', value: summaryBuckets['0-30']?.stockQty || 0, color: '#F97316' },
                        { name: 'Expired', value: summaryBuckets['EXPIRED']?.stockQty || 0, color: '#EF4444' }
                      ]}
                      margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} />
                      <XAxis type="number" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11, fill: '#798089' }} />
                      <Tooltip formatter={(value) => [fmt(value), 'Qty']} />
                      <Bar dataKey="value" barSize={12} radius={[0, 4, 4, 0]}>
                        {
                          [
                            { color: '#10B981' },
                            { color: '#3B82F6' },
                            { color: '#F59E0B' },
                            { color: '#F97316' },
                            { color: '#EF4444' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))
                        }
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Risk Table */}
              <div className="chart-section">
                <h3>Overall Expiry & Category Risk Breakdown</h3>
                <div className="inventory-risk-table-scroll">
                  <table className="category-risk-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Lots & Tracking</th>
                        <th className="text-right">Expired</th>
                        <th className="text-right">0-30d</th>
                        <th className="text-right">31-60d</th>
                        <th className="text-right">61-90d</th>
                        <th className="text-right">91-180d</th>
                        <th className="text-right">180+d</th>
                        <th className="text-right">Total Risk</th>
                        <th className="text-right">Total Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categorySummary.map((cat, i) => (
                        <tr key={i}>
                          <td className="font-bold">{cat.Category}</td>
                          <td>{cat.BatchCount} Batches - {cat.SerialCount} Serials</td>
                          <td className="text-right text-danger font-bold">{cat.ExpiredQty > 0 ? fmt(cat.ExpiredQty) : '-'}</td>
                          <td className="text-right text-warning">{cat.Days0To30Qty > 0 ? fmt(cat.Days0To30Qty) : '-'}</td>
                          <td className="text-right text-warning">{cat.Days31To60Qty > 0 ? fmt(cat.Days31To60Qty) : '-'}</td>
                          <td className="text-right text-blue">{cat.Days61To90Qty > 0 ? fmt(cat.Days61To90Qty) : '-'}</td>
                          <td className="text-right text-green">{cat.Days91To180Qty > 0 ? fmt(cat.Days91To180Qty) : '-'}</td>
                          <td className="text-right">{cat.Days180PlusQty > 0 ? fmt(cat.Days180PlusQty) : '-'}</td>
                          <td className="text-right text-danger font-bold">{fmt(cat.TotalRiskStockQty)}</td>
                          <td className="text-right font-bold">{fmt(cat.TotalStockQty)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <div className="inventory-section mt-6">
            <div className="table-toolbar">
              <div className="search-bar-wrapper">
                <IconSearch size={16} className="search-bar-icon" />
                <input 
                  type="text" 
                  className="search-bar-input"
                  placeholder="Search SKU, Item Name, Batch No..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Tabs
                tabs={AGING_TABS}
                activeTab={agingBucket}
                onTabChange={setAgingBucket}
                className="aging-filters-tabs"
              />
              <div className="toolbar-actions">
                <button className="toolbar-btn export-btn">
                  <IconDownload size={16} /> Export CSV
                </button>
                <button onClick={fetchDashboardItems} className="toolbar-btn refresh-btn">
                  <IconRefresh size={16} />
                </button>
                <div className="page-size-selector">
                  <span className="page-size-label">Show:</span>
                  <select 
                    value={dashboardPageSize} 
                    onChange={(e) => { setDashboardPageSize(Number(e.target.value)); setDashboardPage(1); }}
                    className="page-size-select"
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                  </select>
                </div>
              </div>
            </div>
            <Table
              data={dashboardItems}
              columns={dashboardColumns}
              totalEntries={dashboardTotal}
              showActions={false}
              showPagination={true}
              currentPage={dashboardPage}
              pageSize={dashboardPageSize}
              onPageChange={setDashboardPage}
              onItemsPerPageChange={(size) => { setDashboardPageSize(size); setDashboardPage(1); }}
              onRowClick={(row) => navigate(`/inventory/item-master/${encodeURIComponent(row.ItemCode)}?company=${company}`)}
            />
          </div>
        </div>
      )}

      {/* Item Master Tab Content */}
      {activeTab === 'master' && (
        <div className="inventory-section mt-6 fade-in-up">
          <h3>Item Master</h3>
          <Table
            data={itemMasterData}
            columns={masterColumns}
            totalEntries={masterTotal}
            showActions={false}
            showPagination
            currentPage={masterPage}
            pageSize={masterPageSize}
            onPageChange={setMasterPage}
            onItemsPerPageChange={(size) => { setMasterPageSize(size); setMasterPage(1); }}
            onRowClick={(row) => navigate(`/inventory/item-master/${encodeURIComponent(row.ItemCode)}?company=${company}`)}
          />
        </div>
      )}
    </div>
  );
};

export default Inventory;
