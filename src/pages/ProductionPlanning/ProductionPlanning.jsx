import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { axiosInstance } from '../../apis/axiosinstance';
import { API_ENDPOINTS } from '../../apis/endpoints';
import Card from '../../global-components/Card/Card';
import Pagination from '../../global-components/Pagination/Pagination';
import ProductionHistory from './ProductionHistory';
import ProductionTrend from './ProductionTrend';
import ProductionRecommendation from './ProductionRecommendation';
import ManEfficiencyTab from './ManEfficiencyTab';
import MachineEfficiencyTab from './MachineEfficiencyTab';
import Table from '../../global-components/Table/Table';
import Tabs from '../../global-components/Tabs/Tabs';
import GlobalPopup from '../../global-components/GlobalPopup/GlobalPopup';
import Button from '../../global-components/Button/Button';
import Select from 'react-select';
import {
  IconChecklist,
  IconClock,
  IconAlertTriangle,
  IconReportAnalytics,
  IconCalendarEvent,
  IconHistory,
  IconChartBar,
  IconBulb,
  IconPlus,
  IconEdit,
  IconUsers,
  IconSettings
} from '@tabler/icons-react';
import './ProductionPlanning.css';

const ExpandableMachineCell = ({ machineStr }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!machineStr) return <span>-</span>;
  
  let machines = [];
  try {
    const parsed = JSON.parse(machineStr);
    if (Array.isArray(parsed)) {
      machines = parsed.map(m => {
        if (typeof m === 'string') return { name: m };
        return { name: m.name || 'Unknown', qty: m.qty, hours: m.hours };
      });
    }
  } catch(e) {
    machines = machineStr.split(', ').map(m => ({ name: m }));
  }

  if (machines.length === 0) return <span>-</span>;
  
  const renderItem = (m) => {
    let text = m.name;
    if (m.qty || m.hours) {
      const parts = [];
      if (m.qty) parts.push(`Qty: ${m.qty}`);
      if (m.hours) parts.push(`Hrs: ${m.hours}`);
      text += ` (${parts.join(', ')})`;
    }
    return text;
  };

  if (machines.length === 1) {
    return <span>{renderItem(machines[0])}</span>;
  }
  
  return (
    <div>
      <div onClick={() => setExpanded(!expanded)} className="expandable-cell-trigger">
        <IconSettings size={16} />
        {machines[0].name}
        {machines.length > 1 && (
          <span className="badge">+{machines.length - 1}</span>
        )}
      </div>
      {expanded && machines.length > 1 && (
        <div className="plan-employee-list expandable-cell-list">
          {machines.map((m, idx) => (
            <div key={idx} className="plan-employee-item">
              {renderItem(m)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ExpandableEmployeeCell = ({ jdItems }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!jdItems || jdItems.length === 0) return <span>-</span>;
  
  if (jdItems.length === 1) {
    return <span>{jdItems[0].name} - {jdItems[0].jd}</span>;
  }
  
  return (
    <div>
      <div onClick={() => setExpanded(!expanded)} className="expandable-cell-trigger">
        <IconUsers size={16} />
        {jdItems[0]?.name || 'Unassigned'}
        {jdItems.length > 1 && (
          <span className="badge">+{jdItems.length - 1}</span>
        )}
      </div>
      {expanded && jdItems.length > 1 && (
        <div className="plan-employee-list expandable-cell-list">
          {jdItems.slice(1).map((i, idx) => (
            <div key={idx} className="plan-employee-item">
              {i.name} - <span className="expandable-cell-jd-text">{i.jd}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'orders');

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

  // Production Planning (New Tab) State
  const [planData, setPlanData] = useState([]);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [openPOs, setOpenPOs] = useState([]);
  const [machines, setMachines] = useState([]);
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const lineOptions = [
    { value: 'R-Test Line', label: 'R-Test Line' },
    { value: 'Packing Line', label: 'Packing Line' }
  ];

  const [editingPlanId, setEditingPlanId] = useState(null);
  const [planFormData, setPlanFormData] = useState({
    date: getTodayDate(),
    line: 'R-Test Line',
    machine: '[]',
    supervisor: '',
    po: '',
    jdItems: [{ name: '', jd: '' }]
  });

  const handleJdItemChange = (idx, field, val) => {
    const newItems = [...planFormData.jdItems];
    newItems[idx][field] = val;
    setPlanFormData({ ...planFormData, jdItems: newItems });
  };

  const handleAddJdItem = () => {
    setPlanFormData({ ...planFormData, jdItems: [...planFormData.jdItems, { name: '', jd: '' }] });
  };

  const handleRemoveJdItem = (idx) => {
    const newItems = planFormData.jdItems.filter((_, i) => i !== idx);
    setPlanFormData({ ...planFormData, jdItems: newItems });
  };

  const handleSavePlan = async () => {
    try {
      const payload = {
        ...planFormData,
        jdItems: planFormData.jdItems.filter(item => item.name.trim() !== '' || item.jd.trim() !== '')
      };
      
      let res;
      if (editingPlanId) {
        res = await axiosInstance.put(`${API_ENDPOINTS.PRODUCTION_PLANNING.UPDATE_PLAN}/${editingPlanId}`, payload);
      } else {
        res = await axiosInstance.post(API_ENDPOINTS.PRODUCTION_PLANNING.CREATE_PLAN, payload);
      }

      if (res.data?.success) {
        setIsPlanModalOpen(false);
        setEditingPlanId(null);
        setPlanFormData({ date: getTodayDate(), line: 'R-Test Line', machine: '[]', supervisor: '', po: '', jdItems: [{ name: '', jd: '' }] });
        fetchProductionPlans(); // Refresh the list
      } else {
        alert(res.data?.message || 'Failed to save plan');
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Error saving plan');
    }
  };

  const handleEditPlan = (plan) => {
    navigate('/production-plan/edit', { state: { plan } });
  };

  const fetchProductionPlans = useCallback(async () => {
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.PRODUCTION_PLANNING.GET_PLANS);
      if (res.data?.success) {
        setPlanData(res.data.data);
      }
    } catch (err) {
      console.error('Fetch Production Plans error:', err);
    }
  }, []);

  const fetchMachines = useCallback(async () => {
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.PRODUCTION_PLANNING.GET_MACHINES);
      if (res.data?.success) {
        setMachines(res.data.data);
      }
    } catch (err) {
      console.error('Fetch Machines error:', err);
    }
  }, []);

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

  const fetchOpenPOs = useCallback(async () => {
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.PRODUCTION_PLANNING.OPEN_ORDERS);
      if (res.data?.success) {
        setOpenPOs(res.data.data);
      }
    } catch (err) {
      console.error('Fetch Open POs error:', err);
    }
  }, []);

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

  // Always fetch KPIs, Open POs, Production Plans, and Machines on mount
  useEffect(() => {
    if (activeTab !== 'orders') fetchKpisAndOrders();
    fetchOpenPOs();
    fetchProductionPlans();
    fetchMachines();
  }, [fetchKpisAndOrders, fetchOpenPOs, fetchProductionPlans, fetchMachines]);

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

  const planColumns = [
    { header: 'Date', key: 'PlanDate', render: (r) => fmtDate(r.PlanDate) },
    { header: 'Line', key: 'Line' },
    { header: 'PO', key: 'PO' },
    { header: 'Planned Qty', key: 'PlannedQty', render: (r) => fmt(r.PlannedQty) },
    { header: 'Completed Qty', key: 'CmpltQty', render: (r) => fmt(r.CmpltQty) },
    { header: 'Produced Qty', key: 'ProductionQty', render: (r) => fmt(r.ProductionQty) },
    { header: 'Shift', key: 'Shift' },
    { header: 'Act. Manpower', key: 'ActualManpower' },
    { header: 'Prd %', key: 'PrdPercentage', render: (r) => r.PrdPercentage ? `${Number(r.PrdPercentage).toFixed(2)}%` : '-' },
    { header: 'Machine', key: 'Machine', render: (r) => <ExpandableMachineCell machineStr={r.Machine} /> },
    { header: 'Supervisor', key: 'Supervisor' },
    { header: 'Assign Employee', key: 'employees', render: (r) => <ExpandableEmployeeCell jdItems={r.jdItems} /> },
    { header: 'Action', key: 'action', render: (r) => (
      <Button variant="outline" size="sm" onClick={() => handleEditPlan(r)} icon={<IconEdit size={16} />}>
        Edit
      </Button>
    )}
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

   

      <div className="vertical-tabs-layout">
        <div className="planning-tabs vertical-tabs-container">
          <Tabs
            tabs={[
              { key: 'orders', label: 'Daily Execution', icon: <IconCalendarEvent size={18} /> },
              { key: 'production-order', label: 'Production Planning', icon: <IconPlus size={18} /> },
              { key: 'man-effiency', label: 'Man Effiency', icon: <IconUsers size={18} /> },
              { key: 'machine-efficiency', label: 'Machine Efficiency', icon: <IconSettings size={18} /> },
              { key: 'shortages', label: 'Material Shortages', icon: <IconAlertTriangle size={18} /> },
              { key: 'expiry', label: 'Batch Expiry', icon: <IconClock size={18} /> },
              { key: 'history', label: 'Production History', icon: <IconHistory size={18} /> },
              { key: 'trend', label: 'Trend', icon: <IconChartBar size={18} /> },
              { key: 'recommendation', label: 'Planner', icon: <IconBulb size={18} /> }
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            className="vertical-tabs"
          />
        </div>

        <div className="planning-content vertical-tabs-content fade-in-up delay-100">
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

        {activeTab === 'production-order' && (
          <div className="planning-section">
            <div className="planning-section-header">
              <h3>Production Planning</h3>
              <Button variant="primary" icon={<IconPlus size={16} />} onClick={() => navigate('/production-plan/add')}>
                Add today plans
              </Button>
            </div>
            <Table
              data={planData}
              columns={planColumns}
              totalEntries={planData.length}
              showActions={false}
              showPagination={true}
              currentPage={1}
              pageSize={10}
              onPageChange={() => {}}
              onItemsPerPageChange={() => {}}
            />


          </div>
        )}

        {activeTab === 'man-effiency' && <ManEfficiencyTab />}
        {activeTab === 'machine-efficiency' && <MachineEfficiencyTab />}

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
      </div>
    </div>
  </div>
  );
};

export default ProductionPlanning;
