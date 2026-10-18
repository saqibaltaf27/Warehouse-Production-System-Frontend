import React, { useState, useEffect, useCallback } from 'react';
import { axiosInstance } from '../../apis/axiosinstance';
import { API_ENDPOINTS } from '../../apis/endpoints';
import Table from '../../global-components/Table/Table';
import { IconSearch } from '@tabler/icons-react';
import './ProductionPlanning.css';

const fmt = (n) => {
  if (n == null || isNaN(n)) return '0';
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
};

const MaterialShortages = () => {
  const [shortagesData, setShortagesData] = useState([]);
  const [shortagesPage, setShortagesPage] = useState(1);
  const [shortagesPageSize, setShortagesPageSize] = useState(20);
  const [shortagesTotal, setShortagesTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const fetchShortages = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: shortagesPage, pageSize: shortagesPageSize, search: debouncedSearch };
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
  }, [shortagesPage, shortagesPageSize, debouncedSearch]);

  useEffect(() => {
    setShortagesPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchShortages();
  }, [fetchShortages]);

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

  return (
    <div className="production-planning-page fade-in-up layout-page-padding">
      <div className="planning-content fade-in-up delay-100">
        <div className="planning-section">
          <div className="planning-section-header" style={{ justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Critical Material Shortages</h3>
              <p className="section-desc" style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>
                Components missing to fulfill currently released production orders.
              </p>
            </div>
            <div className="purchase-order-search-wrapper" style={{ minWidth: '240px' }}>
              <IconSearch size={18} className="purchase-order-search-icon" />
              <input
                type="text"
                placeholder="Search component..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="purchase-order-search-input"
              />
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
            onItemsPerPageChange={(size) => { setShortagesPageSize(size); setShortagesPage(1); }}
          />
        </div>
      </div>
    </div>
  );
};

export default MaterialShortages;
