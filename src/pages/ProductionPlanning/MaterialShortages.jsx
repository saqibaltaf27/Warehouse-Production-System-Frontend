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

const statusOptions = [
  { value: 'zero_stock', label: 'Zero Stock (Out of Stock)' },
  { value: 'partial_stock', label: 'Partial Stock' },
];

const MaterialShortages = () => {
  const [shortagesData, setShortagesData] = useState([]);
  const [shortagesPage, setShortagesPage] = useState(1);
  const [shortagesPageSize, setShortagesPageSize] = useState(20);
  const [shortagesTotal, setShortagesTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    warehouse: '',
    minShortage: '',
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Fetch warehouses for dropdown
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await axiosInstance.get(API_ENDPOINTS.PRODUCTION_ORDERS.WAREHOUSES);
        if (res.data?.success) {
          setWarehouses(res.data.data || []);
        }
      } catch (err) {
        console.error('Error fetching warehouses for MaterialShortages:', err);
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
      status: '',
      warehouse: '',
      minShortage: '',
    });
    setDebouncedSearch('');
  };

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.status ||
    filters.warehouse ||
    filters.minShortage
  );

  const fetchShortages = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: shortagesPage,
        pageSize: shortagesPageSize,
        search: debouncedSearch,
        warehouse: filters.warehouse,
        status: filters.status,
        minShortage: filters.minShortage,
      };
      const res = await axiosInstance.get(API_ENDPOINTS.PRODUCTION_PLANNING.SHORTAGES, { params });
      if (res.data?.success) {
        setShortagesData(res.data.data);
        setShortagesTotal(res.data.pagination.totalRecords);
      }
    } catch (err) {
      console.error('Production Planning Shortages error:', err);
    } finally {
      setLoading(false);
    }
  }, [shortagesPage, shortagesPageSize, debouncedSearch, filters.warehouse, filters.status, filters.minShortage]);

  useEffect(() => {
    setShortagesPage(1);
  }, [debouncedSearch, filters.warehouse, filters.status, filters.minShortage]);

  useEffect(() => {
    fetchShortages();
  }, [fetchShortages]);

  const shortagesColumns = [
    { header: 'Component', key: 'ComponentCode' },
    {
      header: 'Component Name',
      key: 'ComponentName',
      render: (r) => <span title={r.ComponentName}>{(r.ComponentName || '').substring(0, 35)}</span>,
    },
    {
      header: 'Required Qty',
      key: 'RemainingRequired',
      render: (r) => <span className="tabular-nums">{fmt(r.RemainingRequired)}</span>,
    },
    {
      header: 'Available Stock',
      key: 'TotalAvailable',
      render: (r) => <span className="tabular-nums">{fmt(r.TotalAvailable)}</span>,
    },
    {
      header: 'Shortage',
      key: 'ShortageQty',
      render: (r) => (
        <span className="status-badge critical tabular-nums">{fmt(r.ShortageQty)}</span>
      ),
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
                    placeholder="Search by Component Code or Name..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="po-filter-search-input"
                  />
                </div>
              </div>

              {/* Stock Status Filter */}
              <div className="po-filter-item" style={{ minWidth: '180px' }}>
                <label className="po-filter-label">Stock Status</label>
                <Select
                  value={statusOptions.find((opt) => opt.value === filters.status) || null}
                  onChange={(opt) => handleFilterChange('status', opt ? opt.value : '')}
                  options={statusOptions}
                  placeholder="All Stock Levels"
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

              {/* Min Shortage Filter */}
              <div className="po-filter-item" style={{ minWidth: '130px' }}>
                <label className="po-filter-label">Min Shortage</label>
                <input
                  type="number"
                  placeholder="e.g. 100"
                  className="po-filter-date-input"
                  value={filters.minShortage}
                  onChange={(e) => handleFilterChange('minShortage', e.target.value)}
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
            data={shortagesData}
            columns={shortagesColumns}
            totalEntries={shortagesTotal}
            showActions={false}
            showPagination={true}
            isLoading={loading}
            currentPage={shortagesPage}
            pageSize={shortagesPageSize}
            onPageChange={setShortagesPage}
            onItemsPerPageChange={(size) => {
              setShortagesPageSize(size);
              setShortagesPage(1);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MaterialShortages;
