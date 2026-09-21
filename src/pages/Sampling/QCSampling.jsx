import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Table from '../../global-components/Table/Table';
import Button from '../../global-components/Button/Button';
import ChooseFromList from '../../global-components/ChooseFromList/ChooseFromList';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Sampling.css';

const QCSampling = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showAddSample, setShowAddSample] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create', 'view', 'edit'
  const [qcCounter, setQcCounter] = useState(1); // Local counter for sampling number
  
  const { user } = useAuth();
  
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
      return;
    }
    
    setSampleForm(prev => ({
      ...prev,
      DocumentEntry: row.DocEntry,
      DocumentNumber: row.DocNum,
      SupplierCode: row.CardCode || '',
      SupplierName: row.CardName || ''
    }));

    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/sampling/document-details`, {
        params: { docType: sampleForm.DocumentType, docEntry: row.DocEntry }
      });
      if (res.data?.success) {
        const lines = res.data.data.lines.map((item, index) => ({
          ...item,
          Index: index + 1,
          CollectSample: false, // Default un-checked
          QCRequestNumber: '',
          ManualQCNo: '',
          Status: 'A'
        }));
        setSampleItems(lines);
      }
      
      const qcRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/sampling/next-qc-number`);
      if (qcRes.data?.success) {
        setQcCounter(qcRes.data.nextId);
      }
    } catch (err) {
      console.error("Failed to fetch document details", err);
    }
  };

  const fetchSavedSamples = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/sampling/saved-samples`, {
        params: { page, limit }
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
    fetchSavedSamples();
  }, [page, limit]);

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
        DocumentType: uType,
        UserEmpId: user?.empId || user?.EmpID || user?.id || user?.emp_id || '',
        UserFirstName: user?.firstName || user?.FirstName || ''
      },
      lines: payloadLines
    };
    
    const savePromise = axios.post(`${import.meta.env.VITE_API_BASE_URL}/sampling/save`, payload)
      .then(res => {
        if (!res.data?.success) {
          throw new Error(res.data?.message || "Failed to save sample");
        }
        setShowAddSample(false);
        fetchSavedSamples();
        return res.data;
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
        setQcCounter(header.Docnum);

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

  const savedSampleColumns = [
    { key: 'Sampling No', header: 'Sampling No' },
    { key: 'Sampling Date', header: 'Sampling Date', render: row => row['Sampling Date'] ? new Date(row['Sampling Date']).toLocaleDateString() : '' },
    { key: 'Docnument Type', header: 'Document Type' },
    { key: 'Document Entry', header: 'Document Entry' },
    { key: 'Document No', header: 'Document No' },
    { key: 'Supplier Code', header: 'Supplier Code' },
    { key: 'Supplier Name', header: 'Supplier Name' },
    { key: 'QC Request Number', header: 'QC Request Number' },
    { key: 'Collect Sample Type', header: 'Collect Sample Type' },
    { key: 'ItemCode', header: 'ItemCode' },
    { key: 'ItemName', header: 'ItemName' },
    { key: 'Actual Qty', header: 'Actual Qty' },
    { key: 'Managed By', header: 'Managed By' },
    { key: 'Batch', header: 'Batch/Serial' },
    { key: 'Batch Qty', header: 'Batch/Serial Qty' },
    { key: 'Sample Qty', header: 'Sample Qty' },
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
        <input 
          type="number" 
          className="add-sample-input" 
          style={{ width: '80px', padding: '4px' }}
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
      )
    },
    { 
      key: 'Status', 
      header: 'Status', 
      render: (row) => (
        <select 
          className="add-sample-input" 
          style={{ width: '150px', padding: '4px' }}
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
  ];

  return (
    <div className="qc-sampling-container fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {showAddSample && (
        <div className="add-sample-wrapper">
          <div className="add-sample-header section-header-flex">
            <h4 className="add-sample-title">
              {formMode === 'create' ? 'Add New Sample' : formMode === 'view' ? 'View Sample' : 'Edit Sample'}
            </h4>
            {formMode !== 'create' && (
              <div style={{ display: 'flex', gap: '8px' }}>
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
                <div className="add-sample-field" style={{ position: 'relative' }}>
                  <label className="add-sample-label">Document Entry</label>
                  <div style={{ flex: 1 }}>
                    <ChooseFromList
                      title={`Select Open ${sampleForm.DocumentType}`}
                      apiEndpoint={`${import.meta.env.VITE_API_BASE_URL}/sampling/open-documents`}
                      queryParams={{ docType: sampleForm.DocumentType }}
                      disabled={formMode === 'view'}
                      columns={[
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
                  <input type="text" className="add-sample-input" disabled={formMode === 'view'} value={sampleForm.SamplingBy} onChange={e => setSampleForm({...sampleForm, SamplingBy: e.target.value})} />
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
            <div className="add-sample-table-wrapper" style={{ border: 'none', boxShadow: 'none', marginTop: '16px' }}>
              <Table 
                data={sampleItems}
                columns={addSampleColumns}
                showActions={false}
                showPagination={false}
              />
            </div>
          </div>
          
          <div className="add-sample-footer">
            {/* Footer */}
            <Button variant="danger" onClick={() => setShowAddSample(false)}>Cancel</Button>
            {formMode !== 'view' && (
              <Button variant="primary" onClick={handleSave}>Save Changes</Button>
            )}
          </div>
        </div>
      )}

      <div className="dome-card-wrapper">
        <div className="section-header-flex" style={{ marginBottom: '16px' }}>
          <h3 className="section-title">Saved QC Samples</h3>
          <div className="qc-sampling-actions">
            {!showAddSample && (
              <Button variant="primary" onClick={() => {
                setFormMode('create');
                setSampleForm({ DocumentType: 'Goods Receipt PO', DocumentEntry: '', DocumentNumber: '', SupplierCode: '', SupplierName: '' });
                setSampleItems([]);
                setShowAddSample(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}>
                Add Sample
              </Button>
            )}
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
      </div>
    </div>
  );
};

export default QCSampling;
