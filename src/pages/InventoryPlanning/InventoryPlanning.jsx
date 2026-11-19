import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { IconFileSpreadsheet, IconRefresh, IconSearch } from '@tabler/icons-react';
import * as XLSX from 'xlsx';
import Table from '../../global-components/Table/Table';
import Pagination from '../../global-components/Pagination/Pagination';
import { inventoryPlanningApi } from '../../apis/Inventory/inventory-planning';
import '../ProductionOrders/ProductionOrders.css';
import '../PurchaseOrder/PurchaseOrder.css';
import './InventoryPlanning.css';

const formatNum = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

const columns = [
  { key: 'ItemCode', header: 'Item Code', width: '140px' },
  { key: 'ItemName', header: 'Item Name' },
  { key: 'Available Stock', header: 'Available Stock', width: '140px', render: (r) => formatNum(r['Available Stock']) },
  { key: 'Committed', header: 'Committed', width: '120px', render: (r) => formatNum(r.Committed) },
  { key: 'Trend 3M', header: 'Trend 3M', width: '120px', render: (r) => formatNum(r['Trend 3M']) },
  { key: 'Trend 6M', header: 'Trend 6M', width: '120px', render: (r) => formatNum(r['Trend 6M']) },
  { key: 'On Order', header: 'On Order', width: '120px', render: (r) => formatNum(r['On Order']) },
];

const InventoryPlanning = () => {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadItems = useCallback(async (page, size, search) => {
    setLoading(true);
    try {
      const res = await inventoryPlanningApi.getRawMaterials({ page, pageSize: size, search });
      if (res?.success) {
        setRows(res.data || []);
        setTotalItems(res.total || 0);
        setTotalPages(res.totalPages || 1);
      } else {
        setRows([]);
        setTotalItems(0);
        toast.error(res?.message || 'Failed to load raw materials');
      }
    } catch (err) {
      setRows([]);
      setTotalItems(0);
      toast.error(err.response?.data?.message || 'Failed to load raw materials');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      loadItems(currentPage, pageSize, searchQuery.trim());
    }, 300);
    return () => clearTimeout(handle);
  }, [currentPage, pageSize, searchQuery, loadItems]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const imported = await inventoryPlanningApi.getRawMaterials({ all: true, search: searchQuery.trim() });
      const workbook = XLSX.utils.book_new();
      const data = imported?.data || [];
      const sheet = XLSX.utils.json_to_sheet(data.length ? data : [{ Message: 'No rows' }]);
      XLSX.utils.book_append_sheet(workbook, sheet, 'Raw Material');
      XLSX.writeFile(workbook, `Inventory_Planning_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to export planning');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="inv-plan-page layout-page-padding">
      <div className="po-filter-toolbar-card">
        <div className="po-filter-toolbar-grid">
          <div className="po-filter-item po-filter-search-box">
            <label className="po-filter-label">Search</label>
            <div style={{ position: 'relative' }}>
              <IconSearch size={18} className="po-filter-search-icon" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="po-filter-search-input"
              />
            </div>
          </div>

          <div className="po-filter-item">
            <label className="po-filter-label">&nbsp;</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-success po-export-btn"
                onClick={handleExport}
                disabled={exporting || loading}
              >
                <IconFileSpreadsheet size={16} />
                {exporting ? 'Exporting...' : 'Export Excel'}
              </button>
              <button
                type="button"
                className="po-filter-reset-btn"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                disabled={!searchQuery}
              >
                <IconRefresh size={16} />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="inv-plan-table-wrap">
        <Table
          data={rows}
          columns={columns}
          isLoading={loading}
          showActions={false}
          showPagination={false}
        />
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
      />
    </div>
  );
};

export default InventoryPlanning;
