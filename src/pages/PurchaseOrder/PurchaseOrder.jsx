import React, { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import Table from '../../global-components/Table/Table';
import Button from '../../global-components/Button/Button';
import ChooseFromList from '../../global-components/ChooseFromList/ChooseFromList';
import { purchaseOrderApi } from '../../apis/purchase-order/purchaseOrderApi';
import { axiosInstance } from '../../apis/axiosinstance';
import { API_ENDPOINTS } from '../../apis/endpoints';
import toast from 'react-hot-toast';
import { useLoading } from '../../context/LoadingContext';
import { IconSearch, IconRefresh, IconPlus, IconTrash } from '@tabler/icons-react';
import PurchaseOrderModal from './PurchaseOrderModal';
import '../ProductionOrders/ProductionOrders.css';
import '../ProductionOrders/SalesOrderModal.css';
import './PurchaseOrder.css';

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

const PurchaseOrder = () => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });

  const [selectedPO, setSelectedPO] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    branch: '',
    fromDate: '',
    toDate: ''
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Lookups state for creation form & filter
  const [branches, setBranches] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [businessSegments, setBusinessSegments] = useState([]);

  // Creation form state
  const getInitialCreateHeader = () => ({
    Company: 'LDS',
    DocDate: new Date().toISOString().split('T')[0],
    Branch: '',
    RequiredDate: '',
    ValidUntil: '',
    Remarks: ''
  });

  const getInitialCreateRows = () => [
    { id: 1, ItemCode: '', ItemDescription: '', ReqQty: '', Warehouse: '', BusinessSegment: '', Reason: '' }
  ];

  const [createHeaderData, setCreateHeaderData] = useState(getInitialCreateHeader());
  const [createRows, setCreateRows] = useState(getInitialCreateRows());
  const [createLoading, setCreateLoading] = useState(false);

  const { showLoading, hideLoading } = useLoading();

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 400);
    return () => clearTimeout(handler);
  }, [filters.search]);

  // Fetch Lookups
  const fetchLookups = useCallback(async () => {
    try {
      const [branchRes, whsRes, segRes] = await Promise.all([
        axiosInstance.get(API_ENDPOINTS.INVENTORY.LOOKUP_BRANCHES),
        axiosInstance.get(API_ENDPOINTS.INVENTORY.LOOKUP_WAREHOUSES, { params: { company: 'LDS' } }),
        axiosInstance.get(API_ENDPOINTS.INVENTORY.LOOKUP_BUSINESS_SEGMENTS, { params: { company: 'LDS' } })
      ]);

      if (branchRes.data?.success) setBranches(branchRes.data.data || []);
      if (whsRes.data?.success) setWarehouses(whsRes.data.data || []);
      if (segRes.data?.success) setBusinessSegments(segRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch lookups:', err);
    }
  }, []);

  useEffect(() => {
    fetchLookups();
  }, [fetchLookups]);

  // Fetch Purchase Orders
  const fetchPurchaseOrders = useCallback(async (page = 1, limit = 10, currentFilters = filters, currentSearch = debouncedSearch) => {
    try {
      showLoading();
      const params = {
        page,
        limit,
        search: currentSearch || '',
        status: currentFilters.status || '',
        branch: currentFilters.branch || '',
        fromDate: currentFilters.fromDate || '',
        toDate: currentFilters.toDate || ''
      };
      const response = await purchaseOrderApi.getPurchaseRequests(params);
      if (response && response.success) {
        setData(response.data.data);
        setPagination(response.data.pagination);
      } else {
        toast.error(response?.message || 'Failed to fetch purchase orders');
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      toast.error(error.message || 'Error fetching purchase orders');
    } finally {
      hideLoading();
    }
  }, [debouncedSearch, filters, hideLoading, showLoading]);

  useEffect(() => {
    fetchPurchaseOrders(1, pagination.limit, filters, debouncedSearch);
  }, [debouncedSearch, filters.status, filters.branch, filters.fromDate, filters.toDate]);

  const handlePageChange = (newPage) => {
    fetchPurchaseOrders(newPage, pagination.limit, filters, debouncedSearch);
  };

  const handleRowsPerPageChange = (newLimit) => {
    fetchPurchaseOrders(1, newLimit, filters, debouncedSearch);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleResetFilters = () => {
    const emptyFilters = {
      search: '',
      status: '',
      branch: '',
      fromDate: '',
      toDate: ''
    };
    setFilters(emptyFilters);
    setDebouncedSearch('');
    fetchPurchaseOrders(1, pagination.limit, emptyFilters, '');
  };

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.status ||
    filters.branch ||
    filters.fromDate ||
    filters.toDate
  );

  const statusOptions = [
    { value: 'Open', label: 'Open' },
    { value: 'Closed', label: 'Closed' }
  ];

  const branchOptions = branches.map((b) => {
    const val = b.Remarks || b.BPLName || b.name || String(b);
    return {
      value: val,
      label: val
    };
  });

  const handleRowClick = async (row) => {
    try {
      showLoading();
      const response = await purchaseOrderApi.getPurchaseRequestDetails(row.DocEntry);
      if (response && response.success) {
        setSelectedPO(response.data);
        setIsModalOpen(true);
      } else {
        toast.error(response?.message || 'Failed to fetch details');
      }
    } catch (error) {
      console.error('Error fetching details:', error);
      toast.error(error.message || 'Failed to fetch details');
    } finally {
      hideLoading();
    }
  };

  // Creation form handlers
  const handleHeaderChange = (field, value) => {
    setCreateHeaderData(prev => ({ ...prev, [field]: value }));
  };

  const handleRowChange = (id, field, value) => {
    setCreateRows(prev => prev.map(row => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const addRow = () => {
    const newId = createRows.length > 0 ? Math.max(...createRows.map(r => r.id)) + 1 : 1;
    setCreateRows(prev => [...prev, { id: newId, ItemCode: '', ItemDescription: '', ReqQty: '', Warehouse: '', BusinessSegment: '', Reason: '' }]);
  };

  const removeRow = (id) => {
    if (createRows.length === 1) {
      toast.error('You must have at least one item row.');
      return;
    }
    setCreateRows(prev => prev.filter(row => row.id !== id));
  };

  const handleClearForm = () => {
    setCreateHeaderData(getInitialCreateHeader());
    setCreateRows(getInitialCreateRows());
  };

  const handleCreateSubmit = async () => {
    if (!createHeaderData.DocDate || !createHeaderData.RequiredDate) {
      toast.error('Document Date and Required Date are required.');
      return;
    }

    const validLines = createRows.filter(r => r.ItemCode && r.ReqQty);
    if (validLines.length === 0) {
      toast.error('At least one item with a quantity is required.');
      return;
    }

    const payload = {
      company: createHeaderData.Company,
      docDate: createHeaderData.DocDate,
      requiredDate: createHeaderData.RequiredDate,
      validUntil: createHeaderData.ValidUntil || createHeaderData.RequiredDate,
      branchId: createHeaderData.Branch,
      remarks: createHeaderData.Remarks,
      lines: validLines.map(row => ({
        itemCode: row.ItemCode,
        quantity: row.ReqQty,
        warehouseCode: row.Warehouse,
        businessSegment: row.BusinessSegment,
        reason: row.Reason
      }))
    };

    try {
      setCreateLoading(true);
      const res = await axiosInstance.post(API_ENDPOINTS.PURCHASE_ORDER.CREATE_REQUEST, payload);
      if (res.data?.success) {
        toast.success(res.data?.data?.Message || res.data?.message || 'Purchase Order created successfully!');
        setShowCreateForm(false);
        handleClearForm();
        fetchPurchaseOrders(1, pagination.limit, filters, debouncedSearch);
      } else {
        toast.error(res.data?.message || 'Failed to create purchase order.');
      }
    } catch (err) {
      console.error('Purchase Order Error:', err);
      toast.error(err.response?.data?.message || err.response?.data?.Message || 'Failed to create purchase order.');
    } finally {
      setCreateLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const columns = [
    { key: 'DocEntry', header: 'DocEntry', width: 90 },
    { key: 'DocNum', header: 'DocNum', width: 90 },
    { key: 'DocStatus', header: 'DocStatus', width: 100 },
    {
      key: 'DocDate',
      header: 'DocDate',
      width: 120,
      render: (row) => formatDate(row.DocDate)
    },
    {
      key: 'ReqDate',
      header: 'ReqDate',
      width: 120,
      render: (row) => formatDate(row.ReqDate)
    },
    { key: 'Requester', header: 'Requester', width: 130 },
    { key: 'ReqName', header: 'ReqName', width: 180 },
    { key: 'Branch', header: 'Branch (Remarks)', width: 160 },
    { key: 'Comments', header: 'Comments', width: 250 }
  ];

  return (
    <div className="purchase-order-page">
      {showCreateForm ? (
        /* Purchase Order Creation View (styled identically to PO Form) */
        <>
          <div className="po-header-form">
            <div className="po-header-text">
              Create New Purchase Order
            </div>

            <div className="po-header-grid">
              {/* Left Column */}
              <div className="po-header-col">
                <div className="po-field-row">
                  <div className="po-field-label">Company</div>
                  <div className="po-field-value po-field-value-create-basic">
                    <select
                      className="po-uom-input"
                      value={createHeaderData.Company}
                      disabled
                      style={{ backgroundColor: '#f8fafc', cursor: 'not-allowed' }}
                    >
                      <option value="LDS">LDS</option>
                    </select>
                  </div>
                </div>

                <div className="po-field-row">
                  <div className="po-field-label">Document Date <span className="po-required">*</span></div>
                  <div className="po-field-value po-field-value-create-basic">
                    <input
                      type="date"
                      className="po-uom-input"
                      value={createHeaderData.DocDate}
                      onChange={(e) => handleHeaderChange('DocDate', e.target.value)}
                    />
                  </div>
                </div>

                <div className="po-field-row">
                  <div className="po-field-label">Branch</div>
                  <div className="po-field-value po-field-value-create">
                    <Select
                      value={
                        branches.find(b => String(b.BPLid || b.BPLId || b.id || '') === String(createHeaderData.Branch))
                          ? {
                            value: createHeaderData.Branch,
                            label: branches.find(b => String(b.BPLid || b.BPLId || b.id || '') === String(createHeaderData.Branch))?.BPLName || createHeaderData.Branch
                          }
                          : null
                      }
                      onChange={(opt) => handleHeaderChange('Branch', opt ? opt.value : '')}
                      options={branches.map(b => ({
                        value: b.BPLid || b.BPLId || b.id || '',
                        label: b.BPLName || b.name || String(b)
                      }))}
                      placeholder="Select Branch..."
                      isClearable
                      isSearchable
                      menuPortalTarget={document.body}
                      className="po-select-container"
                      classNamePrefix="po-select"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="po-header-col">
                <div className="po-field-row">
                  <div className="po-field-label">Required Date <span className="po-required">*</span></div>
                  <div className="po-field-value po-field-value-create-basic">
                    <input
                      type="date"
                      className="po-uom-input"
                      value={createHeaderData.RequiredDate}
                      onChange={(e) => handleHeaderChange('RequiredDate', e.target.value)}
                    />
                  </div>
                </div>

                <div className="po-field-row">
                  <div className="po-field-label">Valid Until</div>
                  <div className="po-field-value po-field-value-create-basic">
                    <input
                      type="date"
                      className="po-uom-input"
                      value={createHeaderData.ValidUntil}
                      onChange={(e) => handleHeaderChange('ValidUntil', e.target.value)}
                    />
                  </div>
                </div>

                <div className="po-field-row">
                  <div className="po-field-label">Remarks</div>
                  <div className="po-field-value po-field-value-create-basic">
                    <input
                      type="text"
                      className="po-uom-input"
                      placeholder="Enter Remarks..."
                      value={createHeaderData.Remarks}
                      onChange={(e) => handleHeaderChange('Remarks', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="po-components-wrapper">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="po-grid-heading">
                Items involved in Purchase Order
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={addRow}
                icon={<IconPlus size={16} />}
              >
                Add Row
              </Button>
            </div>

            <div className="po-grid-container">
              <table className="po-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                    <th style={{ minWidth: '160px' }}>Item Code</th>
                    <th style={{ minWidth: '220px' }}>Item Description</th>
                    <th style={{ width: '100px' }}>Req Qty</th>
                    <th style={{ minWidth: '180px' }}>Warehouse</th>
                    <th style={{ minWidth: '160px' }}>Business Segment</th>
                    <th style={{ minWidth: '160px' }}>Reason</th>
                    <th style={{ width: '50px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {createRows.map((row, index) => (
                    <tr key={row.id}>
                      <td style={{ textAlign: 'center' }}>{index + 1}</td>
                      <td>
                        <ChooseFromList
                          value={row.ItemCode}
                          displayValue={row.ItemCode}
                          apiEndpoint={API_ENDPOINTS.INVENTORY.ITEMS}
                          queryParams={{ company: 'LDS' }}
                          valueKey="ItemCode"
                          labelKey="ItemName"
                          columns={[
                            { key: 'ItemCode', header: 'Item Code' },
                            { key: 'ItemName', header: 'Item Name' }
                          ]}
                          onChange={(code, name, itemData) => {
                            handleRowChange(row.id, 'ItemCode', code);
                            if (itemData) {
                              handleRowChange(row.id, 'ItemDescription', itemData.ItemName);
                              if (itemData.U_Division || itemData.uDivision || itemData.BusinessSegment) {
                                handleRowChange(row.id, 'BusinessSegment', itemData.U_Division || itemData.uDivision || itemData.BusinessSegment);
                              }
                            }
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="po-uom-input"
                          value={row.ItemDescription}
                          onChange={(e) => handleRowChange(row.id, 'ItemDescription', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="po-uom-input"
                          value={row.ReqQty}
                          onChange={(e) => handleRowChange(row.id, 'ReqQty', e.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          className="po-uom-input"
                          value={row.Warehouse}
                          onChange={(e) => handleRowChange(row.id, 'Warehouse', e.target.value)}
                        >
                          <option value="">Select...</option>
                          {warehouses.map((w, idx) => {
                            const val = w.WhsCode || w.code || w.WarehouseCode || w.id || '';
                            const rawLabel = w.WhsName || w.WhsCode || w.WarehouseName || w.name || w.WarehouseCode || String(w);
                            const label = val && rawLabel && val !== rawLabel ? `${val} - ${rawLabel}` : rawLabel;
                            return <option key={idx} value={val}>{label}</option>;
                          })}
                        </select>
                      </td>
                      <td>
                        <select
                          className="po-uom-input"
                          value={row.BusinessSegment}
                          onChange={(e) => handleRowChange(row.id, 'BusinessSegment', e.target.value)}
                        >
                          <option value="">Select Segment</option>
                          {businessSegments.map((s, idx) => {
                            const val = s.BusinessSegment || s.Code || s.code || s.id || '';
                            const label = s.BusinessSegment || s.Name || s.Code || s.name || String(s);
                            return <option key={idx} value={val}>{label}</option>;
                          })}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="po-uom-input"
                          value={row.Reason}
                          onChange={(e) => handleRowChange(row.id, 'Reason', e.target.value)}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                          title="Remove Row"
                          onClick={() => removeRow(row.id)}
                        >
                          <IconTrash size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="po-footer-actions">
            <Button
              variant="primary"
              disabled={createLoading}
              isLoading={createLoading}
              onClick={handleCreateSubmit}
            >
              Create
            </Button>
            <Button
              variant="secondary"
              onClick={handleClearForm}
              disabled={createLoading}
            >
              Clear Form
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCreateForm(false)}
              disabled={createLoading}
            >
              Cancel
            </Button>
          </div>
        </>
      ) : (
        /* Purchase Order Table View with Filter Toolbar */
        <div className="layout-page-padding">
          <div className="po-table-header">
            <Button
              variant="primary"
              onClick={() => setShowCreateForm(true)}
              icon={<IconPlus size={16} />}
            >
              Create New Order
            </Button>
          </div>

          <div className="po-filter-toolbar-card">
            <div className="po-filter-toolbar-grid">
              {/* Search */}
              <div className="po-filter-item po-filter-search-box">
                <label className="po-filter-label">Search</label>
                <div style={{ position: 'relative' }}>
                  <IconSearch size={18} className="po-filter-search-icon" />
                  <input
                    type="text"
                    placeholder="Search by DocNum, ReqName..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="po-filter-search-input"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="po-filter-item" style={{ minWidth: '160px' }}>
                <label className="po-filter-label">Status</label>
                <Select
                  value={statusOptions.find((opt) => opt.value === filters.status) || null}
                  onChange={(opt) => handleFilterChange('status', opt ? opt.value : '')}
                  options={statusOptions}
                  placeholder="All Statuses"
                  isClearable
                  isSearchable
                  menuPortalTarget={document.body}
                  styles={filterSelectStyles}
                />
              </div>

              {/* Branch Filter */}
              <div className="po-filter-item" style={{ minWidth: '180px' }}>
                <label className="po-filter-label">Branch</label>
                <Select
                  value={branchOptions.find((opt) => opt.value === filters.branch) || null}
                  onChange={(opt) => handleFilterChange('branch', opt ? opt.value : '')}
                  options={branchOptions}
                  placeholder="All Branches"
                  isClearable
                  isSearchable
                  menuPortalTarget={document.body}
                  styles={filterSelectStyles}
                />
              </div>

              {/* Date From */}
              <div className="po-filter-item">
                <label className="po-filter-label">Date From</label>
                <input
                  type="date"
                  className="po-filter-date-input"
                  value={filters.fromDate}
                  onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                />
              </div>

              {/* Date To */}
              <div className="po-filter-item">
                <label className="po-filter-label">Date To</label>
                <input
                  type="date"
                  className="po-filter-date-input"
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange('toDate', e.target.value)}
                />
              </div>

              {/* Reset Filters */}
              <div className="po-filter-item">
                <label className="po-filter-label">&nbsp;</label>
                <button
                  type="button"
                  className="po-filter-reset-btn"
                  onClick={handleResetFilters}
                  disabled={!hasActiveFilters}
                  title={hasActiveFilters ? "Reset all filters" : "No filters applied"}
                >
                  <IconRefresh size={16} />
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className="purchase-order-content">
            <Table
              data={data}
              columns={columns}
              totalEntries={pagination.total}
              currentPage={pagination.page}
              pageSize={pagination.limit}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleRowsPerPageChange}
              showActions={false}
              showPagination={true}
              isLoading={false}
              onRowClick={handleRowClick}
            />
          </div>
        </div>
      )}

      <PurchaseOrderModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPO(null);
        }}
        data={selectedPO}
      />
    </div>
  );
};

export default PurchaseOrder;
