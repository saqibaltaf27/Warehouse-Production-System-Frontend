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

const fmtDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const BatchExpiry = () => {
  const [batchExpiryData, setBatchExpiryData] = useState([]);
  const [batchPage, setBatchPage] = useState(1);
  const [batchPageSize, setBatchPageSize] = useState(20);
  const [batchTotal, setBatchTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [bucket, setBucket] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const fetchBatchExpiry = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: batchPage, pageSize: batchPageSize, search: debouncedSearch, warehouse, bucket };
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
  }, [batchPage, batchPageSize, debouncedSearch, warehouse, bucket]);

  useEffect(() => {
    setBatchPage(1);
  }, [debouncedSearch, warehouse, bucket]);

  useEffect(() => {
    fetchBatchExpiry();
  }, [fetchBatchExpiry]);

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
        if (bucketVal.includes('Expired')) cls = 'expired';
        if (bucketVal.includes('0-30')) cls = 'critical';
        if (bucketVal.includes('31-90')) cls = 'warning';
        return <span className={`status-badge ${cls}`}>{bucketVal.substring(3)}</span>;
      }
    },
  ];

  return (
    <div className="production-planning-page fade-in-up layout-page-padding">
      <div className="planning-content fade-in-up delay-100">
        <div className="planning-section">
          <div className="planning-section-header" style={{ justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Batch Expiry & FEFO Priorities</h3>
              <p className="section-desc" style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>
                Available batches sorted by nearest expiry to ensure First-Expired-First-Out consumption.
              </p>
            </div>
            <div className="purchase-order-search-wrapper" style={{ minWidth: '240px' }}>
              <IconSearch size={18} className="purchase-order-search-icon" />
              <input
                type="text"
                placeholder="Search batch or item..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="purchase-order-search-input"
              />
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
            onItemsPerPageChange={(size) => { setBatchPageSize(size); setBatchPage(1); }}
          />
        </div>
      </div>
    </div>
  );
};

export default BatchExpiry;
