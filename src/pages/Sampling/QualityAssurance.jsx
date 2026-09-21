import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Table from '../../global-components/Table/Table';
import Button from '../../global-components/Button/Button';
import ChooseFromList from '../../global-components/ChooseFromList/ChooseFromList';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import './Sampling.css';

const QualityAssurance = () => {
  const { user } = useAuth();
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [recordDetails, setRecordDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [sampleQty, setSampleQty] = useState('');
  const [tableData, setTableData] = useState([]);
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [nextDocEntry, setNextDocEntry] = useState('');
  const [batchOptions, setBatchOptions] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [batchQty, setBatchQty] = useState('');
  const [batchMfgDate, setBatchMfgDate] = useState('');
  const [batchExpDate, setBatchExpDate] = useState('');
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);
  const [qcType, setQcType] = useState('B');

  const [sampleBy, setSampleBy] = useState('');
  const [inspectedBy, setInspectedBy] = useState('');
  const [analyzedBy, setAnalyzedBy] = useState('');
  const [reviewedBy, setReviewedBy] = useState('');
  const [reportBy, setReportBy] = useState('');
  const [qcDecision, setQcDecision] = useState('A');
  const [qcRemarks, setQcRemarks] = useState('');
  const [acceptedQty, setAcceptedQty] = useState('');
  const [rejectedQty, setRejectedQty] = useState('');
  const [releaseWarehouse, setReleaseWarehouse] = useState('');
  const [rejectionWarehouse, setRejectionWarehouse] = useState('');
  const [acceptedITR, setAcceptedITR] = useState('');
  const [rejectedITR, setRejectedITR] = useState('');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchQualityRecords = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/quality/quality-records`, {
        params: { page: pageNum, limit }
      });
      if (res.data?.success) {
        setData(res.data.data);
        setTotalRecords(res.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Error fetching quality records:", err);
      toast.error("Failed to load quality records");
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipments = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/quality/equipments`);
      if (res.data?.success) {
        setEquipmentOptions(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching equipments:", err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/quality/employees`);
      if (res.data?.success) {
        setEmployeeOptions(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  useEffect(() => {
    fetchQualityRecords(page);
    fetchEquipments();
    fetchEmployees();
  }, [page]);

  const handleRowClick = async (row) => {
    setSelectedRecord(row);
    setShowForm(true);
    setLoadingDetails(true);
    
    // Smooth scroll to top to see the details panel
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/quality/quality-record/${row['Document Entry']}`);
      if (res.data?.success) {
        setRecordDetails(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching details:", err);
      toast.error("Failed to load record details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchNextDocEntry = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/quality/next-doc-entry`);
      if (res.data?.success) {
        setNextDocEntry(res.data.nextDocEntry);
      }
    } catch (err) {
      console.error("Error fetching next doc entry:", err);
    }
  };

  const handleAddQuality = () => {
    setSelectedRecord(null);
    setRecordDetails([]);
    setShowForm(true);
    fetchNextDocEntry();
    setItemCode('');
    setItemName('');
    setSampleQty('');
    setTableData([]);
    setBatchOptions([]);
    setSelectedBatch('');
    setBatchQty('');
    setBatchMfgDate('');
    setBatchExpDate('');
    setDocDate(new Date().toISOString().split('T')[0]);
    setQcType('B');
    setSampleBy('');
    setInspectedBy('');
    setAnalyzedBy('');
    setReviewedBy('');
    setReportBy('');
    setQcDecision('A');
    setQcRemarks('');
    setAcceptedQty('');
    setRejectedQty('');
    setReleaseWarehouse('');
    setRejectionWarehouse('');
    setAcceptedITR('');
    setRejectedITR('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveQuality = async () => {
    if (!itemCode) {
      toast.error("Please select an item.");
      return;
    }

    try {
      const payload = {
        itemCode,
        itemName,
        sampleQty,
        selectedBatch,
        batchQty,
        batchExpDate,
        type: 'M',
        qcType,
        docDate,
        lines: tableData,
        sampleBy,
        sampleByName: employeeOptions.find(e => e.EmpID == sampleBy)?.FirstName || null,
        inspectedBy,
        inspectedByName: employeeOptions.find(e => e.EmpID == inspectedBy)?.FirstName || null,
        analyzedBy,
        analyzedByName: employeeOptions.find(e => e.EmpID == analyzedBy)?.FirstName || null,
        reviewedBy,
        reviewedByName: employeeOptions.find(e => e.EmpID == reviewedBy)?.FirstName || null,
        reportBy,
        reportByName: employeeOptions.find(e => e.EmpID == reportBy)?.FirstName || null,
        qcDecision,
        qcRemarks,
        acceptedQty,
        rejectedQty,
        releaseWarehouse,
        rejectionWarehouse,
        acceptedITR,
        rejectedITR,
        empId: user ? (user.empId || user.EmpID || user.id || user.emp_id) : null,
        empName: user ? (user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.username) : null,
      };

      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/quality/record`, payload);
      if (res.data?.success) {
        toast.success("Quality record created successfully!");
        setShowForm(false);
        fetchQualityRecords(1);
      } else {
        toast.error(res.data?.message || "Failed to save quality record");
      }
    } catch (err) {
      console.error("Failed to save quality record:", err);
      toast.error(err.response?.data?.message || "Failed to save quality record");
    }
  };

  const mainColumns = [
    { key: 'Document Number', header: 'Doc Num' },
    { key: 'QC Type', header: 'QC Type' },
    { key: 'Type', header: 'Type' },
    { key: 'Request Number', header: 'Request No' },
    { key: 'BaseType', header: 'Base Type' },
    { key: 'Item Code', header: 'Item Code' },
    { key: 'Item Name', header: 'Item Name' },
    { key: 'Sample Qty', header: 'Sample Qty' },
    { key: 'QC Decision', header: 'QC Decision' }
  ];

  const detailColumns = [
    { key: 'Parameter Line', header: '#' },
    { key: 'Parameter Code', header: 'Parameter Code' },
    { key: 'Parameter Name', header: 'Parameter Name' },
    { 
      key: 'Action', 
      header: 'Action',
      render: (row) => (
        <textarea 
          rows={2}
          value={row['Action'] || ''}
          readOnly
          className="qc-param-textarea"
          style={{ backgroundColor: '#f5f5f5' }}
        />
      )
    },
    { 
      key: 'Criteria', 
      header: 'Criteria',
      render: (row) => (
        <textarea 
          rows={2}
          value={row['Criteria'] || ''}
          readOnly
          className="qc-param-textarea"
          style={{ backgroundColor: '#f5f5f5' }}
        />
      )
    },
    { 
      key: 'Equipment Code', 
      header: 'Equipment Code',
      render: (row, rowIndex) => (
        <select 
          value={row['Equipment Code'] || ''} 
          onChange={(e) => {
            const newData = [...tableData];
            newData[rowIndex]['Equipment Code'] = e.target.value;
            // Optionally update Equipment Name if needed based on selection
            const selectedEqp = equipmentOptions.find(eq => eq.U_EqpCode === e.target.value);
            if (selectedEqp) {
              newData[rowIndex]['Equipment Name'] = selectedEqp.U_EqpName;
            }
            setTableData(newData);
          }}
          style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' }}
        >
          <option value="">-</option>
          {equipmentOptions.map((eq, i) => (
            <option key={i} value={eq.U_EqpCode}>
              {eq.U_EqpCode} - {eq.U_EqpName}
            </option>
          ))}
        </select>
      )
    },
    { key: 'Equipment Name', header: 'Equipment Name' },
    { key: 'UOM', header: 'UOM' },
    { key: 'Std Value', header: 'Std Value' },
    { key: 'Min Value', header: 'Min Value' },
    { key: 'Max Value', header: 'Max Value' },
    { 
      key: 'Type', 
      header: 'Type',
      render: (row, rowIndex) => (
        <select 
          value={row.Type || 'M'} 
          onChange={(e) => {
            const newData = [...tableData];
            newData[rowIndex].Type = e.target.value;
            setTableData(newData);
          }}
          style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' }}
        >
          <option value="M">M - Material</option>
          <option value="P">P - Process</option>
        </select>
      )
    },
    { 
      key: 'Observed Value 1', 
      header: 'Observed Value 1',
      render: (row, rowIndex) => (
        <input 
          type="text" 
          value={row['Observed Value 1'] || ''}
          onChange={(e) => {
            const newData = [...tableData];
            newData[rowIndex]['Observed Value 1'] = e.target.value;
            setTableData(newData);
          }}
          style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' }}
        />
      )
    },
    { 
      key: 'Observed Value 2', 
      header: 'Observed Value 2',
      render: (row, rowIndex) => (
        <input 
          type="text" 
          value={row['Observed Value 2'] || ''}
          onChange={(e) => {
            const newData = [...tableData];
            newData[rowIndex]['Observed Value 2'] = e.target.value;
            setTableData(newData);
          }}
          style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' }}
        />
      )
    },
    { 
      key: 'Observed Value 3', 
      header: 'Observed Value 3',
      render: (row, rowIndex) => (
        <input 
          type="text" 
          value={row['Observed Value 3'] || ''}
          onChange={(e) => {
            const newData = [...tableData];
            newData[rowIndex]['Observed Value 3'] = e.target.value;
            setTableData(newData);
          }}
          style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' }}
        />
      )
    }
  ];

  return (
    <div className="qc-sampling-container fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {showForm && (
        <div className="add-sample-wrapper">
          <div className="add-sample-header section-header-flex">
            <h4 className="add-sample-title">
              {selectedRecord ? `Quality Details: ${selectedRecord['Document Number']}` : 'Add Quality Record'}
            </h4>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Close</Button>
          </div>

          <div className="add-sample-body">
            {!selectedRecord ? (
              <div className="add-sample-form">
                <div className="add-sample-grid" style={{ marginBottom: '24px' }}>
                  <div className="add-sample-col">
                    <div className="add-sample-field">
                      <label className="add-sample-label">QC Type</label>
                      <select 
                        className="add-sample-input"
                        value={qcType}
                        onChange={(e) => setQcType(e.target.value)}
                      >
                        <option value="B">Based on Document</option>
                        <option value="S">Standalone</option>
                      </select>
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Type</label>
                      <select className="add-sample-input">
                        <option value="M">M - Material</option>
                        <option value="P">P - Process</option>
                      </select>
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Request Number</label>
                      <input type="text" className="add-sample-input" />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Base Type</label>
                      <input type="text" className="add-sample-input" value="Goods Receipt PO" disabled />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Base Document No.</label>
                      <input type="text" className="add-sample-input" />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">BP Code</label>
                      <input type="text" className="add-sample-input" disabled />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">BP Name</label>
                      <input type="text" className="add-sample-input" disabled />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">ItemCode</label>
                      <div style={{ flex: 1 }}>
                        <ChooseFromList
                          title="Select Item"
                          apiEndpoint={`${import.meta.env.VITE_API_BASE_URL}/quality/items`}
                          columns={[
                            { key: 'ItemCode', header: 'Item Code' },
                            { key: 'ItemName', header: 'Item Name' }
                          ]}
                          valueKey="ItemCode"
                          labelKey="ItemName"
                          value={itemCode}
                          displayValue={itemCode}
                          onChange={async (val, label, row) => {
                            setItemCode(val);
                            setItemName(label);
                            if (val) {
                              try {
                                const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/quality/item-by-code`, { params: { itemCode: val } });
                                if (res.data?.success) {
                                  const itemData = res.data.data;
                                  setSampleQty(itemData.U_SampleSize !== null ? String(itemData.U_SampleSize) : '1.0000');

                                  if (res.data.lines) {
                                    const mappedLines = res.data.lines.map(line => ({
                                      'Parameter Line': line.LineId,
                                      'Parameter Code': line.U_PrmCode,
                                      'Parameter Name': line.U_PrmName,
                                      'Action': line.U_Action,
                                      'Criteria': line.U_Criteria,
                                      'Equipment Code': line.U_EqpCode,
                                      'Equipment Name': line.U_EqpName,
                                      'UOM': line.U_PrmUom,
                                      'Std Value': line.U_StdValue,
                                      'Min Value': line.U_MinValue,
                                      'Max Value': line.U_MaxValue,
                                      'Type': line.U_Type,
                                      'Observed Value 1': '',
                                      'Observed Value 2': '',
                                      'Observed Value 3': ''
                                    }));
                                    setTableData(mappedLines);
                                  }
                                }
                              } catch (err) {
                                console.error('Failed to fetch item details:', err);
                                setSampleQty('');
                                setTableData([]);
                              }
                              
                              try {
                                const batchRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/quality/item-batches`, { params: { itemCode: val } });
                                if (batchRes.data?.success) {
                                  setBatchOptions(batchRes.data.data);
                                  if (batchRes.data.data.length > 0) {
                                    const firstBatch = batchRes.data.data[0];
                                    setSelectedBatch(firstBatch.BatchSerial);
                                    setBatchQty(firstBatch.Qty);
                                    setBatchMfgDate(firstBatch.MnfDate ? new Date(firstBatch.MnfDate).toISOString().split('T')[0] : '');
                                    setBatchExpDate(firstBatch.ExpDate ? new Date(firstBatch.ExpDate).toISOString().split('T')[0] : '');
                                  } else {
                                    setSelectedBatch('');
                                    setBatchQty('');
                                    setBatchMfgDate('');
                                    setBatchExpDate('');
                                  }
                                }
                              } catch (err) {
                                console.error('Failed to fetch item batches:', err);
                                setBatchOptions([]);
                                setSelectedBatch('');
                                setBatchQty('');
                                setBatchMfgDate('');
                                setBatchExpDate('');
                              }
                            } else {
                              setSampleQty('');
                              setTableData([]);
                              setBatchOptions([]);
                              setSelectedBatch('');
                              setBatchQty('');
                              setBatchMfgDate('');
                              setBatchExpDate('');
                            }
                          }}
                          placeholder="Search ItemCode..."
                        />
                      </div>
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">ItemName</label>
                      <input type="text" className="add-sample-input" value={itemName} disabled />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Sample Qty</label>
                      <input type="text" className="add-sample-input" value={sampleQty} onChange={(e) => setSampleQty(e.target.value)} />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Inspection Warehouse</label>
                      <input type="text" className="add-sample-input" />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Supplier Batch/Serial</label>
                      <input type="text" className="add-sample-input" />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Branch</label>
                      <select className="add-sample-input">
                        <option>Diagnostic</option>
                      </select>
                    </div>
                  </div>

                  <div className="add-sample-col">
                    <div className="add-sample-field">
                      <label className="add-sample-label">Series</label>
                      <input type="text" className="add-sample-input" disabled />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Document Entry</label>
                      <input 
                        type="text" 
                        className="add-sample-input" 
                        disabled 
                        value={selectedRecord ? selectedRecord['Document Entry'] : nextDocEntry} 
                      />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Document Date</label>
                      <input 
                        type="date" 
                        className="add-sample-input" 
                        value={docDate}
                        onChange={(e) => setDocDate(e.target.value)}
                      />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Line No.</label>
                      <input type="text" className="add-sample-input" disabled />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Batch/Serial</label>
                      <select 
                        className="add-sample-input" 
                        value={selectedBatch} 
                        disabled={!!selectedRecord}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedBatch(val);
                          const selected = batchOptions.find(b => b.BatchSerial === val);
                          if (selected) {
                            setBatchQty(selected.Qty);
                            setBatchMfgDate(selected.MnfDate ? new Date(selected.MnfDate).toISOString().split('T')[0] : '');
                            setBatchExpDate(selected.ExpDate ? new Date(selected.ExpDate).toISOString().split('T')[0] : '');
                          } else {
                            setBatchQty('');
                            setBatchMfgDate('');
                            setBatchExpDate('');
                          }
                        }}
                      >
                        <option value="">Select Batch/Serial</option>
                        {batchOptions.map((b, i) => (
                          <option key={i} value={b.BatchSerial}>{b.BatchSerial}</option>
                        ))}
                      </select>
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">AbsEntry</label>
                      <input type="text" className="add-sample-input" disabled />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Actual Quantity</label>
                      <input type="text" className="add-sample-input" disabled />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Batch/Serial Quantity</label>
                      <input type="text" className="add-sample-input" value={batchQty} disabled />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">MFG Date</label>
                      <input type="date" className="add-sample-input" value={batchMfgDate} disabled />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Expiry Date</label>
                      <input type="date" className="add-sample-input" value={batchExpDate} disabled />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Re-Test Date</label>
                      <input type="date" className="add-sample-input" />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Inspection ITR</label>
                      <input type="text" className="add-sample-input" disabled />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Managed By</label>
                      <input type="text" className="add-sample-input" disabled />
                    </div>
                  </div>
                </div>

               

                <div className="add-sample-table-wrapper" style={{ border: 'none', boxShadow: 'none', marginBottom: '24px' }}>
                  <Table 
                    data={tableData}
                    columns={detailColumns}
                    showActions={false}
                    showPagination={false}
                  />
                </div>

                <div className="add-sample-grid">
                  <div className="add-sample-col">
                    <div className="add-sample-field">
                      <label className="add-sample-label">Sample By</label>
                      <select className="add-sample-input" value={sampleBy} onChange={e => setSampleBy(e.target.value)}>
                        <option value="">Select Employee</option>
                        {employeeOptions.map(emp => (
                          <option key={emp.EmpID} value={emp.EmpID}>{emp.EmpID} - {emp.FirstName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Inspected By</label>
                      <select className="add-sample-input" value={inspectedBy} onChange={e => setInspectedBy(e.target.value)}>
                        <option value="">Select Employee</option>
                        {employeeOptions.map(emp => (
                          <option key={emp.EmpID} value={emp.EmpID}>{emp.EmpID} - {emp.FirstName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Analyzed By</label>
                      <select className="add-sample-input" value={analyzedBy} onChange={e => setAnalyzedBy(e.target.value)}>
                        <option value="">Select Employee</option>
                        {employeeOptions.map(emp => (
                          <option key={emp.EmpID} value={emp.EmpID}>{emp.EmpID} - {emp.FirstName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Reviewed By</label>
                      <select className="add-sample-input" value={reviewedBy} onChange={e => setReviewedBy(e.target.value)}>
                        <option value="">Select Employee</option>
                        {employeeOptions.map(emp => (
                          <option key={emp.EmpID} value={emp.EmpID}>{emp.EmpID} - {emp.FirstName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Report By</label>
                      <select className="add-sample-input" value={reportBy} onChange={e => setReportBy(e.target.value)}>
                        <option value="">Select Employee</option>
                        {employeeOptions.map(emp => (
                          <option key={emp.EmpID} value={emp.EmpID}>{emp.EmpID} - {emp.FirstName}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                      <Button variant="primary">OK</Button>
                      <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
                    </div>
                  </div>

                  <div className="add-sample-col">
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div className="add-sample-field" style={{ flex: 1 }}>
                        <label className="add-sample-label" style={{ width: '100px' }}>QC Decision</label>
                        <select className="add-sample-input" value={qcDecision} onChange={e => setQcDecision(e.target.value)}>
                          <option value="A">Accepted</option>
                          <option value="R">Rejected</option>
                          <option value="CA">Conditionally Accepted</option>
                          <option value="CR">Conditionally Rejected</option>
                        </select>
                      </div>
                      <div className="add-sample-field" style={{ flex: 1 }}>
                        <label className="add-sample-label" style={{ width: '100px' }}>QC Remarks</label>
                        <input type="text" className="add-sample-input" value={qcRemarks} onChange={e => setQcRemarks(e.target.value)} />
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div className="add-sample-field" style={{ flex: 1 }}>
                        <label className="add-sample-label" style={{ width: '100px' }}>Accepted Qty</label>
                        <input type="text" className="add-sample-input" value={acceptedQty} onChange={e => setAcceptedQty(e.target.value)} />
                      </div>
                      <div className="add-sample-field" style={{ flex: 1 }}>
                        <label className="add-sample-label" style={{ width: '100px' }}>Rejected Qty</label>
                        <input type="text" className="add-sample-input" value={rejectedQty} onChange={e => setRejectedQty(e.target.value)} />
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div className="add-sample-field" style={{ flex: 1 }}>
                        <label className="add-sample-label" style={{ width: '100px' }}>Release Warehouse</label>
                        <input type="text" className="add-sample-input" value={releaseWarehouse} onChange={e => setReleaseWarehouse(e.target.value)} />
                      </div>
                      <div className="add-sample-field" style={{ flex: 1 }}>
                        <label className="add-sample-label" style={{ width: '100px' }}>Rejection Warehouse</label>
                        <input type="text" className="add-sample-input" value={rejectionWarehouse} onChange={e => setRejectionWarehouse(e.target.value)} />
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div className="add-sample-field" style={{ flex: 1 }}>
                        <label className="add-sample-label" style={{ width: '100px' }}>Accepted ITR</label>
                        <input type="text" className="add-sample-input" disabled value={acceptedITR} />
                      </div>
                      <div className="add-sample-field" style={{ flex: 1 }}>
                        <label className="add-sample-label" style={{ width: '100px' }}>Rejected ITR</label>
                        <input type="text" className="add-sample-input" disabled value={rejectedITR} />
                      </div>
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      {!selectedRecord ? (
                        <Button variant="primary" onClick={handleSaveQuality}>Save Quality Record</Button>
                      ) : (
                        <>
                          <Button variant="secondary">Release Sticker</Button>
                          <Button variant="secondary">Rejected Sticker</Button>
                          <Button variant="secondary">COA</Button>
                          <Button variant="secondary">QC Report</Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="add-sample-grid" style={{ marginBottom: '24px' }}>
                  <div className="add-sample-col">
                    <div className="add-sample-field">
                      <label className="add-sample-label">Item</label>
                      <input type="text" className="add-sample-input" disabled value={`${selectedRecord['Item Code'] || ''} - ${selectedRecord['Item Name'] || ''}`} />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Base Doc</label>
                      <input type="text" className="add-sample-input" disabled value={`${selectedRecord['Base Document No'] || ''} (${selectedRecord['BaseType'] || ''})`} />
                    </div>
                  </div>
                  
                  <div className="add-sample-col">
                    <div className="add-sample-field">
                      <label className="add-sample-label">QC Type</label>
                      <input type="text" className="add-sample-input" disabled value={selectedRecord['QC Type'] || ''} />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">QC Decision</label>
                      <input type="text" className="add-sample-input" disabled value={selectedRecord['QC Decision'] || 'Pending'} />
                    </div>
                  </div>
                </div>
                
                <h4 style={{ marginBottom: '12px', color: '#333' }}>Parameters</h4>
                <div className="add-sample-table-wrapper" style={{ border: 'none', boxShadow: 'none', marginBottom: '24px' }}>
                  <Table 
                    data={recordDetails}
                    columns={detailColumns}
                    isLoading={loadingDetails}
                    showActions={false}
                  />
                </div>

                <div className="add-sample-grid" style={{ marginBottom: '24px' }}>
                  <div className="add-sample-col">
                    <div className="add-sample-field">
                      <label className="add-sample-label">Sample By</label>
                      <input type="text" className="add-sample-input" disabled value={selectedRecord['Sample By Name'] ? `${selectedRecord['Sample By']} - ${selectedRecord['Sample By Name']}` : (selectedRecord['Sample By'] || '')} />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Inspected By</label>
                      <input type="text" className="add-sample-input" disabled value={selectedRecord['Inspected By Name'] ? `${selectedRecord['Inspected By']} - ${selectedRecord['Inspected By Name']}` : (selectedRecord['Inspected By'] || '')} />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Analyzed By</label>
                      <input type="text" className="add-sample-input" disabled value={selectedRecord['Analyzed By Name'] ? `${selectedRecord['Analyzed By']} - ${selectedRecord['Analyzed By Name']}` : (selectedRecord['Analyzed By'] || '')} />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Reviewed By</label>
                      <input type="text" className="add-sample-input" disabled value={selectedRecord['Reviewed By Name'] ? `${selectedRecord['Reviewed By']} - ${selectedRecord['Reviewed By Name']}` : (selectedRecord['Reviewed By'] || '')} />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Report By</label>
                      <input type="text" className="add-sample-input" disabled value={selectedRecord['Report By Name'] ? `${selectedRecord['Report By']} - ${selectedRecord['Report By Name']}` : (selectedRecord['Report By'] || '')} />
                    </div>
                  </div>

                  <div className="add-sample-col">
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div className="add-sample-field" style={{ flex: 1 }}>
                        <label className="add-sample-label" style={{ width: '100px' }}>Accepted Qty</label>
                        <input type="text" className="add-sample-input" disabled value={selectedRecord['Accepted Qty'] || ''} />
                      </div>
                      <div className="add-sample-field" style={{ flex: 1 }}>
                        <label className="add-sample-label" style={{ width: '100px' }}>Rejected Qty</label>
                        <input type="text" className="add-sample-input" disabled value={selectedRecord['Rejected Qty'] || ''} />
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div className="add-sample-field" style={{ flex: 1 }}>
                        <label className="add-sample-label" style={{ width: '100px' }}>Release Warehouse</label>
                        <input type="text" className="add-sample-input" disabled value={selectedRecord['Release Warehouse'] || ''} />
                      </div>
                      <div className="add-sample-field" style={{ flex: 1 }}>
                        <label className="add-sample-label" style={{ width: '100px' }}>Rejection Warehouse</label>
                        <input type="text" className="add-sample-input" disabled value={selectedRecord['Rejection Warehouse'] || ''} />
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div className="add-sample-field" style={{ flex: 1 }}>
                        <label className="add-sample-label" style={{ width: '100px' }}>Accepted ITR</label>
                        <input type="text" className="add-sample-input" disabled value={selectedRecord['Accepted ITR'] || ''} />
                      </div>
                      <div className="add-sample-field" style={{ flex: 1 }}>
                        <label className="add-sample-label" style={{ width: '100px' }}>Rejected ITR</label>
                        <input type="text" className="add-sample-input" disabled value={selectedRecord['Rejected ITR'] || ''} />
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <Button variant="secondary">Release Sticker</Button>
                      <Button variant="secondary">Rejected Sticker</Button>
                      <Button variant="secondary">COA</Button>
                      <Button variant="secondary">QC Report</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="dome-card-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px 0' }}>
          <h3 className="section-title">Quality Records</h3>
          <Button variant="primary" onClick={handleAddQuality}>
            Add Quality
          </Button>
        </div>

        <Table 
          data={data}
          columns={mainColumns}
          isLoading={loading}
          showActions={false}
          onRowClick={handleRowClick}
          totalEntries={totalRecords}
          currentPage={page}
          pageSize={limit}
          onPageChange={setPage}
          onItemsPerPageChange={setLimit}
        />
      </div>
    </div>
  );
};

export default QualityAssurance;
