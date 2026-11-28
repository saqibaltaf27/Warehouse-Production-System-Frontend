import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../../apis/axiosinstance';
import { API_ENDPOINTS } from '../../apis/endpoints';
import Table from '../../global-components/Table/Table';
import Pagination from '../../global-components/Pagination/Pagination';
import Button from '../../global-components/Button/Button';
import { IconSearch, IconFileSpreadsheet, IconRefresh } from '@tabler/icons-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import '../ProductionOrders/ProductionOrders.css';
import './Machine.css';

const Machine = () => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMachines = async (pageNo = page, size = pageSize, statusValue = status, search = searchQuery) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get(API_ENDPOINTS.MACHINE.GET_MACHINES_LIST, {
        params: { page: pageNo, pageSize: size, status: statusValue || undefined, search: search || undefined },
        skipGlobalLoading: true,
      });
      if (res.data?.success) {
        setMachines(res.data.data || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      } else {
        setError('Failed to fetch machines.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while fetching data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchMachines(page, pageSize, status, searchQuery);
    }, 300);
    return () => clearTimeout(handle);
  }, [page, pageSize, status, searchQuery]);

  const fmtNum = (val) => {
    if (val == null || isNaN(val)) return '-';
    return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleExportExcel = async () => {
    const res = await axiosInstance.get(API_ENDPOINTS.MACHINE.GET_MACHINES_LIST, {
      params: { page: 1, pageSize: 20, all: '1', status: status || undefined, search: searchQuery || undefined },
      skipGlobalLoading: true,
    });
    const exportRows = res.data?.data || [];
    const rows = exportRows.map((row) => ({
      Capitalized: row.Capitalized ? formatDate(row.Capitalized) : '',
      'Fiscal Year': row.FiscalYear ?? '',
      Class: row.Class ?? '',
      'Asset Group': row.AssetGroup ?? '',
      'Item Code': row.ItemCode ?? '',
      Description: row.Description ?? '',
      'Serial No': row.SerialNo ?? '',
      Location: row.Location ?? '',
      Category: row.Category ?? '',
      Division: row.Division ?? '',
      Type: row.Type ?? '',
      'Product Line': row.ProductLine ?? '',
      Staff: row.Staff ?? '',
      APV: row.APV ?? '',
      DPR: row.DPR ?? '',
      FBV: row.FBV ?? '',
    }));
    if (!rows.length) {
      toast.error('No records to export');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Machines');
    XLSX.writeFile(workbook, `Machines_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success(`Exported ${rows.length} record(s)`);
  };

  const columns = [
    { header: 'Capitalized', key: 'Capitalized', render: (r) => formatDate(r.Capitalized) },
    { header: 'Fiscal Year', key: 'FiscalYear' },
    { header: 'Class', key: 'Class' },
    { header: 'Asset Group', key: 'AssetGroup' },
    { header: 'Item Code', key: 'ItemCode' },
    { header: 'Description', key: 'Description', width: '220px', render: (r) => <span className="machine-desc">{r.Description}</span> },
    { header: 'Serial No', key: 'SerialNo' },
    { header: 'Location', key: 'Location' },
    { header: 'Category', key: 'Category' },
    { header: 'Division', key: 'Division' },
    { header: 'Type', key: 'Type' },
    { header: 'Product Line', key: 'ProductLine' },
    { header: 'Staff', key: 'Staff' },
    { header: 'APV', key: 'APV', render: (r) => fmtNum(r.APV) },
    { header: 'DPR', key: 'DPR', render: (r) => fmtNum(r.DPR) },
    { header: 'FBV', key: 'FBV', render: (r) => fmtNum(r.FBV) }
  ];

  return (
    <div className="machine-page-wrapper layout-page-padding">
      <div className="po-filter-toolbar-card">
        <div className="po-filter-toolbar-grid">
          <div className="po-filter-item po-filter-search-box">
            <label className="po-filter-label">Search</label>
            <div style={{ position: 'relative' }}>
              <IconSearch size={18} className="po-filter-search-icon" />
              <input
                type="text"
                placeholder="Search by item, description, serial, or location..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="po-filter-search-input"
              />
            </div>
          </div>
          <div className="po-filter-item">
            <label className="po-filter-label">Status</label>
            <select
              className="po-filter-search-input"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="po-filter-item">
            <label className="po-filter-label">&nbsp;</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button
                type="button"
                variant="success"
                className="po-export-btn"
                onClick={handleExportExcel}
                disabled={loading}
                title="Export Excel"
                icon={<IconFileSpreadsheet size={16} />}
              >
                Export Excel
              </Button>
              <button
                type="button"
                className="po-filter-reset-btn"
                onClick={() => {
                  setSearchQuery('');
                  setStatus('');
                  setPage(1);
                }}
                disabled={!searchQuery && !status}
                title={searchQuery ? 'Reset search' : 'No filters applied'}
              >
                <IconRefresh size={16} />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="machine-table-card">
        {loading ? (
          <div className="machine-loading">Loading machines...</div>
        ) : error ? (
          <div className="machine-error">{error}</div>
        ) : (
          <>
            <Table
              columns={columns}
              data={machines}
              showActions={false}
              showPagination={false}
            />
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Machine;
