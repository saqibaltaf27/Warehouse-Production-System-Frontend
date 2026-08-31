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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [agingBucket, setAgingBucket] = useState('ALL');

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [isMasterLoading, setIsMasterLoading] = useState(false);

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
      const res = await axiosInstance.get(API_ENDPOINTS.INVENTORY.DASHBOARD_CARDS, { params, skipGlobalLoading: true });
      if (res.data?.success) setDashboardCards(res.data.data.kpiTotals);
    } catch (err) {
      console.error('Dashboard cards error:', err);
    }
  }, [company, warehouse, itemGroup, category]);

  const fetchDashboardItems = useCallback(async () => {
    try {
      setIsDashboardLoading(true);
      const params = { 
        company, warehouse, group: itemGroup, category, search: debouncedSearch, agingBucket,
        page: dashboardPage, limit: dashboardPageSize 
      };
      const res = await axiosInstance.get(API_ENDPOINTS.INVENTORY.DASHBOARD_ITEMS, { params, skipGlobalLoading: true });
      if (res.data?.success) {
        setDashboardItems(res.data.data.shortExpiryItemsTable || []);
        setDashboardTotal(res.data.data.totalRecords || 0);
        setSummaryBuckets(res.data.data.summaryBuckets || null);
        setCategorySummary(res.data.data.categorySummary || []);
      }
    } catch (err) {
      console.error('Dashboard items error:', err);
    } finally {
      setIsDashboardLoading(false);
    }
  }, [company, warehouse, itemGroup, category, debouncedSearch, agingBucket, dashboardPage, dashboardPageSize]);

  const fetchItemMaster = useCallback(async () => {
    try {
      setIsMasterLoading(true);
      const params = { 
        company, warehouse, group: itemGroup, category, search: debouncedSearch, 
        page: masterPage, limit: masterPageSize 
      };
      const res = await axiosInstance.get(API_ENDPOINTS.INVENTORY.ITEMS, { params, skipGlobalLoading: true });
      if (res.data?.success) {
        setItemMasterData(res.data.data.items || []);
        setMasterTotal(res.data.data.total || 0);
      }
    } catch (err) {
      console.error('Item master error:', err);
    } finally {
      setIsMasterLoading(false);
    }
  }, [company, warehouse, itemGroup, category, debouncedSearch, masterPage, masterPageSize]);

  // ── Effects ────────────────────────────────────────
  useEffect(() => { fetchFilters(); }, [fetchFilters]);

  // Fetch cards
  useEffect(() => {
    if (activeTab === 'overview') fetchDashboardCards();
  }, [activeTab, fetchDashboardCards]);

  // Fetch items
  useEffect(() => {
    if (activeTab === 'overview') fetchDashboardItems();
  }, [activeTab, fetchDashboardItems]);

  // Fetch master
  useEffect(() => {
    if (activeTab === 'master') fetchItemMaster();
  }, [activeTab, fetchItemMaster]);

  // Reset page when filters change
  useEffect(() => { setDashboardPage(1); setMasterPage(1); }, [company, warehouse, itemGroup, category, debouncedSearch, agingBucket]);

  // ── Overview Cards items ───────────────────────────
  const overviewCards = dashboardCards
    ? [
        {
          title: 'Total Items',
          description: 'Overall registered SKUs and items currently managed in the inventory.',
          value: fmt(dashboardCards.TotalActiveItems),
          valueLabel: 'Total Count',
          icon: IconBox,
          color: '#1e293b',
        },
        {
          title: 'Item Groups',
          description: 'Distinct high-level item groupings categorized for accounting.',
          value: fmt(dashboardCards.TotalItemGroups),
          valueLabel: 'Active Groups',
          icon: IconPackage,
          color: '#3b82f6',
        },
        {
          title: 'Categories',
          description: 'Sub-classifications of inventory items for precise tracking.',
          value: fmt(dashboardCards.TotalCategories),
          valueLabel: 'Total Categories',
          icon: IconCategory,
          color: '#f59e0b',
          valueColor: '#f59e0b',
        },
        {
          title: 'Warehouses',
          description: 'Physical and virtual storage locations for current stock.',
          value: fmt(dashboardCards.TotalWarehouses),
          valueLabel: 'Locations',
          icon: IconBuildingWarehouse,
          color: '#10b981',
          valueColor: '#10b981',
        },
        {
          title: 'Goods Received',
          description: 'Inbound inventory items securely receipted into stock.',
          value: fmt(dashboardCards.TotalGoodsReceived),
          valueLabel: 'Volume',
          icon: IconTruckDelivery,
          color: '#64748b',
          valueColor: '#64748b',
        },
        {
          title: 'Goods Issued',
          description: 'Outbound inventory shipments and dispatched lots.',
          value: fmt(dashboardCards.TotalGoodsIssued),
          valueLabel: 'Volume',
          icon: IconTruckDelivery,
          color: '#ef4444',
          valueColor: '#ef4444',
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

  const categoryRiskColumns = [
    { key: 'Category', header: 'Category', width: '150px', className: 'inventory-category-cell' },
    {
      key: 'tracking',
      header: 'Lots & Tracking',
      width: '175px',
      render: (row) => `${fmt(row.BatchCount)} Batches - ${fmt(row.SerialCount)} Serials`,
    },
    { key: 'ExpiredQty', header: 'Expired', align: 'right', render: (row) => <strong className="text-danger">{row.ExpiredQty > 0 ? fmt(row.ExpiredQty) : '-'}</strong> },
    { key: 'Days0To30Qty', header: '0-30d', align: 'right', render: (row) => <span className="text-warning">{row.Days0To30Qty > 0 ? fmt(row.Days0To30Qty) : '-'}</span> },
    { key: 'Days31To60Qty', header: '31-60d', align: 'right', render: (row) => <span className="text-warning">{row.Days31To60Qty > 0 ? fmt(row.Days31To60Qty) : '-'}</span> },
    { key: 'Days61To90Qty', header: '61-90d', align: 'right', render: (row) => <span className="text-blue">{row.Days61To90Qty > 0 ? fmt(row.Days61To90Qty) : '-'}</span> },
    { key: 'Days91To180Qty', header: '91-180d', align: 'right', render: (row) => <span className="text-green">{row.Days91To180Qty > 0 ? fmt(row.Days91To180Qty) : '-'}</span> },
    { key: 'Days180PlusQty', header: '180+d', align: 'right', render: (row) => row.Days180PlusQty > 0 ? fmt(row.Days180PlusQty) : '-' },
    { key: 'TotalRiskStockQty', header: 'Total Risk', align: 'right', render: (row) => <strong className="text-danger">{fmt(row.TotalRiskStockQty)}</strong> },
    { key: 'TotalStockQty', header: 'Total Stock', align: 'right', render: (row) => <strong>{fmt(row.TotalStockQty)}</strong> },
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
                  description: `${fmt(summaryBuckets['EXPIRED']?.batchCount)} Batches${summaryBuckets['EXPIRED']?.serialCount ? ` • ${fmt(summaryBuckets['EXPIRED'].serialCount)} Serials` : ''}`,
                  icon: IconAlertCircle,
                  color: '#ef4444',
                  stats: [
                    { label: 'Stock Qty', value: fmt(summaryBuckets['EXPIRED']?.stockQty), color: '#ef4444' }
                  ]
                },
                {
                  title: '0-30 DAYS',
                  description: `${fmt(summaryBuckets['0-30']?.batchCount)} Batches`,
                  icon: IconClock,
                  color: '#f97316',
                  stats: [
                    { label: 'Stock Qty', value: fmt(summaryBuckets['0-30']?.stockQty), color: '#f97316' }
                  ]
                },
                {
                  title: '31-60 DAYS',
                  description: `${fmt(summaryBuckets['31-60']?.batchCount)} Batches${summaryBuckets['31-60']?.serialCount ? ` • ${fmt(summaryBuckets['31-60'].serialCount)} Serials` : ''}`,
                  icon: IconClock,
                  color: '#f59e0b',
                  stats: [
                    { label: 'Stock Qty', value: fmt(summaryBuckets['31-60']?.stockQty), color: '#f59e0b' }
                  ]
                },
                {
                  title: '61-90 DAYS',
                  description: `${fmt(summaryBuckets['61-90']?.batchCount)} Batches`,
                  icon: IconClock,
                  color: '#3b82f6',
                  stats: [
                    { label: 'Stock Qty', value: fmt(summaryBuckets['61-90']?.stockQty), color: '#3b82f6' }
                  ]
                },
                {
                  title: '91-180 DAYS',
                  description: `${fmt(summaryBuckets['91-180']?.batchCount)} Batches`,
                  icon: IconClock,
                  color: '#10b981',
                  stats: [
                    { label: 'Stock Qty', value: fmt(summaryBuckets['91-180']?.stockQty), color: '#10b981' }
                  ]
                },
                {
                  title: '180+ DAYS',
                  description: `${fmt(summaryBuckets['180+']?.batchCount)} Batches${summaryBuckets['180+']?.serialCount ? ` • ${fmt(summaryBuckets['180+'].serialCount)} Serials` : ''}`,
                  icon: IconClock,
                  color: '#06b6d4',
                  stats: [
                    { label: 'Stock Qty', value: fmt(summaryBuckets['180+']?.stockQty), color: '#06b6d4' }
                  ]
                },
                {
                  title: 'TOTAL INVENTORY',
                  description: `${fmt(summaryBuckets['ALL']?.batchCount)} Batches${summaryBuckets['ALL']?.serialCount ? ` • ${fmt(summaryBuckets['ALL'].serialCount)} Serials` : ''}`,
                  icon: IconPackage,
                  color: '#4f46e5',
                  active: true,
                  stats: [
                    { label: 'Stock Qty', value: fmt(summaryBuckets['ALL']?.stockQty), color: '#4f46e5' }
                  ]
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
                  <Table
                    data={categorySummary}
                    columns={categoryRiskColumns}
                    totalEntries={categorySummary.length}
                    showActions={false}
                    showPagination={false}
                  />
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
              isLoading={isDashboardLoading}
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
            isLoading={isMasterLoading}
          />
        </div>
      )}
    </div>
  );
};

export default Inventory;
