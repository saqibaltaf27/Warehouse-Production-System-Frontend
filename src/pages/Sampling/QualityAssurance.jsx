import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Table from '../../global-components/Table/Table';
import Button from '../../global-components/Button/Button';
import ChooseFromList from '../../global-components/ChooseFromList/ChooseFromList';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { IconFileSpreadsheet } from '@tabler/icons-react';
import * as XLSX from 'xlsx';
import './Sampling.css';
import '../ProductionOrders/ProductionOrders.css';

const QualityAssurance = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [samplingNo, setSamplingNo] = useState('');
  
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
  const [warehouseOptions, setWarehouseOptions] = useState([]);
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
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [decisionOptions, setDecisionOptions] = useState([]);
  const [fromSample, setFromSample] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchQualityRecords = async (pageNum = 1, currentStatusFilter = statusFilter, search = debouncedSearch) => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/quality/quality-records`, {
        params: {
          page: pageNum,
          limit,
          ...(currentStatusFilter ? { status: currentStatusFilter } : {}),
          ...(search ? { search } : {}),
        }
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

  const fetchDecisionOptions = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/quality/quality-decisions`);
      if (res.data?.success) {
        const allowed = new Set(['A', 'R', 'CA', 'CR']);
        setDecisionOptions((res.data.data || []).filter((opt) => allowed.has(opt.value)));
        setStatusFilter((prev) => (allowed.has(prev) ? prev : ''));
      }
    } catch (err) {
      console.error("Error fetching quality decisions:", err);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/quality/warehouses`);
      if (res.data?.success) {
        setWarehouseOptions(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching warehouses:", err);
    }
  };

  const loadItem = async (val, label, preferredBatch = '', lineSampleQty = '', samplingNumber = '') => {
    setItemCode(val || '');
    setItemName(label || '');
    if (lineSampleQty !== '') setSampleQty(String(lineSampleQty));
    if (!val) {
      setSampleQty('');
      setTableData([]);
      setBatchOptions([]);
      setSelectedBatch('');
      setBatchQty('');
      setBatchMfgDate('');
      setBatchExpDate('');
      return;
    }

    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/quality/item-by-code`, {
        params: { itemCode: val, ...(samplingNumber ? { samplingNo: samplingNumber } : {}) }
      });
      if (res.data?.success) {
        const itemData = res.data.data || {};
        const masterName = res.data.itemName;
        if (masterName && masterName !== '*') setItemName(masterName);
        else if (label && label !== '*') setItemName(label);
        const fromLine = lineSampleQty !== '' ? String(lineSampleQty) : '';
        const fromSample = res.data.sampleQty != null && Number(res.data.sampleQty) !== 0
          ? String(res.data.sampleQty)
          : '';
        const fromMaster = itemData.U_SampleSize != null && itemData.U_SampleSize !== ''
          ? String(itemData.U_SampleSize)
          : '';
        setSampleQty(fromLine || fromSample || fromMaster);
        if (res.data.lines) {
          setTableData(res.data.lines.map(line => ({
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
          })));
        }
      }
    } catch (err) {
      console.error('Failed to fetch item details:', err);
      if (lineSampleQty === '') setSampleQty('');
      setTableData([]);
    }

    try {
      const batchRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/quality/item-batches`, { params: { itemCode: val } });
      if (batchRes.data?.success) {
        const batches = batchRes.data.data || [];
        setBatchOptions(batches);
        const match = preferredBatch
          ? batches.find(batch => batch.BatchSerial === preferredBatch)
          : null;
        const chosen = match || batches[0];
        if (chosen) {
          setSelectedBatch(chosen.BatchSerial);
          setBatchQty(chosen.Qty);
          setBatchMfgDate(chosen.MnfDate ? new Date(chosen.MnfDate).toISOString().split('T')[0] : '');
          setBatchExpDate(chosen.ExpDate ? new Date(chosen.ExpDate).toISOString().split('T')[0] : '');
        } else {
          setSelectedBatch(preferredBatch || '');
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
  };

  useEffect(() => {
    const docEntry = searchParams.get('docEntry');
    const mode = searchParams.get('mode');
    const returnSample = searchParams.get('fromSample') || '';
    const no = searchParams.get('samplingNo');
    const code = searchParams.get('itemCode');

    if (!docEntry && !no && !code) return;

    if (returnSample || no) setFromSample(returnSample || no);

    const clearParams = () => {
      const next = new URLSearchParams(searchParams);
      ['docEntry', 'mode', 'fromSample', 'samplingNo', 'itemCode', 'itemName', 'batch', 'sampleQty'].forEach((key) => next.delete(key));
      setSearchParams(next, { replace: true });
    };

    if (docEntry && mode === 'view') {
      (async () => {
        setLoadingDetails(true);
        setShowForm(true);
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/quality/quality-record/${docEntry}`);
          if (res.data?.success && res.data.data?.length) {
            const header = res.data.data[0];
            setSelectedRecord(header);
            setRecordDetails(res.data.data.filter((r) => r['Parameter Code'] || r['Parameter Name']));
            setSamplingNo(header['Sample Number'] ? String(header['Sample Number']) : returnSample || '');
          } else {
            toast.error('Quality result not found');
          }
        } catch (err) {
          console.error('Failed to open quality result:', err);
          toast.error('Failed to load quality result');
        } finally {
          setLoadingDetails(false);
          clearParams();
        }
      })();
      return;
    }

    setSelectedRecord(null);
    if (no) setSamplingNo(no);
    setShowForm(true);
    setInspectedBy((prev) => prev || getCurrentEmpId());
    if (code) {
      loadItem(
        code,
        searchParams.get('itemName') || '',
        searchParams.get('batch') || '',
        searchParams.get('sampleQty') || '',
        no || ''
      );
    }
    clearParams();
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchEquipments();
    fetchEmployees();
    fetchDecisionOptions();
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (!showForm || selectedRecord || inspectedBy || !employeeOptions.length) return;
    const currentEmpId = getCurrentEmpId();
    if (currentEmpId) setInspectedBy(currentEmpId);
  }, [showForm, selectedRecord, inspectedBy, employeeOptions, user]);

  useEffect(() => {
    fetchQualityRecords(page, statusFilter, debouncedSearch);
  }, [page, limit, statusFilter, debouncedSearch]);

  const handleRowClick = async (row) => {
    setSelectedRecord(row);
    setShowForm(true);
    setLoadingDetails(true);
    
    // Set editable fields for existing records
    setSampleBy(row['Sample By'] || '');
    setInspectedBy(row['Inspected By'] || '');
    setAnalyzedBy(row['Analyzed By'] || '');
    setReviewedBy(row['Reviewed By'] || '');
    setReportBy(row['Report By'] || '');
    
    let decCode = 'A';
    if (row['QC Decision'] === 'Accepted') decCode = 'A';
    else if (row['QC Decision'] === 'Rejected') decCode = 'R';
    else if (row['QC Decision'] === 'Conditionally Accepted') decCode = 'CA';
    else if (row['QC Decision'] === 'Conditionally Rejected') decCode = 'CR';
    else decCode = row['QC Decision'] || 'A';
    setQcDecision(decCode);
    
    setAcceptedQty(row['Accepted Qty'] !== null ? String(row['Accepted Qty']) : '');
    setRejectedQty(row['Rejected Qty'] !== null ? String(row['Rejected Qty']) : '');
    setReleaseWarehouse(row['Release Warehouse'] || '');
    setRejectionWarehouse(row['Rejection Warehouse'] || '');
    setAcceptedITR(row['Accepted ITR'] || '');
    setRejectedITR(row['Rejected ITR'] || '');

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

  const getCurrentEmpId = () => {
    const raw = user?.empId || user?.EmpID || user?.id || user?.emp_id || '';
    if (!raw) return '';
    const match = employeeOptions.find((e) => String(e.EmpID) === String(raw));
    return match ? String(match.EmpID) : String(raw);
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
    setInspectedBy(getCurrentEmpId());
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

  const leaveQualityForm = () => {
    const returnTo = fromSample || (samplingNo && !selectedRecord ? samplingNo : '');
    if (returnTo) {
      setFromSample('');
      navigate(`/sampling?tab=qc&openSample=${encodeURIComponent(returnTo)}`);
      return;
    }
    setShowForm(false);
  };

  const getDecisionLabel = (code) => {
    const labels = {
      A: 'Accepted',
      R: 'Rejected',
      CA: 'Conditionally Accepted',
      CR: 'Conditionally Rejected',
    };
    return labels[code] || code || 'Updated';
  };

  const hasPendingTestingResults = (lines = [], justSavedItemCode = '', justSavedBatch = '') => {
    const decided = new Set(['A', 'CA', 'CR', 'R', 'C']);
    return (lines || []).some((line) => {
      const status = String(line.U_status || line.U_Status || '').trim();
      if (!status || decided.has(status)) return false;
      if (!(status === 'UI' || status === 'S')) return false;
      const hasQcRequest = Boolean(String(line.U_RequestNo || '').trim());
      if (!hasQcRequest) return false;
      // Exclude the line we just decided (in case DB read is slightly stale)
      const sameItem =
        String(line.U_ItemCode || '').trim() === String(justSavedItemCode || '').trim();
      const sameBatch =
        String(line.U_Batch || '').trim() === String(justSavedBatch || '').trim();
      if (sameItem && (!justSavedBatch || sameBatch)) return false;
      return true;
    });
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
        samplingNo: samplingNo || null,
        empId: user ? (user.empId || user.EmpID || user.id || user.emp_id) : null,
        empName: user ? (user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.username) : null,
      };

      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/quality/record`, payload);
      if (res.data?.success) {
        const decisionLabel = getDecisionLabel(qcDecision);
        const itemLabel = itemName || itemCode || 'Item';
        const returnTo = fromSample || samplingNo || '';

        if (!returnTo) {
          toast.success(`${itemLabel} has been ${decisionLabel}`);
          setShowForm(false);
          fetchQualityRecords(1);
          return;
        }

        let stillPending = false;
        try {
          const sampleRes = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/sampling/saved-sample/${returnTo}`
          );
          if (sampleRes.data?.success) {
            stillPending = hasPendingTestingResults(
              sampleRes.data.data?.lines || [],
              itemCode,
              selectedBatch
            );
          }
        } catch (checkErr) {
          console.error('Failed to check remaining sample lines:', checkErr);
          stillPending = true; // safer: return to sample so user can continue
        }

        setFromSample('');
        const toastMessage = stillPending
          ? `${itemLabel} has been ${decisionLabel}. Add the next testing result.`
          : `${itemLabel} has been ${decisionLabel}. All testing results are complete.`;
        // App Toaster + handoff for tab switch (qc-test-report unmounts this page)
        toast.success(toastMessage, { duration: 4500, id: 'sampling-qc-decision' });
        sessionStorage.setItem('wps_sampling_toast', toastMessage);
        if (stillPending) {
          navigate(`/sampling?tab=qc&openSample=${encodeURIComponent(returnTo)}`);
        } else {
          navigate('/sampling?tab=qc');
        }
      } else {
        toast.error(res.data?.message || "Failed to save quality record");
      }
    } catch (err) {
      console.error("Failed to save quality record:", err);
      toast.error(err.response?.data?.message || "Failed to save quality record");
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/quality/quality-records`, {
        params: {
          page: 1,
          limit: Math.max(totalRecords || 0, 1000),
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
        },
      });
      if (!res.data?.success) {
        toast.error(res.data?.message || 'Failed to export QC test reports');
        return;
      }
      const rows = (res.data.data || []).map((row) => ({
        'Doc Num': row['Document Number'] ?? '',
        'Sample Number': row['Sample Number'] ?? '',
        'QC Type': row['QC Type'] ?? '',
        Type: row.Type ?? '',
        'Base Type': row.BaseType ?? '',
        'Item Code': row['Item Code'] ?? '',
        'Item Name': row['Item Name'] ?? '',
        'Sample Qty': row['Sample Qty'] ?? '',
        'QC Decision': row['QC Decision'] ?? '',
        Batch: row['Batch/Serial'] ?? '',
        'Accepted Qty': row['Accepted Qty'] ?? '',
        'Rejected Qty': row['Rejected Qty'] ?? '',
      }));
      if (!rows.length) {
        toast.error('No records to export');
        return;
      }
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'QC Test Report');
      XLSX.writeFile(workbook, `QC_Test_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(`Exported ${rows.length} record(s)`);
    } catch (err) {
      console.error('Export Excel failed:', err);
      toast.error(err?.response?.data?.message || err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const formatEmployeeDisplay = (id, name) => {
    if (!id && !name) return '';
    const resolvedName =
      name ||
      employeeOptions.find((e) => String(e.EmpID) === String(id))?.FirstName ||
      '';
    if (id && resolvedName) return `${id} - ${resolvedName}`;
    return resolvedName || String(id || '');
  };

  const mainColumns = [
    { key: 'Document Number', header: 'Doc Num' },
    { key: 'Sample Number', header: 'Sample Number' },
    { key: 'QC Type', header: 'QC Type' },
    { key: 'Type', header: 'Type' },
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
        <div className="qc-param-text" title={row['Action'] || ''}>
          {row['Action'] || '\u00A0'}
        </div>
      )
    },
    { 
      key: 'Criteria', 
      header: 'Criteria',
      render: (row) => (
        <div className="qc-param-text" title={row['Criteria'] || ''}>
          {row['Criteria'] || '\u00A0'}
        </div>
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
          className="qa-cell-input"
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
          className="qa-cell-input"
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
          className="qa-cell-input"
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
          className="qa-cell-input"
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
          className="qa-cell-input"
        />
      )
    }
  ];

  const viewDetailColumns = [
    { key: 'Parameter Line', header: '#' },
    { key: 'Parameter Code', header: 'Parameter Code' },
    { key: 'Parameter Name', header: 'Parameter Name' },
    {
      key: 'Action',
      header: 'Action',
      render: (row) => (
        <div className="qc-param-text" title={row['Action'] || ''}>{row['Action'] || '\u00A0'}</div>
      ),
    },
    {
      key: 'Criteria',
      header: 'Criteria',
      render: (row) => (
        <div className="qc-param-text" title={row['Criteria'] || ''}>{row['Criteria'] || '\u00A0'}</div>
      ),
    },
    { key: 'Equipment Code', header: 'Equipment Code' },
    { key: 'Equipment Name', header: 'Equipment Name' },
    { key: 'UOM', header: 'UOM' },
    { key: 'Std Value', header: 'Std Value' },
    { key: 'Min Value', header: 'Min Value' },
    { key: 'Max Value', header: 'Max Value' },
    {
      key: 'Type',
      header: 'Type',
      render: (row) => (row.Type === 'P' || row['Parameter Type'] === 'P' ? 'P - Process' : 'M - Material'),
    },
    { key: 'Observed Value 1', header: 'Observed Value 1' },
    { key: 'Observed Value 2', header: 'Observed Value 2' },
    { key: 'Observed Value 3', header: 'Observed Value 3' },
  ];

  return (
    <div className="qc-sampling-container fade-in-up">
      
      {showForm && (
        <div className="add-sample-wrapper">
          <div className="add-sample-header section-header-flex">
            <div className="qc-sampling-actions">
              <Button variant="outline" onClick={leaveQualityForm}>Back</Button>
              <h4 className="add-sample-title">
                {selectedRecord
                  ? `View Quality Details: ${selectedRecord['Document Number']}`
                  : `Add Quality Test${samplingNo ? ` — ${samplingNo}` : ''}`}
              </h4>
            </div>
            </div>

          <div className="add-sample-body">
            {!selectedRecord ? (
              <div className="add-sample-form">
                <div className="add-sample-grid qa-section-gap">
                  <div className="add-sample-col">
                    <div className="add-sample-field">
                      <label className="add-sample-label">Sampling No</label>
                      <input type="text" className="add-sample-input" value={samplingNo} disabled />
                    </div>
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
                      <div className="qa-picker">
                        <ChooseFromList
                          title="Select Item"
                          apiEndpoint={`/quality/items`}
                          columns={[
                            { key: 'ItemCode', header: 'Item Code' },
                            { key: 'ItemName', header: 'Item Name' }
                          ]}
                          valueKey="ItemCode"
                          labelKey="ItemName"
                          value={itemCode}
                          displayValue={itemCode}
                          onChange={(val, label) => loadItem(val, label)}
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

               

                <div className="add-sample-table-wrapper qa-plain-table">
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
                    
                  </div>

                  <div className="add-sample-col">
                    <div className="qa-pair">
                      <div className="add-sample-field qa-pair-field">
                        <label className="add-sample-label qa-pair-label">QC Decision</label>
                        <select className="add-sample-input" value={qcDecision} onChange={e => setQcDecision(e.target.value)}>
                          <option value="A">Accepted</option>
                          <option value="R">Rejected</option>
                          <option value="CA">Conditionally Accepted</option>
                          <option value="CR">Conditionally Rejected</option>
                        </select>
                      </div>
                      <div className="add-sample-field qa-pair-field">
                        <label className="add-sample-label qa-pair-label">QC Remarks</label>
                        <input type="text" className="add-sample-input" value={qcRemarks} onChange={e => setQcRemarks(e.target.value)} />
                      </div>
                    </div>
                    
                    <div className="qa-pair">
                      <div className="add-sample-field qa-pair-field">
                        <label className="add-sample-label qa-pair-label">Accepted Qty</label>
                        <input type="text" className="add-sample-input" value={acceptedQty} onChange={e => setAcceptedQty(e.target.value)} />
                      </div>
                      <div className="add-sample-field qa-pair-field">
                        <label className="add-sample-label qa-pair-label">Rejected Qty</label>
                        <input type="text" className="add-sample-input" value={rejectedQty} onChange={e => setRejectedQty(e.target.value)} />
                      </div>
                    </div>
                    
                    <div className="qa-pair">
                      <div className="add-sample-field qa-pair-field">
                        <label className="add-sample-label qa-pair-label">Release Warehouse</label>
                        <select className="add-sample-input" value={releaseWarehouse} onChange={e => setReleaseWarehouse(e.target.value)}>
                          <option value="">Select Warehouse</option>
                          {warehouseOptions.map(whs => (
                            <option key={whs.WhsCode} value={whs.WhsCode}>{whs.WhsCode} - {whs.WhsName}</option>
                          ))}
                        </select>
                      </div>
                      <div className="add-sample-field qa-pair-field">
                        <label className="add-sample-label qa-pair-label">Rejection Warehouse</label>
                        <select className="add-sample-input" value={rejectionWarehouse} onChange={e => setRejectionWarehouse(e.target.value)}>
                          <option value="">Select Warehouse</option>
                          {warehouseOptions.map(whs => (
                            <option key={whs.WhsCode} value={whs.WhsCode}>{whs.WhsCode} - {whs.WhsName}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="qa-pair">
                      <div className="add-sample-field qa-pair-field">
                        <label className="add-sample-label qa-pair-label">Accepted ITR</label>
                        <input type="text" className="add-sample-input" disabled value={acceptedITR} />
                      </div>
                      <div className="add-sample-field qa-pair-field">
                        <label className="add-sample-label qa-pair-label">Rejected ITR</label>
                        <input type="text" className="add-sample-input" disabled value={rejectedITR} />
                      </div>
                    </div>

                    <div className="qa-actions qa-actions-end">
                      <Button variant="primary" onClick={handleSaveQuality}>
                        Create Quality Test
                      </Button>
                      <Button variant="secondary" onClick={leaveQualityForm}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="add-sample-grid qa-section-gap">
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
                
                <h4 className="qa-section-title">Parameters</h4>
                <div className="add-sample-table-wrapper qa-plain-table">
                  <Table 
                    data={recordDetails}
                    columns={viewDetailColumns}
                    isLoading={loadingDetails}
                    showActions={false}
                  />
                </div>

                <div className="add-sample-grid qa-section-gap">
                  <div className="add-sample-col">
                    <div className="add-sample-field">
                      <label className="add-sample-label">Sample By</label>
                      <input type="text" className="add-sample-input" disabled value={formatEmployeeDisplay(selectedRecord['Sample By'], selectedRecord['Sample By Name'])} />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Inspected By</label>
                      <input type="text" className="add-sample-input" disabled value={formatEmployeeDisplay(selectedRecord['Inspected By'], selectedRecord['Inspected By Name'])} />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Analyzed By</label>
                      <input type="text" className="add-sample-input" disabled value={formatEmployeeDisplay(selectedRecord['Analyzed By'], selectedRecord['Analyzed By Name'])} />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Reviewed By</label>
                      <input type="text" className="add-sample-input" disabled value={formatEmployeeDisplay(selectedRecord['Reviewed By'], selectedRecord['Reviewed By Name'])} />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Report By</label>
                      <input type="text" className="add-sample-input" disabled value={formatEmployeeDisplay(selectedRecord['Report By'], selectedRecord['Report By Name'])} />
                    </div>
                  </div>

                  <div className="add-sample-col">
                    <div className="qa-pair">
                      <div className="add-sample-field qa-pair-field">
                        <label className="add-sample-label qa-pair-label">Accepted Qty</label>
                        <input type="text" className="add-sample-input" disabled value={selectedRecord['Accepted Qty'] || ''} />
                      </div>
                      <div className="add-sample-field qa-pair-field">
                        <label className="add-sample-label qa-pair-label">Rejected Qty</label>
                        <input type="text" className="add-sample-input" disabled value={selectedRecord['Rejected Qty'] || ''} />
                      </div>
                    </div>
                    
                    <div className="qa-pair">
                      <div className="add-sample-field qa-pair-field">
                        <label className="add-sample-label qa-pair-label">Release Warehouse</label>
                        <input type="text" className="add-sample-input" disabled value={selectedRecord['Release Warehouse'] || ''} />
                      </div>
                      <div className="add-sample-field qa-pair-field">
                        <label className="add-sample-label qa-pair-label">Rejection Warehouse</label>
                        <input type="text" className="add-sample-input" disabled value={selectedRecord['Rejection Warehouse'] || ''} />
                      </div>
                    </div>
                    
                    <div className="qa-pair">
                      <div className="add-sample-field qa-pair-field">
                        <label className="add-sample-label qa-pair-label">Accepted ITR</label>
                        <input type="text" className="add-sample-input" disabled value={selectedRecord['Accepted ITR'] || ''} />
                      </div>
                      <div className="add-sample-field qa-pair-field">
                        <label className="add-sample-label qa-pair-label">Rejected ITR</label>
                        <input type="text" className="add-sample-input" disabled value={selectedRecord['Rejected ITR'] || ''} />
                      </div>
                    </div>
                    
               
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!showForm && (
      <div className="dome-card-wrapper qa-card">
        <div className="po-table-header">
          <Button variant="primary" onClick={handleAddQuality}>
            Add Test Report
          </Button>
        </div>

        <div className="po-filter-toolbar-card">
          <div className="po-filter-toolbar-grid">
            <div className="po-filter-item po-filter-search-box">
              <label className="po-filter-label">Search</label>
              <input
                type="text"
                placeholder="Sample no, doc no, item code or name"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
                className="po-filter-search-input"
              />
            </div>
            <div className="po-filter-item">
              <label className="po-filter-label">QC Decision</label>
              <select
                className="po-filter-date-input"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Decisions</option>
                {decisionOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="po-filter-item">
              <label className="po-filter-label">&nbsp;</label>
              <Button
                type="button"
                variant="success"
                className="po-export-btn"
                onClick={handleExportExcel}
                disabled={exporting || loading}
                title="Export Excel"
                icon={<IconFileSpreadsheet size={16} />}
              >
                {exporting ? 'Exporting...' : 'Export Excel'}
              </Button>
            </div>
          </div>
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
      )}
    </div>
  );
};

export default QualityAssurance;
