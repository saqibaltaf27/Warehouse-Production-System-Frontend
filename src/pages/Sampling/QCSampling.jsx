import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import Table from '../../global-components/Table/Table';
import Button from '../../global-components/Button/Button';
import ChooseFromList from '../../global-components/ChooseFromList/ChooseFromList';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Select from 'react-select';
import { IconRefresh, IconSearch } from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { formatDisplayDate } from '../../util/text/datetimeformat';
import '../ProductionOrders/ProductionOrders.css';
import './Sampling.css';

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
  input: (base) => ({ ...base, margin: '0', padding: '0', color: '#1e293b' }),
  indicatorsContainer: (base) => ({ ...base, height: '38px' }),
  dropdownIndicator: (base) => ({
    ...base,
    padding: '4px 6px',
    color: '#64748b',
    '&:hover': { color: '#1e293b' },
  }),
  clearIndicator: (base) => ({
    ...base,
    padding: '4px',
    color: '#94a3b8',
    '&:hover': { color: '#ef4444' },
  }),
  menu: (base) => ({
    ...base,
    fontSize: '13px',
    borderRadius: '2px',
    zIndex: 9999,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
    border: '1px solid #e2e8f0',
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  option: (base, state) => ({
    ...base,
    fontSize: '13px',
    padding: '8px 12px',
    backgroundColor: state.isSelected ? 'var(--primary-blue)' : state.isFocused ? '#f1f5f9' : '#ffffff',
    color: state.isSelected ? '#ffffff' : '#1e293b',
    cursor: 'pointer',
  }),
  placeholder: (base) => ({ ...base, color: '#94a3b8', fontSize: '13px' }),
  singleValue: (base) => ({ ...base, color: '#1e293b', fontSize: '13px' }),
};

const formatDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const currentMonthRange = () => {
  const today = new Date();
  return {
    fromDate: formatDateInput(new Date(today.getFullYear(), today.getMonth(), 1)),
    toDate: formatDateInput(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
  };
};

const statusOptions = [
  { value: 'S,UI', label: 'Sampled / Under Inspection' },
  { value: 'A', label: 'Accepted' },
  { value: 'UI', label: 'Under Inspection' },
  { value: 'P', label: 'Pending' },
  { value: 'S', label: 'Sampled' },
  { value: 'R', label: 'Rejected' },
  { value: 'CA', label: 'Conditionally Accepted' },
  { value: 'CR', label: 'Conditionally Rejected' },
  { value: 'C', label: 'Cancel' },
];

const docTypeOptions = [
  { value: '20', label: 'Goods Receipt PO' },
  { value: '59', label: 'Receipt From Production' },
  { value: '16', label: 'Sales Return' },
  { value: '14', label: 'A/R Credit Memo' },
];

const QC_SAMPLING_FILTERS_KEY = 'qcSamplingFilters';

const readSavedSamplingFilters = () => {
  try {
    const raw = sessionStorage.getItem(QC_SAMPLING_FILTERS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const QCSampling = () => {
  const savedFilters = readSavedSamplingFilters();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showAddSample, setShowAddSample] = useState(false);
  const [listMode, setListMode] = useState('all');
  const initialDates = currentMonthRange();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(savedFilters?.statusFilter || '');
  const [docTypeFilter, setDocTypeFilter] = useState(savedFilters?.docTypeFilter || '');
  const [fromDate, setFromDate] = useState(savedFilters?.fromDate || initialDates.fromDate);
  const [toDate, setToDate] = useState(savedFilters?.toDate || initialDates.toDate);
  const [formMode, setFormMode] = useState('create'); // 'create', 'view', 'edit'
  const [qcCounter, setQcCounter] = useState(1); // Local counter for sampling number
  const [printModalRow, setPrintModalRow] = useState(null);
  const [linesLoading, setLinesLoading] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [sampleForm, setSampleForm] = useState({
    DocumentType: 'Goods Receipt PO',
    DocumentEntry: '',
    DocumentNumber: '',
    SupplierCode: '',
    SupplierName: '',
    SamplingDate: new Date().toISOString().split('T')[0],
    SamplingBy: '',
    ProductionNo: '',
    BatchNo: ''
  });
  const [sampleItems, setSampleItems] = useState([]);

  const handleDocumentSelect = async (value, label, row) => {
    if (!row) {
      setSampleForm(prev => ({ ...prev, DocumentEntry: '', DocumentNumber: '', SupplierCode: '', SupplierName: '' }));
      setSampleItems([]);
      setLinesLoading(false);
      return;
    }
    
    setSampleForm(prev => ({
      ...prev,
      DocumentEntry: row.DocEntry,
      DocumentNumber: row.DocNum,
      SupplierCode: row.CardCode || '',
      SupplierName: row.CardName || ''
    }));
    setSampleItems([]);
    setLinesLoading(true);

    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/sampling/document-details`, {
        params: { docType: sampleForm.DocumentType, docEntry: row.DocEntry }
      });
      if (res.data?.success) {
        const grouped = new Map();
        res.data.data.lines.forEach((item) => {
          const key = `${item.BaseLine ?? ''}::${item.ItemCode || ''}`;
          const existing = grouped.get(key);
          if (!existing) {
            grouped.set(key, { ...item, _serials: item.BatchSerial ? [item.BatchSerial] : [] });
            return;
          }
          if (item.BatchSerial && !existing._serials.includes(item.BatchSerial)) {
            existing._serials.push(item.BatchSerial);
          }
        });

        const lines = [...grouped.values()].map((item, index) => {
          const serials = item._serials;
          const { _serials, ...rest } = item;
          return {
            ...rest,
            Index: index + 1,
            BatchSerial: serials.length === 1 ? serials[0] : '',
            BatchSerialQty: serials.length === 1 ? rest.BatchSerialQty : rest.ActualQty,
            CollectSample: false,
            QCRequestNumber: '',
            ManualQCNo: '',
            Status: 'A'
          };
        });
        setSampleItems(lines);
      }
      
      const qcRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/sampling/next-qc-number`);
      if (qcRes.data?.success) {
        setQcCounter(qcRes.data.nextId);
      }
    } catch (err) {
      console.error("Failed to fetch document details", err);
    } finally {
      setLinesLoading(false);
    }
  };

  const fetchSavedSamples = async () => {
    setLoading(true);
    try {
      const params = { page, limit, fromDate, toDate };
      if (debouncedSearch) params.search = debouncedSearch;
      const status = listMode === 'inspection' ? 'S,UI' : statusFilter;
      if (status) params.status = status;
      if (docTypeFilter) params.docType = docTypeFilter;
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/sampling/saved-samples`, {
        params
      });
      if (res.data?.success) {
        setData(res.data.data);
        setTotalRecords(res.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch saved samples:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    sessionStorage.setItem(QC_SAMPLING_FILTERS_KEY, JSON.stringify({
      statusFilter,
      docTypeFilter,
      fromDate,
      toDate,
    }));
  }, [statusFilter, docTypeFilter, fromDate, toDate]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchSavedSamples();
  }, [page, limit, listMode, statusFilter, docTypeFilter, fromDate, toDate, debouncedSearch]);

  useEffect(() => {
    if (searchParams.get('create') !== '1') return;

    setFormMode('create');
    setSampleForm({
      DocumentType: 'Goods Receipt PO',
      DocumentEntry: '',
      DocumentNumber: '',
      SupplierCode: '',
      SupplierName: '',
      SamplingDate: new Date().toISOString().split('T')[0],
      SamplingBy: user?.firstName || user?.FirstName || '',
      ProductionNo: '',
      BatchNo: ''
    });
    setSampleItems([]);
    setShowAddSample(true);

    const next = new URLSearchParams(searchParams);
    next.delete('create');
    setSearchParams(next, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('view') === 'list') {
      setShowAddSample(false);
      setListMode('all');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && formMode === 'create' && !sampleForm.SamplingBy) {
      setSampleForm(prev => ({ ...prev, SamplingBy: user.firstName || user.FirstName || '' }));
    }
  }, [user, formMode]);

  const handleSave = () => {
    let uType = null;
    switch (sampleForm.DocumentType) {
      case 'Goods Receipt PO': uType = 20; break;
      case 'Receipt From Production': uType = 59; break;
      case 'Sales Return': uType = 16; break;
      case 'A/R Credit Memo': uType = 14; break;
    }

    const payloadLines = sampleItems.map(item => {
      let uManage = null;
      if (item.ManagedBy === 'Batch Managed') uManage = 'B';
      else if (item.ManagedBy === 'Serial Managed') uManage = 'S';
      
      return {
        ...item,
        ManagedBy: uManage,
        CollectSample: item.CollectSample ? 'Y' : 'N'
      };
    });

    const payload = {
      header: {
        ...sampleForm,
        SamplingNo: formMode === 'edit' ? qcCounter : null,
        DocumentType: uType,
        UserEmpId: user?.empId || user?.EmpID || user?.id || user?.emp_id || '',
        UserFirstName: user?.firstName || user?.FirstName || ''
      },
      lines: payloadLines
    };
    
    setLoading(true);
    const savePromise = axios.post(`${import.meta.env.VITE_API_BASE_URL}/sampling/save`, payload)
      .then(res => {
        if (!res.data?.success) {
          throw new Error(res.data?.message || "Failed to save sample");
        }
        setShowAddSample(false);
        fetchSavedSamples();
        return res.data;
      })
      .finally(() => {
        setLoading(false);
      });

    toast.promise(savePromise, {
      loading: 'Saving sample...',
      success: 'Sample saved successfully!',
      error: (err) => err.message || 'Error saving sample',
    });
  };

  const handleRowClick = async (row) => {
    const docnum = row['Sampling No'];
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/sampling/saved-sample/${docnum}`);
      if (res.data?.success) {
        const { header, lines } = res.data.data;
        
        let docType = 'Goods Receipt PO';
        if (header.U_Type === '59') docType = 'Receipt From Production';
        if (header.U_Type === '16') docType = 'Sales Return';
        if (header.U_Type === '14') docType = 'A/R Credit Memo';

        setSampleForm({
          DocumentType: docType,
          DocumentEntry: header.U_DocEntry || '',
          DocumentNumber: header.U_DocNum || '',
          SupplierCode: header.U_CardCode || '',
          SupplierName: header.U_CardName || '',
          SamplingDate: header.U_SmpDate ? new Date(header.U_SmpDate).toISOString().split('T')[0] : '',
          SamplingBy: header.U_SmpByName || '',
          ProductionNo: '',
          BatchNo: ''
        });
        setQcCounter(header.DocNum || header.Docnum || docnum);

        const mappedLines = lines.map((item, index) => {
          const rawStatus = item.U_status || item.U_Status || item.u_status || 'A';
          let mappedStatus = String(rawStatus).trim();
          if (mappedStatus === 'Accepted') mappedStatus = 'A';
          if (mappedStatus === 'Under Inspection') mappedStatus = 'UI';
          if (mappedStatus === 'Pending') mappedStatus = 'P';
          if (mappedStatus === 'Sampled') mappedStatus = 'S';
          if (mappedStatus === 'Rejected') mappedStatus = 'R';
          if (mappedStatus === 'Conditionally Accepted') mappedStatus = 'CA';
          if (mappedStatus === 'Conditionally Rejected') mappedStatus = 'CR';
          if (mappedStatus === 'Cancel') mappedStatus = 'C';

          return {
            Index: index + 1,
            BaseLine: item.U_BaseLine || 0,
            ItemCode: item.U_ItemCode,
            ItemName: item.U_ItemName,
            UomEntry: item.U_UomEntry,
            UOM: item.U_Uom,
            Warehouse: item.U_WhsCode,
            ActualQty: item.U_ActualQty,
            ManagedBy: item.U_Manage === 'B' ? 'Batch Managed' : item.U_Manage === 'S' ? 'Serial Managed' : 'Non Batch/Serial',
            BatchSerial: item.U_Batch,
            SupplierBatchSerial: item.U_Supplier || item.U_SuppSerial || '',
            BatchSerialQty: item.U_BatchQty,
            ExpiryDate: item.U_ExpDate,
            CollectSample: item.U_Collect === 'Y',
            QCRequestNumber: item.U_RequestNo || '',
            ManualQCNo: item.U_ManualQCNo || '',
            SampleQty: item.U_SmpQty || '',
            Status: mappedStatus
          };
        });
        setSampleItems(mappedLines);
        setFormMode('view');
        setShowAddSample(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error("Failed to load saved sample details", err);
    }
  };

  useEffect(() => {
    const openSample = searchParams.get('openSample');
    if (!openSample) return;
    handleRowClick({ 'Sampling No': openSample });
    const next = new URLSearchParams(searchParams);
    next.delete('openSample');
    setSearchParams(next, { replace: true });
  }, [searchParams]);

  const savedSampleColumns = [
    { key: 'Sampling No', header: 'Sampling No' },
    { key: 'Sampling Date', header: 'Sampling Date', render: row => formatDisplayDate(row['Sampling Date']) },
    { key: 'Docnument Type', header: 'Document Type' },
    { key: 'Document Entry', header: 'Document Entry' },
    { key: 'Document No', header: 'Document No' },
    { key: 'Supplier Code', header: 'Supplier Code' },
    { key: 'Supplier Name', header: 'Supplier Name' },
    { key: 'Status', header: 'Status' }
  ];
  const addSampleColumns = [
    { key: 'Index', header: '#' },
    { key: 'QCRequestNumber', header: 'QC Request Number' },
    { key: 'ManualQCNo', header: 'Manual QC No.' },
    { 
      key: 'CollectSample', 
      header: 'Collect Sample', 
      render: (row, idx) => (
        <input 
          type="checkbox" 
          checked={row.CollectSample || false}
          disabled={formMode === 'view'}
          onChange={(e) => {
            const idx = sampleItems.findIndex(r => r.Index === row.Index);
            if (idx === -1) return;
            
            const isChecked = e.target.checked;
            const newItems = [...sampleItems];
            const updatedRow = { ...newItems[idx], CollectSample: isChecked };
            
            if (isChecked) {
              let prefix = '';
              switch (sampleForm.DocumentType) {
                case 'Goods Receipt PO': prefix = 'GRPO'; break;
                case 'Receipt From Production': prefix = 'RP'; break;
                case 'Sales Return': prefix = 'SR'; break;
                case 'A/R Credit Memo': prefix = 'ARM'; break;
                default: prefix = 'QC';
              }
              
              const docNum = sampleForm.DocumentNumber || '';
              const baseLine = updatedRow.BaseLine || 0;
              const itemCode = updatedRow.ItemCode || '';
              const batchSerial = updatedRow.BatchSerial || '';
              
              // Generate QC Request Number using the global Sampling ID (qcCounter)
              const qcReqNum = `${prefix}_${docNum}_${baseLine}_${itemCode}_${batchSerial}_${qcCounter}`;
              updatedRow.QCRequestNumber = qcReqNum;
            } else {
              updatedRow.QCRequestNumber = '';
            }
            
            newItems[idx] = updatedRow;
            setSampleItems(newItems);
          }}
        />
      ) 
    },
    { key: 'BaseLine', header: 'BaseLine' },
    { key: 'ItemCode', header: 'ItemCode' },
    { key: 'ItemName', header: 'ItemName' },
    { key: 'UomEntry', header: 'UomEntry' },
    { key: 'UOM', header: 'UOM' },
    { key: 'Warehouse', header: 'Warehouse' },
    { key: 'ActualQty', header: 'Actual Qty' },
    { key: 'AbsEntry', header: 'AbsEntry' },
    { key: 'ManagedBy', header: 'Managed By' },
    { key: 'BatchSerial', header: 'Batch/Serial' },
    { key: 'SupplierBatchSerial', header: 'Supplier Batch/Serial' },
    { key: 'BatchSerialQty', header: 'Batch/Serial Qty' },
    { 
      key: 'ExpiryDate', 
      header: 'Expiry Date',
      render: (row) => row.ExpiryDate ? new Date(row.ExpiryDate).toLocaleDateString() : ''
    },
    { 
      key: 'ManufactureDate', 
      header: 'Manufacture Date',
      render: (row) => row.ManufactureDate ? new Date(row.ManufactureDate).toLocaleDateString() : ''
    },
    { 
      key: 'SampleQty', 
      header: 'Sample Qty',
      render: (row) => (
        <div className="qc-qty-cell">
          <input 
            type="number" 
            className="add-sample-input qc-qty-input"
            value={row.SampleQty || ''}
            disabled={formMode === 'view'}
            onChange={(e) => {
              const idx = sampleItems.findIndex(r => r.Index === row.Index);
              if (idx === -1) return;
              const newItems = [...sampleItems];
              newItems[idx] = { ...newItems[idx], SampleQty: e.target.value };
              setSampleItems(newItems);
            }}
          />
          {row.SampleQty && (
            <button 
              type="button" 
              onClick={() => setPrintModalRow(row)} 
              className="qc-print-btn"
              title="Print Form"
            >
              🖨️
            </button>
          )}
        </div>
      )
    },
    { 
      key: 'Status', 
      header: 'Status', 
      render: (row) => (
        <select 
          className="add-sample-input qc-status-select"
          value={row.Status || 'A'}
          disabled={formMode === 'view'}
          onChange={(e) => {
            const idx = sampleItems.findIndex(r => r.Index === row.Index);
            if (idx === -1) return;
            const newItems = [...sampleItems];
            newItems[idx] = { ...newItems[idx], Status: e.target.value };
            setSampleItems(newItems);
          }}
        >
          <option value="A">Accepted</option>
          <option value="UI">Under Inspection</option>
          <option value="P">Pending</option>
          <option value="S">Sampled</option>
          <option value="R">Rejected</option>
          <option value="CA">Conditionally Accepted</option>
          <option value="CR">Conditionally Rejected</option>
          <option value="C">Cancel</option>
        </select>
      )
    },
    {
      key: 'TestingResult',
      header: 'Testing Result',
      render: (row) => (
        row.Status === 'UI' || row.Status === 'S' ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              const params = new URLSearchParams({
                tab: 'qc-test-report',
                samplingNo: String(qcCounter || ''),
                itemCode: row.ItemCode || '',
                itemName: row.ItemName || '',
                batch: row.BatchSerial || '',
                sampleQty: row.SampleQty != null ? String(row.SampleQty) : '',
              });
              navigate(`/sampling?${params.toString()}`);
            }}
          >
            Add Testing Result
          </Button>
        ) : null
      )
    },
  ];

  return (
    <div className="qc-sampling-container fade-in-up">
      {printModalRow && createPortal(
        <div className="sample-form-print-overlay">
          <div className="sample-form-sheet">
            <div className="sample-form-toolbar no-print">
               <Button className="sample-form-print-btn" variant="primary" onClick={() => window.print()}>Print</Button>
               <Button className="sample-form-close-btn" variant="outline" onClick={() => setPrintModalRow(null)}>Close</Button>
            </div>
            
            <div id="print-area" className="sample-form">
              <div className="sample-form-head">
                <div className="sample-form-brand">
                  <img className="sample-form-logo" src="/images/ldslogo.png" alt="LDS Logo" />
                  <span className="sample-form-brand-name">Lab Diagnostic Systems<br/>(SMC) Pvt Ltd</span>
                </div>
                <div className="sample-form-title-wrap">
                  <h3 className="sample-form-title">Raw Material Sampling Form</h3>
                </div>
              </div>
              
              <table className="sample-form-table">
                <tbody>
                  <tr>
                    <td className="sample-form-label sample-form-label-wide">Material Name:</td>
                    <td className="sample-form-value" colSpan="3" contentEditable suppressContentEditableWarning>{printModalRow.ItemName}</td>
                  </tr>
                  <tr>
                    <td className="sample-form-label">Supplier Name:</td>
                    <td className="sample-form-value" colSpan="3" contentEditable suppressContentEditableWarning>{sampleForm.SupplierName}</td>
                  </tr>
                  <tr>
                    <td className="sample-form-label">Batch/Lot No:</td>
                    <td className="sample-form-value" contentEditable suppressContentEditableWarning>{printModalRow.BatchSerial}</td>
                    <td className="sample-form-label sample-form-label-grn">GRN No & Date:</td>
                    <td className="sample-form-value" contentEditable suppressContentEditableWarning>{sampleForm.DocumentNumber}{sampleForm.SamplingDate ? ` & ${formatDisplayDate(sampleForm.SamplingDate)}` : ''}</td>
                  </tr>
                  <tr>
                    <td className="sample-form-label">Mfg. Date:</td>
                    <td className="sample-form-value" contentEditable suppressContentEditableWarning>{formatDisplayDate(printModalRow.ManufactureDate)}</td>
                    <td className="sample-form-label">Exp. Date:</td>
                    <td className="sample-form-value" contentEditable suppressContentEditableWarning>{formatDisplayDate(printModalRow.ExpiryDate)}</td>
                  </tr>
                  <tr>
                    <td className="sample-form-label">Total Quantity:</td>
                    <td className="sample-form-value" contentEditable suppressContentEditableWarning>{printModalRow.BatchSerialQty || printModalRow.ActualQty}</td>
                    <td className="sample-form-label">Sample Quantity:</td>
                    <td className="sample-form-value" contentEditable suppressContentEditableWarning>{printModalRow.SampleQty}</td>
                  </tr>
                  <tr>
                    <td className="sample-form-section" colSpan="2">Sampled by:</td>
                    <td className="sample-form-section" colSpan="2">Received by:</td>
                  </tr>
                  <tr>
                    <td className="sample-form-label">Name:</td>
                    <td className="sample-form-value" contentEditable suppressContentEditableWarning>{sampleForm.SamplingBy}</td>
                    <td className="sample-form-label">Name:</td>
                    <td className="sample-form-value" contentEditable suppressContentEditableWarning></td>
                  </tr>
                  <tr>
                    <td className="sample-form-label">Designation:</td>
                    <td className="sample-form-value" contentEditable suppressContentEditableWarning></td>
                    <td className="sample-form-label">Designation:</td>
                    <td className="sample-form-value" contentEditable suppressContentEditableWarning></td>
                  </tr>
                  <tr>
                    <td className="sample-form-label sample-form-sign">Signature/Date:</td>
                    <td className="sample-form-value" contentEditable suppressContentEditableWarning></td>
                    <td className="sample-form-label">Signature/Date:</td>
                    <td className="sample-form-value" contentEditable suppressContentEditableWarning></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>,
        document.body
      )}
      {showAddSample && (
        <div className="add-sample-wrapper">
          <div className="add-sample-header section-header-flex">
            <h4 className="add-sample-title">
              {formMode === 'create' ? '' : formMode === 'view' ? '' : ''}
            </h4>
            {formMode !== 'create' && (
              <div className="sample-mode-actions">
                <Button variant={formMode === 'view' ? 'primary' : 'outline'} onClick={() => setFormMode('view')}>View</Button>
                <Button variant={formMode === 'edit' ? 'primary' : 'outline'} onClick={() => setFormMode('edit')}>Edit</Button>
              </div>
            )}
          </div>
          
          <div className="add-sample-body">
            {/* Header Fields Grid */}
            <div className="add-sample-grid">
              {/* Left Column */}
              <div className="add-sample-col">
                <div className="add-sample-field">
                  <label className="add-sample-label">Document Type</label>
                  <select 
                    className="add-sample-input"
                    value={sampleForm.DocumentType}
                    disabled={formMode === 'view'}
                    onChange={(e) => {
                      setSampleForm({
                        DocumentType: e.target.value,
                        DocumentEntry: '', DocumentNumber: '', SupplierCode: '', SupplierName: ''
                      });
                      setSampleItems([]);
                    }}
                  >
                    <option value="Goods Receipt PO">Goods Receipt PO</option>
                    <option value="Receipt From Production">Receipt From Production</option>
                    <option value="Sales Return">Sales Return</option>
                    <option value="A/R Credit Memo">A/R Credit Memo</option>
                  </select>
                </div>
                <div className="add-sample-field sample-doc-field">
                  <label className="add-sample-label">Document Entry</label>
                  <div className="sample-doc-picker">
                    <ChooseFromList
                      title={`Select Open ${sampleForm.DocumentType}`}
                      apiEndpoint={`/sampling/open-documents`}
                      queryParams={{ docType: sampleForm.DocumentType }}
                      disabled={formMode === 'view'}
                      drillDown={sampleForm.DocumentType === 'Goods Receipt PO' ? {
                        endpoint: '/sampling/document-details',
                        extraParams: { docType: sampleForm.DocumentType },
                        entryKey: 'DocEntry',
                      } : null}
                      columns={sampleForm.DocumentType === 'Goods Receipt PO' ? [
                        { key: 'DocNum', header: 'GRN No' },
                        { key: 'CardName', header: 'Supplier Name' },
                        { key: 'DocDate', header: 'GRN Date', render: (row) => formatDisplayDate(row.DocDate) || '-' },
                        { key: 'ItemCount', header: 'Items' },
                      ] : [
                        { key: 'DocNum', header: 'Document Number' },
                        { key: 'DocEntry', header: 'Doc Entry' },
                        { key: 'CardCode', header: sampleForm.DocumentType === 'Receipt From Production' ? 'Item Code' : 'Supplier Code' },
                        { key: 'CardName', header: sampleForm.DocumentType === 'Receipt From Production' ? 'Item Name' : 'Supplier Name' },
                      ]}
                      valueKey="DocEntry"
                      labelKey="DocNum"
                      value={sampleForm.DocumentEntry}
                      displayValue={sampleForm.DocumentEntry ? String(sampleForm.DocumentEntry) : ''}
                      onChange={handleDocumentSelect}
                      placeholder="Click to select document..."
                    />
                  </div>
                </div>
                <div className="add-sample-field">
                  <label className="add-sample-label">Document Number</label>
                  <input type="text" className="add-sample-input" value={sampleForm.DocumentNumber} disabled />
                </div>
                <div className="add-sample-field">
                  <label className="add-sample-label">{sampleForm.DocumentType === 'Receipt From Production' ? 'Item Code' : 'Supplier Code'}</label>
                  <input type="text" className="add-sample-input" value={sampleForm.SupplierCode} disabled />
                </div>
                <div className="add-sample-field">
                  <label className="add-sample-label">{sampleForm.DocumentType === 'Receipt From Production' ? 'Item Name' : 'Supplier Name'}</label>
                  <input type="text" className="add-sample-input" value={sampleForm.SupplierName} disabled />
                </div>
                <div className="add-sample-field">
                  <label className="add-sample-label">Branch</label>
                  <input type="text" className="add-sample-input" value="Diagnostic" disabled />
                </div>
              </div>

              {/* Right Column */}
              <div className="add-sample-col">
                <div className="add-sample-field">
                  <label className="add-sample-label">Document Entry ID</label>
                  <input type="text" className="add-sample-input" value={qcCounter} disabled />
                </div>
                <div className="add-sample-field">
                  <label className="add-sample-label">Sampling Date</label>
                  <input type="date" className="add-sample-input" disabled={formMode === 'view'} value={sampleForm.SamplingDate} onChange={e => setSampleForm({...sampleForm, SamplingDate: e.target.value})} />
                </div>
                <div className="add-sample-field">
                  <label className="add-sample-label">Sampling By</label>
                  <input type="text" className="add-sample-input" disabled value={sampleForm.SamplingBy || user?.FirstName || user?.firstName || ''} />
                </div>
                <div className="add-sample-field">
                  <label className="add-sample-label">Production No</label>
                  <input type="text" className="add-sample-input" disabled={formMode === 'view'} value={sampleForm.ProductionNo} onChange={e => setSampleForm({...sampleForm, ProductionNo: e.target.value})} />
                </div>
                <div className="add-sample-field">
                  <label className="add-sample-label">Batch No</label>
                  <input type="text" className="add-sample-input" disabled={formMode === 'view'} value={sampleForm.BatchNo} onChange={e => setSampleForm({...sampleForm, BatchNo: e.target.value})} />
                </div>
              </div>
            </div>

            {/* Body Table */}
            <div className="add-sample-table-wrapper sample-items-table">
              <Table 
                data={sampleItems}
                isLoading={linesLoading}
                columns={addSampleColumns}
                showActions={false}
                showPagination={false}
              />
            </div>
          </div>
          
          <div className="add-sample-footer">
            {formMode !== 'view' && (
              <Button variant="primary" disabled={loading} onClick={handleSave}>
                {loading ? 'Creating' : 'Create Sample'}
              </Button>
            )}
          </div>
        </div>
      )}

      {!showAddSample && <div className="dome-card-wrapper">
        <div className="section-header-flex qc-list-header">
           <div className="qc-sampling-actions">
            {/* {!showAddSample && (
              <Button
                variant={listMode === 'inspection' ? 'primary' : 'outline'}
                onClick={() => {
                  setListMode(listMode === 'inspection' ? 'all' : 'inspection');
                  setPage(1);
                }}
              >
                Under Inspection
              </Button>
            )} */}
            {/* {!showAddSample && (
              <Button variant="primary" onClick={() => {
                setFormMode('create');
                setSampleForm({
                  DocumentType: 'Goods Receipt PO',
                  DocumentEntry: '',
                  DocumentNumber: '',
                  SupplierCode: '',
                  SupplierName: '',
                  SamplingDate: new Date().toISOString().split('T')[0],
                  SamplingBy: user?.FirstName || user?.firstName || '',
                  ProductionNo: '',
                  BatchNo: ''
                });
                setSampleItems([]);
                setShowAddSample(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}>
                Add Sample
              </Button>
            )} */}
          </div>
        </div>

        <div className="po-filter-toolbar-card">
          <div className="po-filter-toolbar-grid">
            <div className="po-filter-item po-filter-search-box">
              <label className="po-filter-label">Search</label>
              <div style={{ position: 'relative' }}>
                <IconSearch size={18} className="po-filter-search-icon" />
                <input
                  type="text"
                  placeholder="Sampling no, supplier code or name"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="po-filter-search-input"
                />
              </div>
            </div>
            <div className="po-filter-item" style={{ minWidth: '220px' }}>
              <label className="po-filter-label">Status</label>
              <Select
                value={statusOptions.find((opt) => opt.value === (listMode === 'inspection' ? 'S,UI' : statusFilter)) || null}
                onChange={(opt) => {
                  setListMode('all');
                  setStatusFilter(opt ? opt.value : '');
                  setPage(1);
                }}
                options={statusOptions}
                placeholder="All Statuses"
                isClearable
                isSearchable
                menuPortalTarget={document.body}
                styles={filterSelectStyles}
              />
            </div>
            <div className="po-filter-item" style={{ minWidth: '220px' }}>
              <label className="po-filter-label">Document Type</label>
              <Select
                value={docTypeOptions.find((opt) => opt.value === docTypeFilter) || null}
                onChange={(opt) => {
                  setDocTypeFilter(opt ? opt.value : '');
                  setPage(1);
                }}
                options={docTypeOptions}
                placeholder="All Document Types"
                isClearable
                isSearchable
                menuPortalTarget={document.body}
                styles={filterSelectStyles}
              />
            </div>
            <div className="po-filter-item">
              <label className="po-filter-label">Date From</label>
              <input
                type="date"
                className="po-filter-date-input"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="po-filter-item">
              <label className="po-filter-label">Date To</label>
              <input
                type="date"
                className="po-filter-date-input"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="po-filter-item">
              <label className="po-filter-label">&nbsp;</label>
              <button
                type="button"
                className="po-filter-reset-btn"
                onClick={() => {
                  const dates = currentMonthRange();
                  setListMode('all');
                  setSearchInput('');
                  setDebouncedSearch('');
                  setStatusFilter('');
                  setDocTypeFilter('');
                  setFromDate(dates.fromDate);
                  setToDate(dates.toDate);
                  setPage(1);
                }}
                disabled={!searchInput && !statusFilter && listMode !== 'inspection' && !docTypeFilter && fromDate === initialDates.fromDate && toDate === initialDates.toDate}
                title="Reset filters"
              >
                <IconRefresh size={16} />
                Reset
              </button>
            </div>
          </div>
        </div>
        
        <Table
          data={data}
          isLoading={loading}
          columns={savedSampleColumns}
          totalEntries={totalRecords}
          currentPage={page}
          pageSize={limit}
          onPageChange={setPage}
          onItemsPerPageChange={setLimit}
          showActions={false}
          onRowClick={handleRowClick}
        />
      </div>}
    </div>
  );
};

export default QCSampling;
