import React, { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import { axiosInstance } from '../../apis/axiosinstance';
import { API_ENDPOINTS } from '../../apis/endpoints';
import Table from '../../global-components/Table/Table';
import { IconSearch, IconRefresh } from '@tabler/icons-react';
import '../ProductionOrders/ProductionOrders.css';
import './ProductionPlanning.css';

const fmt = (n) => {
  if (n == null || isNaN(n)) return '0';
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
};

const fmtDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const filterSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '38px',
    height: '38px',
    fontSize: '13px',
    borderRadius: '2px',
    borderColor: state.isFocused ? 'var(--primary-blue)' : '#cbd5e1',
    boxShadow: 'none',
    backgroundColor: '#ffffff',
    cursor: 'text',
    '&:hover': {
      borderColor: state.isFocused ? 'var(--primary-blue)' : '#94a3b8',
    },
  }),
  valueContainer: (base) => ({
    ...base,
    height: '38px',
    padding: '0 8px',
    display: 'flex',
    alignItems: 'center',
  }),
  input: (base) => ({
    ...base,
    margin: '0',
    padding: '0',
    color: '#1e293b',
  }),
  indicatorsContainer: (base) => ({
    ...base,
    height: '38px',
  }),
  dropdownIndicator: (base) => ({
    ...base,
    padding: '4px 6px',
    color: '#64748b',
    '&:hover': {
      color: '#1e293b',
    },
  }),
  clearIndicator: (base) => ({
    ...base,
    padding: '4px',
    color: '#94a3b8',
    '&:hover': {
      color: '#ef4444',
    },
  }),
  menu: (base) => ({
    ...base,
    fontSize: '13px',
    borderRadius: '2px',
    zIndex: 9999,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
    border: '1px solid #e2e8f0',
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  option: (base, state) => ({
    ...base,
    fontSize: '13px',
    padding: '8px 12px',
    backgroundColor: state.isSelected
      ? 'var(--primary-blue)'
      : state.isFocused
        ? '#f1f5f9'
        : '#ffffff',
    color: state.isSelected ? '#ffffff' : '#1e293b',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  placeholder: (base) => ({
    ...base,
    color: '#94a3b8',
    fontSize: '13px',
    whiteSpace: 'nowrap',
  }),
  singleValue: (base) => ({
    ...base,
    color: '#1e293b',
    fontSize: '13px',
    whiteSpace: 'nowrap',
  }),
};

const bucketOptions = [
  { value: 'Expired', label: 'Expired' },
  { value: '0-30 Days', label: '0-30 Days' },
  { value: '31-90 Days', label: '31-90 Days' },
  { value: '90+ Days', label: '90+ Days' },
];

const BatchExpiry = () => {
  const [batchExpiryData, setBatchExpiryData] = useState([]);
  const [batchPage, setBatchPage] = useState(1);
  const [batchPageSize, setBatchPageSize] = useState(20);
  const [batchTotal, setBatchTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);

  const [filters, setFilters] = useState({
    search: '',
    bucket: '',
    warehouse: '',
    fromDate: '',
    toDate: '',
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Fetch warehouses for filter dropdown
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await axiosInstance.get(API_ENDPOINTS.PRODUCTION_ORDERS.WAREHOUSES);
        if (res.data?.success) {
          setWarehouses(res.data.data || []);
        }
      } catch (err) {
        console.error('Error fetching warehouses for BatchExpiry:', err);
      }
    };
    fetchWarehouses();
  }, []);

  const warehouseOptions = (warehouses || []).map((w) => ({
    value: w.WhsCode,
    label: w.WhsName ? `${w.WhsCode} - ${w.WhsName}` : w.WhsCode,
  }));

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 400);
    return () => clearTimeout(handler);
  }, [filters.search]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      bucket: '',
      warehouse: '',
      fromDate: '',
      toDate: '',
    });
    setDebouncedSearch('');
  };

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.bucket ||
    filters.warehouse ||
    filters.fromDate ||
    filters.toDate
  );

  const fetchBatchExpiry = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: batchPage,
        pageSize: batchPageSize,
        search: debouncedSearch,
        warehouse: filters.warehouse,
        bucket: filters.bucket,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      };
      const res = await axiosInstance.get(API_ENDPOINTS.PRODUCTION_PLANNING.BATCH_EXPIRY, { params });
      if (res.data?.success) {
        setBatchExpiryData(res.data.data);
        setBatchTotal(res.data.pagination.totalRecords);
      }
    } catch (err) {
      console.error('Production Planning Batch Expiry error:', err);
    } finally {
      setLoading(false);
    }
  }, [batchPage, batchPageSize, debouncedSearch, filters.warehouse, filters.bucket, filters.fromDate, filters.toDate]);

  useEffect(() => {
    setBatchPage(1);
  }, [debouncedSearch, filters.warehouse, filters.bucket, filters.fromDate, filters.toDate]);

  useEffect(() => {
    fetchBatchExpiry();
  }, [fetchBatchExpiry]);

  const expiryColumns = [
    { header: 'Item Code', key: 'ItemCode' },
    {
      header: 'Item Name',
      key: 'ItemName',
      render: (r) => <span title={r.ItemName}>{(r.ItemName || '').substring(0, 35)}</span>,
    },
    { header: 'Batch Number', key: 'BatchNumber' },
    { header: 'Warehouse', key: 'WhsCode' },
    {
      header: 'Quantity',
      key: 'Quantity',
      render: (r) => <span className="tabular-nums">{fmt(r.Quantity)}</span>,
    },
    { header: 'Expiry Date', key: 'ExpiryDate', render: (r) => fmtDate(r.ExpiryDate) },
    {
      header: 'Aging Bucket',
      key: 'ExpiryBucket',
      render: (r) => {
        const bucketVal = r.ExpiryBucket || '';
        let cls = 'normal';
        if (bucketVal.includes('Expired')) cls = 'expired';
        if (bucketVal.includes('0-30')) cls = 'critical';
        if (bucketVal.includes('31-90')) cls = 'warning';
        return <span className={`status-badge ${cls}`}>{bucketVal.substring(3)}</span>;
      },
    },
  ];

  return (
    <div className="production-planning-page fade-in-up layout-page-padding">
      <div className="planning-content fade-in-up delay-100">
        <div className="planning-section">

          {/* Filter Toolbar Card */}
          <div className="po-filter-toolbar-card">
            <div className="po-filter-toolbar-grid">
              {/* Search */}
              <div className="po-filter-item po-filter-search-box">
                <label className="po-filter-label">Search</label>
                <div style={{ position: 'relative' }}>
                  <IconSearch size={18} className="po-filter-search-icon" />
                  <input
                    type="text"
                    placeholder="Search by Item Code, Name, Batch..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="po-filter-search-input"
                  />
                </div>
              </div>

              {/* Aging Bucket Filter */}
              <div className="po-filter-item" style={{ minWidth: '160px' }}>
                <label className="po-filter-label">Aging Bucket</label>
                <Select
                  value={bucketOptions.find((opt) => opt.value === filters.bucket) || null}
                  onChange={(opt) => handleFilterChange('bucket', opt ? opt.value : '')}
                  options={bucketOptions}
                  placeholder="All Buckets"
                  isClearable
                  isSearchable
                  menuPortalTarget={document.body}
                  styles={filterSelectStyles}
                />
              </div>

              {/* Warehouse Filter */}
              <div className="po-filter-item" style={{ minWidth: '180px' }}>
                <label className="po-filter-label">Warehouse</label>
                <Select
                  value={warehouseOptions.find((opt) => opt.value === filters.warehouse) || null}
                  onChange={(opt) => handleFilterChange('warehouse', opt ? opt.value : '')}
                  options={warehouseOptions}
                  placeholder="All Warehouses"
                  isClearable
                  isSearchable
                  menuPortalTarget={document.body}
                  styles={filterSelectStyles}
                />
              </div>

              {/* Expiry Date From */}
              <div className="po-filter-item">
                <label className="po-filter-label">Expiry From</label>
                <input
                  type="date"
                  className="po-filter-date-input"
                  value={filters.fromDate}
                  onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                />
              </div>

              {/* Expiry Date To */}
              <div className="po-filter-item">
                <label className="po-filter-label">Expiry To</label>
                <input
                  type="date"
                  className="po-filter-date-input"
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange('toDate', e.target.value)}
                />
              </div>

              {/* Reset Button */}
              <div className="po-filter-item">
                <label className="po-filter-label">&nbsp;</label>
                <button
                  type="button"
                  className="po-filter-reset-btn"
                  onClick={handleResetFilters}
                  disabled={!hasActiveFilters}
                  title={hasActiveFilters ? 'Reset all filters' : 'No filters applied'}
                >
                  <IconRefresh size={16} />
                  Reset
                </button>
              </div>
            </div>
          </div>

          <Table
            data={batchExpiryData}
            columns={expiryColumns}
            totalEntries={batchTotal}
            showActions={false}
            showPagination={true}
            isLoading={loading}
            currentPage={batchPage}
            pageSize={batchPageSize}
            onPageChange={setBatchPage}
            onItemsPerPageChange={(size) => {
              setBatchPageSize(size);
              setBatchPage(1);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default BatchExpiry;
