import { useCallback, useEffect, useMemo, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { IconRefresh, IconSearch } from '@tabler/icons-react';
import { axiosInstance } from '../../apis/axiosinstance';
import { API_ENDPOINTS } from '../../apis/endpoints';
import { useAuth } from '../../context/AuthContext';
import Button from '../../global-components/Button/Button';
import GlobalPopup from '../../global-components/GlobalPopup/GlobalPopup';
import Table from '../../global-components/Table/Table';
import '../ProductionOrders/ProductionOrders.css';

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const DECISIONS = ['Hold', 'Grant Permission', 'Reject'];

const LineClearance = ({ toolbarExtra = null }) => {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pending, setPending] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.PRODUCTION_PLANNING.LINE_CLEARANCE, {
        skipGlobalLoading: true,
      });
      if (res.data?.success) setRows(res.data.data || []);
      else toast.error(res.data?.message || 'Failed to load line clearance');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load line clearance');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const confirmDecision = async () => {
    if (!pending) return;
    try {
      setSaving(true);
      const res = await axiosInstance.patch(
        `${API_ENDPOINTS.PRODUCTION_PLANNING.LINE_CLEARANCE}/${pending.requestId}`,
        {
          status: pending.status,
          approvedBy: user?.empId || user?.EmpID || user?.id || null,
        },
        { skipGlobalLoading: true },
      );
      if (!res.data?.success) {
        toast.error(res.data?.message || 'Failed to update status');
        return;
      }
      toast.success(res.data.message || 'Status updated');
      setPending(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter && row.Status !== statusFilter) return false;
      if (typeFilter && row.RequestType !== typeFilter) return false;
      if (areaFilter && row.Area !== areaFilter) return false;
      if (!query) return true;
      return [row.PlanId, row.PO, row.ProductName, row.Area, row.RequestType, row.Status]
        .filter((value) => value !== undefined && value !== null)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [rows, searchQuery, statusFilter, typeFilter, areaFilter]);

  const start = (page - 1) * pageSize;
  const paged = filteredRows.slice(start, start + pageSize);
  const hasFilters = Boolean(searchQuery || statusFilter || typeFilter || areaFilter);

  const columns = [
    { key: 'PlanId', header: 'Plan ID', width: '90px' },
    {
      key: 'PO',
      header: 'PO',
      render: (row) => [row.PO, row.ProductName].filter(Boolean).join(' — ') || '—',
    },
    { key: 'RequestType', header: 'Type' },
    { key: 'Area', header: 'Area' },
    {
      key: 'Status',
      header: 'Status',
      width: '130px',
      render: (row) => {
        const status = row.Status || 'Requested';
        return <span className={`plan-status plan-status--${status.toLowerCase().replace(/\s+/g, '-')}`}>{status}</span>;
      },
    },
    { key: 'CreatedAt', header: 'Requested', width: '140px', render: (row) => formatDate(row.CreatedAt) },
    {
      key: 'actions',
      header: 'Action',
      width: '280px',
      render: (row) => {
        const current = String(row.Status || '');
        if (current === 'Grant Permission' || current === 'Reject') return '—';
        const options = current === 'Hold' ? DECISIONS.filter((status) => status !== 'Hold') : DECISIONS;
        return (
        <div className="plan-action-group">
          {options.map((status) => (
            <button
              key={status}
              type="button"
              className="plan-action-btn"
              disabled={row.Status === status || saving}
              onClick={(event) => {
                event.stopPropagation();
                setPending({ requestId: row.RequestId, status, po: row.PO });
              }}
            >
              {status}
            </button>
          ))}
        </div>
        );
      },
    },
  ];

  return (
    <div className="line-clearance-page">
      <Toaster position="top-right" />
      <div className="po-filter-toolbar-card">
        <div className="po-filter-toolbar-grid">
          <div className="po-filter-item po-filter-search-box">
            <label className="po-filter-label">Search</label>
            <div style={{ position: 'relative' }}>
              <IconSearch size={18} className="po-filter-search-icon" />
              <input
                type="text"
                className="po-filter-search-input"
                placeholder="Plan, PO, description..."
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
          <div className="po-filter-item">
            <label className="po-filter-label">Status</label>
            <select className="po-filter-select" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
              <option value="">All statuses</option>
              <option>Requested</option>
              <option>Hold</option>
              <option>Grant Permission</option>
              <option>Reject</option>
            </select>
          </div>
          <div className="po-filter-item">
            <label className="po-filter-label">Type</label>
            <select className="po-filter-select" value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); setPage(1); }}>
              <option value="">All types</option>
              <option>Raw Material</option>
              <option>Primary Packaging</option>
              <option>Production</option>
              <option>Final Packaging</option>
            </select>
          </div>
          <div className="po-filter-item">
            <label className="po-filter-label">Area</label>
            <select className="po-filter-select" value={areaFilter} onChange={(event) => { setAreaFilter(event.target.value); setPage(1); }}>
              <option value="">All areas</option>
              <option>Clean Room 1</option>
              <option>Clean Room 2</option>
              <option>Raw Material WH</option>
              <option>Other</option>
            </select>
          </div>
          <div className="po-filter-item">
            <label className="po-filter-label">&nbsp;</label>
            <button
              type="button"
              className="po-filter-reset-btn"
              disabled={!hasFilters}
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('');
                setTypeFilter('');
                setAreaFilter('');
                setPage(1);
              }}
            >
              <IconRefresh size={16} />
              Reset
            </button>
          </div>
          {toolbarExtra}
        </div>
      </div>
      <Table
        data={paged}
        columns={columns}
        totalEntries={filteredRows.length}
        currentPage={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onItemsPerPageChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        isLoading={loading}
        showActions={false}
      />
      {pending && (
        <GlobalPopup
          title="Line clearance"
          onClose={() => { if (!saving) setPending(null); }}
          showClose={false}
          className="po-create-confirm-popup"
        >
          <div className="po-create-confirm">
            <h3 className="po-create-confirm-title">Set status to {pending.status}?</h3>
            <p className="po-create-confirm-text">
              This records you as the approver and the approval time.
            </p>
            <div className="po-create-confirm-actions">
              <Button variant="outline" disabled={saving} onClick={() => setPending(null)}>Cancel</Button>
              <Button variant="primary" isLoading={saving} disabled={saving} onClick={confirmDecision}>
                Confirm
              </Button>
            </div>
          </div>
        </GlobalPopup>
      )}
    </div>
  );
};

export default LineClearance;
