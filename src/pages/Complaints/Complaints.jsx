import React, { useState, useEffect, useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Table from '../../global-components/Table/Table';
import Button from '../../global-components/Button/Button';
import GlobalPopup from '../../global-components/GlobalPopup/GlobalPopup';
import Input from '../../global-components/Input/Input';
import { useAuth } from '../../context/AuthContext';
import AsyncSelect from 'react-select/async';
import toast, { Toaster } from 'react-hot-toast';
import { API_ENDPOINTS } from '../../apis/endpoints';
import { IconEdit, IconSearch, IconRefresh } from '@tabler/icons-react';
import './Complaints.css';
import '../ProductionOrders/ProductionOrders.css';

const ExpandableText = ({ text = '', maxLength = 30 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!text || text.length <= maxLength) {
    return <span>{text}</span>;
  }
  
  return (
    <span>
      {isExpanded ? text : `${text.substring(0, maxLength)}...`}
      <span 
        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
        className="expandable-text-toggle"
      >
        {isExpanded ? 'See Less' : 'See More'}
      </span>
    </span>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date)) return dateString;
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const wrapLabel = (value, size = 18) => {
  const words = String(value || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > size && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  return lines.slice(0, 4);
};

const AxisTick = ({ x, y, payload }) => {
  const lines = wrapLabel(payload?.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="middle" fill="#334155" fontSize={11}>
        {lines.map((line, index) => (
          <tspan key={index} x={0} dy={index === 0 ? 14 : 13}>{line}</tspan>
        ))}
      </text>
    </g>
  );
};

const TrendTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="complaints-trend-tip">
      <div>{row.name}</div>
      <strong>{row.total} complaints</strong>
    </div>
  );
};

const Complaints = () => {
  const { user } = useAuth();
  const initiatedByValue = user ? `${user.FirstName}` : '';
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productCategoryValue, setProductCategoryValue] = useState('');

  // Setup form data state to handle changes dynamically
  const [formData, setFormData] = useState({});
  const [complaintsData, setComplaintsData] = useState([]);
  const [totalComplaints, setTotalComplaints] = useState(0);
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [trendRows, setTrendRows] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    productCategory: '',
    fromDate: '',
    toDate: '',
  });
  const [departments, setDepartments] = useState([]);
  const [productCategories, setProductCategories] = useState([]);

  const fetchComplaints = async () => {
    try {
      setTableLoading(true);
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageSize),
      });
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (filters.department) params.set('department', filters.department);
      if (filters.productCategory) params.set('productCategory', filters.productCategory);
      if (filters.fromDate) params.set('fromDate', filters.fromDate);
      if (filters.toDate) params.set('toDate', filters.toDate);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${API_ENDPOINTS.COMPLAINTS.GET_COMPLAINTS}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setComplaintsData(data.data.data);
        setTotalComplaints(data.data.total);
        if (Array.isArray(data.data.departments)) setDepartments(data.data.departments);
        if (Array.isArray(data.data.productCategories)) setProductCategories(data.data.productCategories);
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast.error('Failed to fetch complaints');
    } finally {
      setTableLoading(false);
    }
  };

  const fetchTrend = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${API_ENDPOINTS.COMPLAINTS.TREND}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setTrendRows(data.data || []);
    } catch (error) {
      console.error('Error fetching complaint trend:', error);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [currentPage, pageSize, searchQuery, filters]);

  useEffect(() => {
    fetchTrend();
  }, []);

  const trendChart = useMemo(() => (
    trendRows.map((row) => ({
      key: row.product,
      name: [row.itemDescription || row.product, row.itemName].filter(Boolean).join(' — '),
      total: Number(row.total || 0),
    }))
  ), [trendRows]);

  const handleOpenModal = () => {
    setEditingComplaint(null);
    setSelectedProduct(null);
    setProductCategoryValue('');
    setFormData({});
    setIsModalOpen(true);
  };

  const handleEditClick = (row) => {
    setEditingComplaint(row);
    // Format date specifically for input type date which expects YYYY-MM-DD
    const formatDateForInput = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d)) return dateStr;
      return d.toISOString().split('T')[0];
    };

    setFormData({
      reportDate: formatDateForInput(row.reportDate),
      department: row.department,
      complaintBy: row.complaintBy,
      address: row.address,
      contacts: row.contacts,
      deviationCategory: row.deviationCategory,
      briefDescription: row.briefDescription,
      batchNumber: row.batchNumber,
      rootCauseClass: row.rootCauseClass,
      identifiedRootCause: row.identifiedRootCause,
      concernedDepartment: row.concernedDepartment,
      stage1: row.stage1,
      stage2: row.stage2,
      stage3: row.stage3,
      stage4: row.stage4,
      additionalRemarks: row.additionalRemarks,
      capaSummary: row.capaSummary,
      closingDate: formatDateForInput(row.closingDate),
      cumulativeFrequency: row.cumulativeFrequency
    });

    if (row.product) {
      setSelectedProduct({ value: row.product, label: row.product });
      setProductCategoryValue(row.productCategory || '');
    } else {
      setSelectedProduct(null);
      setProductCategoryValue('');
    }

    setIsModalOpen(true);
  };

  const handleProductChange = (selectedOption) => {
    setSelectedProduct(selectedOption);
    if (selectedOption) {
      if (selectedOption.category) {
        setProductCategoryValue(selectedOption.category);
        setFormData(prev => ({ ...prev, productCategory: selectedOption.category }));
      } else {
        setProductCategoryValue('');
        setFormData(prev => ({ ...prev, productCategory: '' }));
        toast.error('No category defined for this product');
      }
    } else {
      setProductCategoryValue('');
      setFormData(prev => ({ ...prev, productCategory: '' }));
    }
  };

  const loadOptions = async (inputValue) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${API_ENDPOINTS.COMPLAINTS.LOOKUP_ITEMS}?search=${inputValue}&limit=100&type=ALL`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        return data.data.map(item => ({
          value: item.ItemCode,
          label: `${item.ItemCode} - ${item.ItemName}`,
          category: item.U_Cat1
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      return toast.error("Please select a product first");
    }

    const payload = {
      Product: selectedProduct.value,
      ProductCategory: productCategoryValue,
      ReportDate: formData.reportDate,
      Department: formData.department,
      ComplaintBy: formData.complaintBy,
      Address: formData.address,
      Contacts: formData.contacts,
      InitiatedBy: initiatedByValue,
      DeviationCategory: formData.deviationCategory,
      BriefDescription: formData.briefDescription,
      BatchNumber: formData.batchNumber,
      RootCauseClass: formData.rootCauseClass,
      IdentifiedRootCause: formData.identifiedRootCause,
      ConcernedDepartment: formData.concernedDepartment,
      Stage1: formData.stage1,
      Stage2: formData.stage2,
      Stage3: formData.stage3,
      Stage4: formData.stage4,
      AdditionalRemarks: formData.additionalRemarks,
      CAPASummary: formData.capaSummary,
      ClosingDate: formData.closingDate,
      CumulativeFrequency: formData.cumulativeFrequency
    };

    try {
      const token = localStorage.getItem('accessToken');
      
      const url = editingComplaint 
        ? `${import.meta.env.VITE_API_BASE_URL}${API_ENDPOINTS.COMPLAINTS.UPDATE_COMPLAINT}/${editingComplaint.complaintNumber}`
        : `${import.meta.env.VITE_API_BASE_URL}${API_ENDPOINTS.COMPLAINTS.CREATE_COMPLAINT}`;
        
      const method = editingComplaint ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        toast.success(editingComplaint ? 'Complaint updated successfully!' : `Complaint created successfully! Number: ${data.data.complaintNumber}`);
        fetchTrend();
        setIsModalOpen(false);
        fetchComplaints(); // Refresh table
      } else {
        toast.error(data.message || (editingComplaint ? 'Failed to update complaint' : 'Failed to create complaint'));
      }
    } catch (error) {
      console.error(editingComplaint ? 'Error updating complaint:' : 'Error creating complaint:', error);
      toast.error(editingComplaint ? 'Error updating complaint' : 'Error creating complaint');
    }
  };

  const columns = [
    { header: 'Complaint Number', key: 'complaintNumber' },
    { header: 'Product Category', key: 'productCategory' },
    { header: 'Report Date', key: 'reportDate', render: (row) => formatDate(row.reportDate) },
    { header: 'Department', key: 'department' },
    { header: 'Complaint By', key: 'complaintBy' },
    { header: 'Address', key: 'address', render: (row) => <ExpandableText text={row.address} /> },
    { header: 'Contact/s', key: 'contacts' },
    { 
      header: 'Initiated By', 
      key: 'initiatedBy',
      render: (row) => {
        if (!row.initiatedBy) return '';
        if (row.initiatedBy.includes('-')) {
          return row.initiatedBy.split('-').slice(1).join('-').trim();
        }
        return row.initiatedBy;
      }
    },
    { header: 'Deviation Category', key: 'deviationCategory' },
    { header: 'Brief Description', key: 'briefDescription', render: (row) => <ExpandableText text={row.briefDescription} /> },
    { header: 'Batch Number', key: 'batchNumber' },
    { header: 'Root Cause Class', key: 'rootCauseClass' },
    { header: 'Identified Root Cause', key: 'identifiedRootCause', render: (row) => <ExpandableText text={row.identifiedRootCause} /> },
    { header: 'Concerned Department', key: 'concernedDepartment' },
    { header: 'Stage 1', key: 'stage1' },
    { header: 'Stage 2', key: 'stage2' },
    { header: 'Stage 3', key: 'stage3' },
    { header: 'Stage 4', key: 'stage4' },
    { header: 'Additional Remarks', key: 'additionalRemarks', render: (row) => <ExpandableText text={row.additionalRemarks} /> },
    { header: 'CAPA Summary', key: 'capaSummary', render: (row) => <ExpandableText text={row.capaSummary} /> },
    { header: 'Closing Date', key: 'closingDate', render: (row) => formatDate(row.closingDate) },
    { header: 'Cumulative Frequency', key: 'cumulativeFrequency' },
    { 
      header: 'Actions', 
      key: 'actions',
      render: (row) => (
        <button 
          className="dome-table-action-btn dome-table-action-btn--edit table-action-edit-btn"
          onClick={(e) => { e.stopPropagation(); handleEditClick(row); }}
          title="Edit"
        >
          <IconEdit size={16} stroke={2} />
        </button>
      )
    }
  ];

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <div className="complaints-container">
      <Toaster position="top-right" />
      <div className="complaints-header">
        <h1></h1>
        <Button variant="primary" onClick={handleOpenModal}>
          Generate Complain
        </Button>
      </div>
      <div className="po-filter-toolbar-card">
        <div className="po-filter-toolbar-grid">
          <div className="po-filter-item po-filter-search-box">
            <label className="po-filter-label">Search</label>
            <div style={{ position: 'relative' }}>
              <IconSearch size={18} className="po-filter-search-icon" />
              <input
                type="text"
                placeholder="Number, product, batch, complaint by..."
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
            <label className="po-filter-label">Department</label>
            <select
              className="po-filter-select"
              value={filters.department}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, department: e.target.value }));
                setCurrentPage(1);
              }}
            >
              <option value="">All departments</option>
              {departments.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="po-filter-item">
            <label className="po-filter-label">Product Category</label>
            <select
              className="po-filter-select"
              value={filters.productCategory}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, productCategory: e.target.value }));
                setCurrentPage(1);
              }}
            >
              <option value="">All categories</option>
              {productCategories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="po-filter-item">
            <label className="po-filter-label">Report From</label>
            <input
              type="date"
              className="po-filter-date-input"
              value={filters.fromDate}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, fromDate: e.target.value }));
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="po-filter-item">
            <label className="po-filter-label">Report To</label>
            <input
              type="date"
              className="po-filter-date-input"
              value={filters.toDate}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, toDate: e.target.value }));
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="po-filter-item">
            <label className="po-filter-label">&nbsp;</label>
            <button
              type="button"
              className="po-filter-reset-btn"
              disabled={!searchQuery && !filters.department && !filters.productCategory && !filters.fromDate && !filters.toDate}
              onClick={() => {
                setSearchQuery('');
                setFilters({ department: '', productCategory: '', fromDate: '', toDate: '' });
                setCurrentPage(1);
              }}
            >
              <IconRefresh size={16} />
              Reset
            </button>
          </div>
        </div>
      </div>
      <div className="complaints-trend">
        <h2>Complaint trend by product</h2>
        {trendChart.length === 0 ? (
          <p className="complaints-trend-empty">No complaints to chart yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={trendChart} margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" interval={0} height={78} tick={<AxisTick />} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip content={<TrendTooltip />} />
              <Bar dataKey="total" fill="#1b47db" maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
  
      <div className="complaints-table-section">
        <Table
          columns={columns}
          data={complaintsData}
          totalEntries={totalComplaints}
          currentPage={currentPage}
          pageSize={pageSize}
          isLoading={tableLoading}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          showActions={false}
          showPagination={totalComplaints > 20}
        />
      </div>

      {isModalOpen && (
        <GlobalPopup
          title={editingComplaint ? "Update Complain" : "Generate Complain"}
          onClose={() => setIsModalOpen(false)}
          className="generate-complain-modal"
          showClose={false}
        >
          <div className="generate-complain-modal-content">
            <div className="generate-complain-modal-header">
              <h2>{editingComplaint ? "Update Complain" : "Generate Complain"}</h2>
            </div>
            <div className="generate-complain-modal-body">
              <form className="generate-complain-form">
                
                {/* New Searchable Product Input */}
                <div className="input-group">
                  <label>Product</label>
                  <AsyncSelect
                    cacheOptions
                    defaultOptions
                    loadOptions={loadOptions}
                    value={selectedProduct}
                    onChange={handleProductChange}
                    placeholder="Search by Code or Name..."
                    className="custom-async-select"
                    classNamePrefix="react-select"
                  />
                </div>

                {/* Render the rest of the columns */}
                {columns.slice(1).filter(col => col.key !== 'actions').map((col, index) => {
                  let spanClass = '';
                  let inputType = col.key.includes('Date') ? 'date' : 'text';
                  let options = undefined;
                  let inputValue = formData[col.key] !== undefined ? formData[col.key] : '';
                  let inputDisabled = false;

                  if (
                    col.key.includes('Description') || 
                    col.key.includes('Remarks') || 
                    col.key.includes('Summary') ||
                    col.key === 'address'
                  ) {
                    spanClass = 'col-span-3';
                  }

                  if (col.key === 'initiatedBy') {
                    inputValue = initiatedByValue;
                    inputDisabled = true;
                  }

                  if (col.key === 'productCategory') {
                    inputValue = productCategoryValue;
                    inputDisabled = true; // Auto-filled from product selection
                  }

                  if (col.key === 'department' || col.key === 'concernedDepartment') {
                    inputType = 'select';
                    options = ['Production', 'QC', 'QA', 'Supply chain', 'Warehouse'];
                  }

                  if (col.key === 'deviationCategory') {
                    inputType = 'select';
                    options = ['Critical', 'Major', 'Minor'];
                  }

                  if (col.key === 'rootCauseClass') {
                    inputType = 'select';
                    options = ['Method', 'Machine', 'Man'];
                  }

                  if (col.key === 'cumulativeFrequency') {
                    inputType = 'number';
                  }

                  return (
                    <Input
                      key={index}
                      label={col.header}
                      id={col.key}
                      placeholder={`Enter ${col.header}`}
                      type={inputType}
                      className={spanClass}
                      options={options}
                      value={inputValue}
                      disabled={inputDisabled}
                      onChange={(e) => setFormData(prev => ({ ...prev, [col.key]: e.target.value }))}
                      defaultValue={inputType === 'select' ? "" : undefined}
                    />
                  );
                })}
              </form>
            </div>
            <div className="generate-complain-modal-footer">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit}>
                {editingComplaint ? "Update" : "Submit"}
              </Button>
            </div>
          </div>
        </GlobalPopup>
      )}
    </div>
  );
};

export default Complaints;
