import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Select from 'react-select';
import { axiosInstance } from '../../apis/axiosinstance';
import { API_ENDPOINTS } from '../../apis/endpoints';
import Table from '../../global-components/Table/Table';
import {
  IconSearch,
  IconRefresh,
  IconCircleCheck,
  IconAlertTriangle,
  IconEye,
  IconX,
  IconFileSpreadsheet,
  IconCalculator
} from '@tabler/icons-react';
import '../ProductionOrders/ProductionOrders.css';
import './ProductionPlanning.css';
import './MaterialCapacityReport.css';

const fmt = (n) => {
  if (n == null || isNaN(n)) return '0';
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
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

const productTypeOptions = [
  { value: 'all', label: 'All Products (FG & SF)' },
  { value: 'Finished Goods', label: 'Finished Goods (FG)' },
  { value: 'Semi Finished', label: 'Semi Finished (SF)' },
];

const capacityStatusOptions = [
  { value: 'all', label: 'All Stock Levels' },
  { value: 'in_stock', label: 'Can Produce (> 0 Units)' },
  { value: 'zero_stock', label: 'Zero Capacity (0 Units)' },
  { value: 'high_capacity', label: 'High Capacity (≥ 1,000 Units)' },
];

const MaterialCapacityReport = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination & Filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({
    search: '',
    productType: 'all',
    capacityStatus: 'all',
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // BOM Breakdown Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [bomDetails, setBomDetails] = useState(null);
  const [bomLoading, setBomLoading] = useState(false);
  const [simulationQty, setSimulationQty] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Fetch Report Data
  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.PRODUCTION_ORDERS.MATERIAL_CAPACITY);
      if (res.data?.success) {
        setReportData(res.data.data || []);
      } else {
        setError(res.data?.message || 'Failed to load report data');
      }
    } catch (err) {
      console.error('Error loading material capacity report:', err);
      setError(err.response?.data?.message || err.message || 'An error occurred loading report data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedProduct) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProduct]);

  // Group records by ProductCode and aggregate component available stock across warehouses
  const groupedProducts = useMemo(() => {
    const productMap = new Map();

    (reportData || []).forEach((row) => {
      const pCode = row.ProductCode;
      if (!pCode) return;

      if (!productMap.has(pCode)) {
        const pType =
          row['Product Type'] ||
          row.ProductType ||
          (pCode.startsWith('FG') ? 'Finished Goods' : 'Semi Finished');

        productMap.set(pCode, {
          ProductCode: pCode,
          ProductName: row.ProductName,
          Category: row.Category,
          ProductType: pType,
          componentsMap: new Map(),
        });
      }

      const prod = productMap.get(pCode);
      const cCode = row.ComponentCode;
      if (!cCode) return;

      const stock = parseFloat(row.AvailableStock) || 0;
      const baseQty = parseFloat(row.ComponentQty) || 0;

      if (!prod.componentsMap.has(cCode)) {
        prod.componentsMap.set(cCode, {
          Type: 'Item',
          No: cCode,
          Description: row.ComponentName,
          BaseQty: baseQty,
          Available: stock,
          UoMName: row.ComponentUoM || '',
        });
      } else {
        // Aggregate available stock across multiple warehouses for this component
        const existing = prod.componentsMap.get(cCode);
        existing.Available += stock;
      }
    });

    // Compute total capacity, bottleneck, and producible units per product based on total stock
    return Array.from(productMap.values()).map((prod) => {
      const components = Array.from(prod.componentsMap.values());
      const totalComponents = components.length;

      let minCapacity = Infinity;
      let limitingComp = null;

      components.forEach((comp) => {
        const producible =
          comp.BaseQty > 0
            ? Math.floor(Math.max(0, comp.Available) / comp.BaseQty)
            : 0;

        comp.producible = producible;

        if (producible < minCapacity) {
          minCapacity = producible;
          limitingComp = comp;
        }
      });

      const capacityUnits = minCapacity === Infinity ? 0 : minCapacity;

      // Tag component limiting status
      components.forEach((comp) => {
        comp.ComponentStatus =
          comp.producible === capacityUnits ? 'Limiting' : 'Available';
      });

      return {
        ProductCode: prod.ProductCode,
        ProductName: prod.ProductName,
        Category: prod.Category,
        ProductType: prod.ProductType,
        TotalComponents: totalComponents,
        CapacityUnits: capacityUnits,
        LimitingComponentCode: limitingComp?.No || '',
        LimitingComponentName: limitingComp?.Description || '',
        LimitingBaseQty: limitingComp?.BaseQty || 0,
        LimitingAvailableStock: limitingComp?.Available || 0,
        LimitingUoM: limitingComp?.UoMName || '',
        components,
      };
    });
  }, [reportData]);

  // Open BOM modal directly with aggregated multi-warehouse component stock
  const handleOpenBOM = (product) => {
    if (selectedProduct?.ProductCode === product.ProductCode) {
      handleCloseModal();
      return;
    }
    setSelectedProduct(product);
    setSimulationQty('');
    setBomDetails({ lines: product.components || [] });
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    setBomDetails(null);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      productType: 'all',
      capacityStatus: 'all',
    });
    setDebouncedSearch('');
    setCurrentPage(1);
  };

  // Filtered Data
  const filteredData = useMemo(() => {
    return groupedProducts.filter((item) => {
      // Product Type filter
      if (filters.productType !== 'all') {
        const isFG =
          item.ProductCode?.startsWith('FG') ||
          (item.ProductType?.toLowerCase().includes('finish') &&
            !item.ProductType?.toLowerCase().includes('semi'));

        if (filters.productType === 'Finished Goods' && !isFG) return false;
        if (filters.productType === 'Semi Finished' && isFG) return false;
      }

      // Capacity Status filter
      if (filters.capacityStatus === 'in_stock' && item.CapacityUnits <= 0) {
        return false;
      }
      if (filters.capacityStatus === 'zero_stock' && item.CapacityUnits > 0) {
        return false;
      }
      if (filters.capacityStatus === 'high_capacity' && item.CapacityUnits < 1000) {
        return false;
      }

      // Search (Product Code, Product Name, Category, Limiting Component Code or Name)
      if (debouncedSearch.trim()) {
        const query = debouncedSearch.toLowerCase();
        const pCode = (item.ProductCode || '').toLowerCase();
        const pName = (item.ProductName || '').toLowerCase();
        const pCat = (item.Category || '').toLowerCase();
        const lCode = (item.LimitingComponentCode || '').toLowerCase();
        const lName = (item.LimitingComponentName || '').toLowerCase();

        return (
          pCode.includes(query) ||
          pName.includes(query) ||
          pCat.includes(query) ||
          lCode.includes(query) ||
          lName.includes(query)
        );
      }

      return true;
    });
  }, [groupedProducts, filters.productType, filters.capacityStatus, debouncedSearch]);

  // Paginated Slice
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.productType !== 'all' ||
    filters.capacityStatus !== 'all'
  );

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredData.length) return;
    const headers = [
      'Product Code',
      'Product Name',
      'Category',
      'Product Type',
      'Producible Capacity Units',
      'Total BOM Items',
      'Bottleneck Component Code',
      'Bottleneck Component Name',
      'Required Base Qty',
      'Total Available Stock',
      'UoM',
    ];

    const rows = filteredData.map((r) => [
      `"${r.ProductCode}"`,
      `"${(r.ProductName || '').replace(/"/g, '""')}"`,
      `"${(r.Category || '').replace(/"/g, '""')}"`,
      `"${r.ProductType}"`,
      r.CapacityUnits,
      r.TotalComponents,
      `"${r.LimitingComponentCode || ''}"`,
      `"${(r.LimitingComponentName || '').replace(/"/g, '""')}"`,
      r.LimitingBaseQty || 0,
      r.LimitingAvailableStock || 0,
      `"${r.LimitingUoM || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `material_production_capacity_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Table Columns
  const columns = [
    {
      header: 'Product Code',
      key: 'ProductCode',
      render: (r) => {
        const isFG =
          r.ProductCode?.startsWith('FG') ||
          (r.ProductType?.toLowerCase().includes('finish') &&
            !r.ProductType?.toLowerCase().includes('semi'));
        return (
          <span>
            {r.ProductCode}
          </span>
        );
      },
    },
    {
      header: 'Product Name',
      key: 'ProductName',
      render: (r) => (
        <span style={{ fontWeight: 500, color: '#1e293b' }} title={r.ProductName}>
          {r.ProductName}
        </span>
      ),
    },
    {
      header: 'Type',
      key: 'ProductType',
      render: (r) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#334155' }}>
            {r.ProductType}
          </span>
          {r.Category && (
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {r.Category}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Producible Capacity',
      key: 'CapacityUnits',
      render: (r) => (
        <span
          className={`mcr-capacity-badge ${r.CapacityUnits > 0 ? 'mcr-capacity-positive' : 'mcr-capacity-zero'}`}
        >
          {r.CapacityUnits > 0 ? (
            <>
              <IconCircleCheck size={15} />
              {fmt(r.CapacityUnits)} units
            </>
          ) : (
            <>
              <IconAlertTriangle size={15} />
              0 units
            </>
          )}
        </span>
      ),
    },
    {
      header: 'Bottleneck (Limiting Component)',
      key: 'LimitingComponentCode',
      render: (r) => (
        <div className="mcr-bottleneck-cell">
          <span className="mcr-bottleneck-code">{r.LimitingComponentCode || 'None'}</span>
          <span className="mcr-bottleneck-name" title={r.LimitingComponentName}>
            {r.LimitingComponentName || 'All components sufficient'}
          </span>
        </div>
      ),
    },
    {
      header: 'Stock vs Required',
      key: 'LimitingStock',
      render: (r) => (
        <div style={{ fontSize: '12px', color: '#475569' }}>
          <span className="tabular-nums" style={{ fontWeight: 600, color: r.LimitingAvailableStock > 0 ? '#059669' : '#e11d48' }}>
            {fmt(r.LimitingAvailableStock)}
          </span>
          {' / '}
          <span className="tabular-nums">{r.LimitingBaseQty}</span> {r.LimitingUoM || ''}
        </div>
      ),
    },
    {
      header: 'BOM Items',
      key: 'TotalComponents',
      render: (r) => (
        <span className="tabular-nums" style={{ fontSize: '12px', color: '#64748b' }}>
          {r.TotalComponents} items
        </span>
      ),
    },
    {
      header: 'Action',
      key: 'actions',
      render: (r) => {
        const isSelected = selectedProduct?.ProductCode === r.ProductCode;
        return (
          <button
            type="button"
            className={`mcr-view-btn ${isSelected ? 'active' : ''}`}
            onClick={() => handleOpenBOM(r)}
            title="View Bill of Materials and component capacity breakdown"
          >
            <IconEye size={14} />
            {isSelected ? 'Viewing BOM' : 'View BOM'}
          </button>
        );
      },
    },
  ];

  const simQtyNum = parseFloat(simulationQty);
  const isSimulating = Boolean(simulationQty && !isNaN(simQtyNum) && simQtyNum > 0);

  return (
    <div className="material-capacity-page">
      <div className="production-planning-page layout-page-padding material-capacity-container">
        {/* Filter Toolbar Card */}
        <div className="po-filter-toolbar-card">
          <div className="po-filter-toolbar-grid">
            {/* Search */}
            <div className="po-filter-item po-filter-search-box">
              <label className="po-filter-label">Search Product or Bottleneck</label>
              <div style={{ position: 'relative' }}>
                <IconSearch size={18} className="po-filter-search-icon" />
                <input
                  type="text"
                  placeholder="Search FG/SF code, name, component..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="po-filter-search-input"
                />
              </div>
            </div>

            {/* Product Type Filter */}
            <div className="po-filter-item" style={{ minWidth: '180px' }}>
              <label className="po-filter-label">Product Type</label>
              <Select
                value={productTypeOptions.find((opt) => opt.value === filters.productType) || null}
                onChange={(opt) => handleFilterChange('productType', opt ? opt.value : 'all')}
                options={productTypeOptions}
                isClearable={false}
                isSearchable={false}
                menuPortalTarget={document.body}
                styles={filterSelectStyles}
              />
            </div>

            {/* Capacity Status Filter */}
            <div className="po-filter-item" style={{ minWidth: '190px' }}>
              <label className="po-filter-label">Production Capacity</label>
              <Select
                value={capacityStatusOptions.find((opt) => opt.value === filters.capacityStatus) || null}
                onChange={(opt) => handleFilterChange('capacityStatus', opt ? opt.value : 'all')}
                options={capacityStatusOptions}
                isClearable={false}
                isSearchable={false}
                menuPortalTarget={document.body}
                styles={filterSelectStyles}
              />
            </div>

            {/* Action Buttons */}
            <div className="po-filter-item" style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
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

              <button
                type="button"
                className="po-filter-reset-btn"
                onClick={fetchReport}
                title="Refresh report data"
                style={{ background: '#f8fafc' }}
              >
                <IconRefresh size={16} className={loading ? 'spin' : ''} />
                Refresh
              </button>

              <button
                type="button"
                className="po-filter-reset-btn"
                onClick={handleExportCSV}
                disabled={!filteredData.length}
                title="Export report to CSV"
                style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}
              >
                <IconFileSpreadsheet size={16} />
                Export
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#b91c1c', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {/* Main Table */}
        <div className="planning-section">
          <Table
            data={paginatedData}
            columns={columns}
            totalEntries={filteredData.length}
            showActions={false}
            showPagination={true}
            isLoading={loading}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Right-Side Absolute Full-Height BOM Modal / Drawer */}
      {selectedProduct && (
        <div className="mcr-modal-container">
          <div className="mcr-modal-header">
            <div className="mcr-modal-title-group">
              <h3 className="mcr-modal-title">
                {selectedProduct.ProductCode} - {selectedProduct.ProductName}
              </h3>
            </div>
          </div>

          <div className="mcr-modal-body">
            {/* Summary Strip */}
            <div className="mcr-modal-info-strip">
              <div className="mcr-info-block">
                <span className="mcr-info-block-label">Max Producible Capacity</span>
                <span className="mcr-info-block-value" style={{ color: selectedProduct.CapacityUnits > 0 ? '#059669' : '#e11d48' }}>
                  {fmt(selectedProduct.CapacityUnits)} Units
                </span>
              </div>

              <div className="mcr-info-block">
                <span className="mcr-info-block-label">Bottleneck Component</span>
                <span className="mcr-info-block-value" style={{ fontSize: '13px', color: '#1e293b' }}>
                  {selectedProduct.LimitingComponentCode ? `${selectedProduct.LimitingComponentCode} - ${selectedProduct.LimitingComponentName}` : 'None (Fully Available)'}
                </span>
              </div>
            </div>

            {/* Simulation input */}
            <div className="mcr-simulation-box">
              <label>Simulate Batch Size:</label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 500"
                value={simulationQty}
                onChange={(e) => setSimulationQty(e.target.value)}
              />
              {simulationQty && (
                <span style={{ fontSize: '12px', fontWeight: 600, color: Number(simulationQty) <= selectedProduct.CapacityUnits ? '#059669' : '#e11d48' }}>
                  {Number(simulationQty) <= selectedProduct.CapacityUnits ? '✓ Stock Sufficient' : '⚠ Exceeds Capacity'}
                </span>
              )}
            </div>

            {/* BOM Table */}
            {bomLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <IconRefresh size={24} className="spin" style={{ marginBottom: '8px' }} />
                <div>Fetching BOM components & stock...</div>
              </div>
            ) : bomDetails && bomDetails.lines ? (
              <div className="mcr-bom-table-wrapper">
                <table className="mcr-bom-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Component No</th>
                      <th>Description</th>
                      <th>Base Qty</th>
                      <th>Total Available Stock</th>
                      <th>UoM</th>
                      {isSimulating ? (
                        <>
                          <th>Simulated Req</th>
                          <th>Net Shortage/Surplus</th>
                        </>
                      ) : (
                        <>
                          <th>Producible Units</th>
                          <th>Status</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {bomDetails.lines.map((line, idx) => {
                      const isItem = line.Type === 'Item' || line.Type === 4;
                      const baseQty = parseFloat(line.BaseQty) || 0;
                      const available = parseFloat(line.Available) || 0;
                      const producible = isItem && baseQty > 0 ? Math.floor(Math.max(0, available) / baseQty) : null;
                      const isLimiting = isItem && line.No === selectedProduct.LimitingComponentCode;

                      const simRequired = isSimulating && isItem ? (simQtyNum * baseQty) : null;
                      const simDifference = simRequired != null ? available - simRequired : null;

                      let rowClass = '';
                      if (isSimulating && isItem && simDifference != null) {
                        rowClass = simDifference < 0 ? 'mcr-row-negative' : 'mcr-row-positive';
                      } else if (isLimiting) {
                        rowClass = 'mcr-row-bottleneck';
                      }

                      return (
                        <tr key={idx} className={rowClass}>
                          <td>
                            <span style={{ fontSize: '11px', padding: '2px 6px', background: isItem ? '#f1f5f9' : '#e0f2fe', borderRadius: '3px', fontWeight: 600 }}>
                              {line.Type}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {line.No}
                          </td>
                          <td>{line.Description}</td>
                          <td className="tabular-nums">{fmt(baseQty)}</td>
                          <td className="tabular-nums" style={{ fontWeight: 600, color: available > 0 ? '#059669' : '#e11d48' }}>
                            {isItem ? fmt(available) : '-'}
                          </td>
                          <td>{line.UoMName || '-'}</td>
                          {isSimulating ? (
                            <>
                              <td className="tabular-nums">
                                {simRequired != null ? fmt(simRequired) : '-'}
                              </td>
                              <td className="tabular-nums" style={{ fontWeight: 600, color: (simDifference ?? 0) >= 0 ? '#059669' : '#e11d48' }}>
                                {simDifference != null ? fmt(simDifference) : '-'}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="tabular-nums" style={{ fontWeight: 700 }}>
                                {producible != null ? `${fmt(producible)} units` : '-'}
                              </td>
                              <td>
                                {isItem ? (
                                  producible === 0 ? (
                                    <span style={{ color: '#e11d48', fontWeight: 600, fontSize: '11px' }}>Out of Stock</span>
                                  ) : isLimiting ? (
                                    <span style={{ color: '#b45309', fontWeight: 600, fontSize: '11px' }}>Capacity Limiter</span>
                                  ) : (
                                    <span style={{ color: '#059669', fontWeight: 600, fontSize: '11px' }}>Sufficient</span>
                                  )
                                ) : (
                                  <span style={{ color: '#64748b', fontSize: '11px' }}>Non-inventory</span>
                                )}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                No BOM lines found for product {selectedProduct.ProductCode}.
              </div>
            )}
          </div>

          <div className="mcr-modal-footer">
            <button type="button" className="mcr-btn-secondary" onClick={handleCloseModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialCapacityReport;
