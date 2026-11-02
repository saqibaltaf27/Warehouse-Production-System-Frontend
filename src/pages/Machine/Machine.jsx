import React, { useState, useEffect, useMemo } from 'react';
import { axiosInstance } from '../../apis/axiosinstance';
import { API_ENDPOINTS } from '../../apis/endpoints';
import Table from '../../global-components/Table/Table';
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

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(API_ENDPOINTS.MACHINE.GET_MACHINES_LIST);
      if (res.data?.success) {
        setMachines(res.data.data);
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

  const filteredData = useMemo(() => {
    return machines.filter(m => {
      const matchSearch = 
        (m.Code && m.Code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.Description && m.Description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchSearch;
    });
  }, [machines, searchQuery]);

  const fmtNum = (val) => {
    if (val == null || isNaN(val)) return '-';
    return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleExportExcel = () => {
    const rows = filteredData.map((row) => ({
      Code: row.Code ?? '',
      Description: row.Description ?? '',
      Type: row.Type ?? '',
      Location: row.Location ?? '',
      'Useful Life (M)': row['Useful Life (M)'] ?? '',
      'Remaining Life (M)': row['Remaining Life (M)'] ?? '',
      APC: row.APC ?? '',
      Dep: row.Dep ?? '',
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
    { header: 'Code', key: 'Code' },
    { header: 'Description', key: 'Description' },
    { header: 'Type', key: 'Type' },
    { header: 'Location', key: 'Location' },
    { header: 'Useful Life (M)', key: 'Useful Life (M)' },
    { header: 'Remaining Life (M)', key: 'Remaining Life (M)' },
    { header: 'APC', key: 'APC', render: (r) => fmtNum(r.APC) },
    { header: 'Dep', key: 'Dep', render: (r) => fmtNum(r.Dep) },
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
                placeholder="Search by Code or Description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="po-filter-search-input"
              />
            </div>
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
                onClick={() => setSearchQuery('')}
                disabled={!searchQuery}
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
          <Table 
            columns={columns}
            data={filteredData}
            showActions={false}
          />
        )}
      </div>
    </div>
  );
};

export default Machine;
