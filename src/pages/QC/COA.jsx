import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import toast, { Toaster } from 'react-hot-toast';
import { IconArrowLeft, IconEdit, IconEye, IconPlus, IconPrinter } from '@tabler/icons-react';
import { API_ENDPOINTS } from '../../apis/endpoints';
import { axiosInstance } from '../../apis/axiosinstance';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../context/permissioncheck';
import Button from '../../global-components/Button/Button';
import Table from '../../global-components/Table/Table';
import './COA.css';
import '../Sampling/Sampling.css';

const getTodayFormatted = () => {
  const date = new Date();
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
};

const getTodayFormattedUpper = () => {
  const date = new Date();
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase().replace(/-/g, ' ');
};

const emptyForm = () => ({
  coaNo: null,
  status: 'Draft',
  formNo: '',
  issueDate: getTodayFormatted(),
  itemCode: '',
  itemName: '',
  productTop: '',
  productLine: '',
  composition: '',
  product: '',
  catNo: '',
  batch: '',
  packSize: '',
  batchSize: '',
  mfgDate: '',
  sopNo: '',
  expDate: '',
  processStage: '',
  revisionNo: '',
  reg: '',
  dateReported: '',
  tests: [
    { id: 1, tests: '', specifications: '', analyzedBy: '', result: '', conclusion: '' }
  ],
  remarks: '',
  analyzedBy: { name: 'Husnain', title: 'QC Analyst', date: getTodayFormattedUpper() },
  checkedBy: { name: 'Saba Abbas', title: 'QC Officer', date: getTodayFormattedUpper() },
  approvedBy: { name: 'Madiha Rashid', title: 'QC Manager', date: getTodayFormattedUpper() }
});

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const COA_PRINT_CSS = `
  @page { size: A4 portrait; margin: 5mm; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    color: #333;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .coa-document {
    width: 100%;
    border: 1px solid #333;
    font-family: Arial, sans-serif;
    font-size: 13px;
    background: #fff;
  }
  .coa-header { display: flex; border-bottom: 1px solid #333; }
  .coa-logo-section {
    width: 15%;
    border-right: 1px solid #333;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
  }
  .coa-logo-section img { height: 54px; object-fit: contain; }
  .coa-title-section {
    width: 65%;
    text-align: center;
    padding: 15px;
    border-right: 1px solid #333;
  }
  .coa-title-section h2,
  .coa-title-section h3,
  .coa-title-section h4 { margin: 5px 0; }
  .coa-title-section h2 { font-size: 16px; }
  .coa-title-section h3,
  .coa-title-section h4 { font-size: 14px; }
  .coa-form-info {
    width: 20%;
    padding: 10px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    font-size: 11px;
  }
  .coa-form-row { display: flex; margin-bottom: 5px; }
  .coa-form-row label { white-space: nowrap; margin-right: 5px; }
  .coa-details-section { padding: 15px; border-bottom: 1px solid #333; }
  .coa-detail-row {
    display: flex;
    margin-bottom: 8px;
    align-items: center;
    gap: 8px;
    width: 100%;
  }
  .coa-detail-row label {
    font-weight: bold;
    width: 120px;
    flex: 0 0 120px;
    white-space: nowrap;
  }
  .coa-detail-value { flex: 1; min-width: 0; white-space: pre-wrap; }
  .coa-grid-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 28px;
    margin-top: 12px;
  }
  .coa-table-section { width: 100%; padding: 20px 20px 0; }
  .coa-table {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
  }
  .coa-table th,
  .coa-table td {
    border: 1px solid #333;
    padding: 4px;
    text-align: center;
    vertical-align: middle;
    white-space: pre-wrap;
  }
  .coa-table th {
    font-weight: bold;
    text-transform: uppercase;
    font-size: 11px;
  }
  .coa-col-sn { width: 5%; }
  .coa-col-tests { width: 25%; }
  .coa-col-specs { width: 30%; }
  .coa-col-analyzed { width: 13%; }
  .coa-col-result { width: 13%; }
  .coa-col-conclusion { width: 14%; }
  .coa-remarks-section {
    display: flex;
    border-bottom: 1px solid #333;
    padding: 0 20px;
  }
  .coa-remarks-label {
    font-weight: bold;
    padding: 10px;
    width: 150px;
    border-right: 1px solid #333;
    display: flex;
    align-items: center;
  }
  .coa-remarks-input { flex: 1; padding: 10px; white-space: pre-wrap; }
  .coa-signatures-section { display: flex; border-bottom: 1px solid #333; }
  .coa-signature-block {
    flex: 1;
    border-right: 1px solid #333;
    text-align: center;
    padding: 10px;
  }
  .coa-signature-block:last-child { border-right: none; }
  .coa-sig-header { font-weight: bold; margin-bottom: 10px; }
  .coa-sig-line { margin-bottom: 5px; }
  .coa-footer-status {
    text-align: center;
    padding: 15px;
    font-weight: bold;
    font-size: 16px;
  }
`;

const buildCoaPrintHtml = (data) => {
  const tests = Array.isArray(data.tests) && data.tests.length
    ? data.tests
    : [{ tests: '', specifications: '', analyzedBy: '', result: '', conclusion: '' }];
  const testRows = tests.map((t, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escapeHtml(t.tests)}</td>
      <td>${escapeHtml(t.specifications)}</td>
      <td>${escapeHtml(t.analyzedBy)}</td>
      <td>${escapeHtml(t.result)}</td>
      <td>${escapeHtml(t.conclusion)}</td>
    </tr>
  `).join('');
  const logoUrl = `${window.location.origin}/images/ldslogo.png`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Certificate of Analysis</title>
  <style>${COA_PRINT_CSS}</style>
</head>
<body>
  <div class="coa-document">
    <div class="coa-header">
      <div class="coa-logo-section">
        <img src="${logoUrl}" alt="LDS Logo" />
      </div>
      <div class="coa-title-section">
        <h2>LAB DIAGNOSTIC SYSTEMS (SMC) PVT LTD.</h2>
        <h3>QUALITY CONTROL LABORATORY</h3>
        <h4>CERTIFICATE OF ANALYSIS FOR FINISHED PRODUCT</h4>
      </div>
      <div class="coa-form-info">
        <div class="coa-form-row">
          <label>Issue Date:</label>
          <span>${escapeHtml(data.issueDate)}</span>
        </div>
      </div>
    </div>
    <div class="coa-details-section">
      <div class="coa-detail-row">
        <label>PRODUCT:</label>
        <div class="coa-detail-value">${escapeHtml(data.productTop)}</div>
      </div>
      <div class="coa-detail-row">
        <label>COMPOSITION:</label>
        <div class="coa-detail-value">${escapeHtml(data.composition)}</div>
      </div>
      <div class="coa-grid-details">
        <div>
          <div class="coa-detail-row"><label>PRODUCT</label><div class="coa-detail-value">${escapeHtml(data.product)}</div></div>
          <div class="coa-detail-row"><label>BATCH:</label><div class="coa-detail-value">${escapeHtml(data.batch)}</div></div>
          <div class="coa-detail-row"><label>BATCH SIZE:</label><div class="coa-detail-value">${escapeHtml(data.batchSize)}</div></div>
          <div class="coa-detail-row"><label>SOP NO.:</label><div class="coa-detail-value">${escapeHtml(data.sopNo)}</div></div>
          <div class="coa-detail-row"><label>PROCESS STAGE:</label><div class="coa-detail-value">${escapeHtml(data.processStage)}</div></div>
          <div class="coa-detail-row"><label>REG:</label><div class="coa-detail-value">${escapeHtml(data.reg)}</div></div>
        </div>
        <div>
          <div class="coa-detail-row"><label>CAT No:</label><div class="coa-detail-value">${escapeHtml(data.catNo)}</div></div>
          <div class="coa-detail-row"><label>PACK SIZE:</label><div class="coa-detail-value">${escapeHtml(data.packSize)}</div></div>
          <div class="coa-detail-row"><label>MFG DATE:</label><div class="coa-detail-value">${escapeHtml(data.mfgDate)}</div></div>
          <div class="coa-detail-row"><label>EXP DATE:</label><div class="coa-detail-value">${escapeHtml(data.expDate)}</div></div>
          <div class="coa-detail-row"><label>REVISION NO.:</label><div class="coa-detail-value">${escapeHtml(data.revisionNo)}</div></div>
          <div class="coa-detail-row"><label>DATE REPORTED:</label><div class="coa-detail-value">${escapeHtml(data.dateReported)}</div></div>
        </div>
      </div>
    </div>
    <div class="coa-table-section">
      <table class="coa-table">
        <thead>
          <tr>
            <th class="coa-col-sn">S.#</th>
            <th class="coa-col-tests">TESTS</th>
            <th class="coa-col-specs">SPECIFICATIONS</th>
            <th class="coa-col-analyzed">ANALYZED BY</th>
            <th class="coa-col-result">RESULT</th>
            <th class="coa-col-conclusion">CONCLUSION</th>
          </tr>
        </thead>
        <tbody>${testRows}</tbody>
      </table>
    </div>
    <div class="coa-remarks-section">
      <div class="coa-remarks-label">REMARKS</div>
      <div class="coa-remarks-input">${escapeHtml(data.remarks)}</div>
    </div>
    <div class="coa-signatures-section">
      <div class="coa-signature-block">
        <div class="coa-sig-header">ANALYZED BY</div>
        <div class="coa-sig-line">${escapeHtml(data.analyzedBy?.name)}</div>
        <div class="coa-sig-line">${escapeHtml(data.analyzedBy?.title)}</div>
        <div class="coa-sig-line">${escapeHtml(data.analyzedBy?.date)}</div>
      </div>
      <div class="coa-signature-block">
        <div class="coa-sig-header">CHECKED BY</div>
        <div class="coa-sig-line">${escapeHtml(data.checkedBy?.name)}</div>
        <div class="coa-sig-line">${escapeHtml(data.checkedBy?.title)}</div>
        <div class="coa-sig-line">${escapeHtml(data.checkedBy?.date)}</div>
      </div>
      <div class="coa-signature-block">
        <div class="coa-sig-header">APPROVED BY</div>
        <div class="coa-sig-line">${escapeHtml(data.approvedBy?.name)}</div>
        <div class="coa-sig-line">${escapeHtml(data.approvedBy?.title)}</div>
        <div class="coa-sig-line">${escapeHtml(data.approvedBy?.date)}</div>
      </div>
    </div>
    <div class="coa-footer-status">APPROVED</div>
  </div>
</body>
</html>`;
};

const printCoaData = (data) => {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  // Chrome prints blank from 0x0 iframes — keep real page size, just hide it.
  iframe.style.cssText = 'position:fixed;left:0;top:0;width:210mm;height:297mm;border:0;opacity:0;pointer-events:none;z-index:-1;';
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const frameDoc = frameWindow.document;
  frameDoc.open();
  frameDoc.write(buildCoaPrintHtml(data));
  frameDoc.close();

  const cleanup = () => {
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
  };

  const triggerPrint = () => {
    try {
      frameWindow.focus();
      frameWindow.print();
    } finally {
      setTimeout(cleanup, 1000);
    }
  };

  const images = Array.from(frameDoc.images || []);
  if (!images.length) {
    setTimeout(triggerPrint, 50);
    return;
  }

  let remaining = images.length;
  const done = () => {
    remaining -= 1;
    if (remaining <= 0) setTimeout(triggerPrint, 50);
  };
  images.forEach((img) => {
    if (img.complete) done();
    else {
      img.onload = done;
      img.onerror = done;
    }
  });
};

const COA = () => {
  const { user } = useAuth();
  const { hasChildPermission } = usePermission();
  const [batchOptions, setBatchOptions] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState('create'); // create | edit | view
  const [isSaving, setIsSaving] = useState(false);
  const [reports, setReports] = useState([]);
  const [isFetchingReports, setIsFetchingReports] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalReports, setTotalReports] = useState(0);

  const isReadOnly = mode === 'view';

  const canGenerate = hasChildPermission('QC', 'Certificate of Analysis', 'Can Generate');
  const canEdit = hasChildPermission('QC', 'Certificate of Analysis', 'Can edit');

  const getUserMeta = () => ({
    createdBy: user?.empId || user?.EmpID || user?.id || user?.emp_id || 0,
    createdByName: user?.FirstName
      ? `${user.FirstName}${user.LastName ? ` ${user.LastName}` : ''}`.trim()
      : (user?.name || user?.Name || null)
  });

  const fetchReports = async (pageOverride = page, limitOverride = limit) => {
    try {
      setIsFetchingReports(true);
      const res = await axiosInstance.get(API_ENDPOINTS.QC.LIST_COA_REPORTS, {
        params: { page: pageOverride, limit: limitOverride },
        skipGlobalLoading: true
      });
      if (res.data.success) {
        setReports(res.data.data || []);
        setTotalReports(res.data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching COA reports:', error);
    } finally {
      setIsFetchingReports(false);
    }
  };

  useEffect(() => {
    fetchReports(page, limit);
  }, [page, limit]);

  const handleInputChange = (e, field, subField = null) => {
    if (isReadOnly) return;
    const { value } = e.target;
    if (subField) {
      setFormData({
        ...formData,
        [field]: { ...formData[field], [subField]: value }
      });
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handleTestChange = (index, field, value) => {
    if (isReadOnly) return;
    const newTests = [...formData.tests];
    newTests[index][field] = value;
    setFormData({ ...formData, tests: newTests });
  };

  const addTestRow = () => {
    if (isReadOnly) return;
    setFormData(prev => ({
      ...prev,
      tests: [...prev.tests, { id: prev.tests.length + 1, tests: '', specifications: '', analyzedBy: '', result: '', conclusion: '' }]
    }));
  };

  const handleAutoResize = (el) => {
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  };

  const fetchProducts = async (inputValue) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${API_ENDPOINTS.COMPLAINTS.LOOKUP_ITEMS}?search=${inputValue}&limit=100&type=FG`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        return data.data.map(item => ({
          value: item.ItemCode,
          label: `${item.ItemCode} - ${item.ItemName}`,
          itemName: item.ItemName,
          productLine: item.U_Prod_line
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
  };

  const fetchUsedBatches = async (itemCode) => {
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.QC.USED_COA_BATCHES, {
        params: { itemCode },
        skipGlobalLoading: true
      });
      if (res.data.success) {
        return (res.data.data || []).map((b) => String(b));
      }
    } catch (error) {
      console.error('Error fetching used COA batches:', error);
    }
    return [];
  };

  const fetchProductDetails = async (itemCode, productLineStr) => {
    if (!itemCode) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${API_ENDPOINTS.COMPLAINTS.COA_PRODUCT_DETAILS(itemCode)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      let presetTests = formData.tests;
      
      try {
        const templateRes = await axiosInstance.get(API_ENDPOINTS.QC.GET_TEMPLATE(itemCode), {
          skipGlobalLoading: true
        });
        if (templateRes.data.success && templateRes.data.data) {
          const parsedTests = JSON.parse(templateRes.data.data);
          presetTests = parsedTests.map((t, i) => ({
            id: i + 1,
            tests: t.test || '',
            specifications: t.specification || '',
            analyzedBy: '',
            result: t.result || '',
            conclusion: ''
          }));
        }
      } catch (err) {
        console.error('Error fetching dynamic template:', err);
      }

      if (data.success && data.data) {
        const details = data.data;
        const allBatches = Array.isArray(details.batches) ? details.batches : [];
        const usedBatches = await fetchUsedBatches(itemCode);
        // Keep current batch available when editing the same COA
        const keepBatch = mode === 'edit' || mode === 'view' ? formData.batch : '';
        const availableBatches = allBatches.filter((b) => {
          const batchNo = String(b?.batch || '');
          if (!batchNo) return false;
          if (keepBatch && batchNo === String(keepBatch)) return true;
          return !usedBatches.includes(batchNo);
        });
        const firstBatch = availableBatches[0];
        setBatchOptions(availableBatches);

        setFormData(prev => ({
          ...prev,
          product: details['PRODUCT'] || '',
          batch: firstBatch?.batch || '',
          batchSize: firstBatch?.batchSize || '',
          sopNo: firstBatch?.bmrNo || '',
          processStage: details['PROCESS STAGE'] || '',
          catNo: details['CAT NO.'] || '',
          packSize: details['PACK SIZE'] || '',
          mfgDate: firstBatch ? (formatDate(firstBatch.mfgDate) || '') : '',
          expDate: firstBatch ? (formatDate(firstBatch.expDate) || '') : '',
          dateReported: formatDate(details['DATE REPORTED']) || '',
          composition: details['COMPOSITION'] || prev.composition,
          reg: details['REG'] || prev.reg,
          revisionNo: details['REVISION NO.'] || prev.revisionNo,
          tests: presetTests,
          remarks: prev.remarks
        }));
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
    }
  };

  const buildPayload = (status) => {
    const userMeta = getUserMeta();
    return {
      coaNo: formData.coaNo,
      status,
      formNo: formData.formNo,
      issueDate: formData.issueDate,
      itemCode: formData.itemCode || selectedProduct?.value || '',
      itemName: formData.itemName || selectedProduct?.itemName || '',
      productTop: formData.productTop,
      productLine: formData.productLine,
      composition: formData.composition,
      product: formData.product,
      catNo: formData.catNo,
      batchNo: formData.batch,
      packSize: formData.packSize,
      batchSize: formData.batchSize,
      mfgDate: formData.mfgDate,
      expDate: formData.expDate,
      sopNo: formData.sopNo,
      processStage: formData.processStage,
      revisionNo: formData.revisionNo,
      regNo: formData.reg,
      dateReported: formData.dateReported,
      remarks: formData.remarks,
      analyzedBy: formData.analyzedBy,
      checkedBy: formData.checkedBy,
      approvedBy: formData.approvedBy,
      tests: formData.tests,
      ...userMeta,
      updatedBy: userMeta.createdBy,
      updatedByName: userMeta.createdByName
    };
  };

  const handleSave = async (status) => {
    if (isReadOnly) return;
    if (!formData.itemCode && !selectedProduct?.value) {
      toast.error('Please select a product first.');
      return;
    }

    try {
      setIsSaving(true);
      const res = await axiosInstance.post(API_ENDPOINTS.QC.SAVE_COA_REPORT, buildPayload(status), {
        skipGlobalLoading: true
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Saved successfully');
        handleCloseForm();
        if (page !== 1) {
          setPage(1);
        } else {
          fetchReports(1, limit);
        }
      } else {
        toast.error(res.data.message || 'Failed to save COA');
      }
    } catch (error) {
      console.error('Error saving COA:', error);
      toast.error('An error occurred while saving the COA');
    } finally {
      setIsSaving(false);
    }
  };

  const mapReportToForm = (data) => ({
    coaNo: data.COA_No,
    status: data.Status === 'Generated' ? 'Generated' : 'Draft',
    formNo: data.FormNo || '',
    issueDate: data.IssueDate || getTodayFormatted(),
    itemCode: data.ItemCode || '',
    itemName: data.ItemName || '',
    productTop: data.ProductTop || '',
    productLine: data.ProductLine || '',
    composition: data.Composition || '',
    product: data.Product || '',
    catNo: data.CatNo || '',
    batch: data.BatchNo || '',
    packSize: data.PackSize || '',
    batchSize: data.BatchSize || '',
    mfgDate: data.MfgDate || '',
    sopNo: data.SopNo || '',
    expDate: data.ExpDate || '',
    processStage: data.ProcessStage || '',
    revisionNo: data.RevisionNo || '',
    reg: data.RegNo || '',
    dateReported: data.DateReported || '',
    tests: (data.tests || []).map((t, i) => ({
      id: t.LineId || i + 1,
      tests: t.Tests || '',
      specifications: t.Specifications || '',
      analyzedBy: t.AnalyzedBy || '',
      result: t.Result || '',
      conclusion: t.Conclusion || ''
    })),
    remarks: data.Remarks || '',
    analyzedBy: {
      name: data.AnalyzedByName || '',
      title: data.AnalyzedByTitle || '',
      date: data.AnalyzedByDate || ''
    },
    checkedBy: {
      name: data.CheckedByName || '',
      title: data.CheckedByTitle || '',
      date: data.CheckedByDate || ''
    },
    approvedBy: {
      name: data.ApprovedByName || '',
      title: data.ApprovedByTitle || '',
      date: data.ApprovedByDate || ''
    }
  });

  const loadReport = async (coaNo, nextMode) => {
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.QC.GET_COA_REPORT(coaNo), {
        skipGlobalLoading: true
      });
      if (!res.data.success || !res.data.data) {
        toast.error(res.data.message || 'Failed to load COA report');
        return;
      }
      const data = res.data.data;
      const mapped = mapReportToForm(data);
      setFormData(mapped.tests.length ? mapped : { ...mapped, tests: emptyForm().tests });
      setSelectedProduct(
        data.ItemCode
          ? {
              value: data.ItemCode,
              label: data.ProductTop || `${data.ItemCode}${data.ItemName ? ` - ${data.ItemName}` : ''}`,
              itemName: data.ItemName,
              productLine: data.ProductLine
            }
          : null
      );
      setBatchOptions([]);
      setMode(nextMode);
      setShowForm(true);
    } catch (error) {
      console.error('Error loading COA report:', error);
      toast.error('Failed to load COA report');
    }
  };

  const handleCreateNew = () => {
    setFormData(emptyForm());
    setSelectedProduct(null);
    setBatchOptions([]);
    setMode('create');
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormData(emptyForm());
    setSelectedProduct(null);
    setBatchOptions([]);
    setMode('create');
  };

  const handleDirectPrint = async (coaNo) => {
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.QC.GET_COA_REPORT(coaNo), {
        skipGlobalLoading: true
      });
      if (!res.data.success || !res.data.data) {
        toast.error(res.data.message || 'Failed to load COA report');
        return;
      }
      const mapped = mapReportToForm(res.data.data);
      const printData = mapped.tests.length ? mapped : { ...mapped, tests: emptyForm().tests };
      printCoaData(printData);
    } catch (error) {
      console.error('Error printing COA report:', error);
      toast.error('Failed to print COA report');
    }
  };

  const handleFormPrint = () => {
    printCoaData(formData);
  };

  const customSelectStyles = {
    control: (base) => ({
      ...base,
      background: '#f8fafc',
      border: '1px solid #c5cdd8',
      borderRadius: '3px',
      boxShadow: 'none',
      minHeight: '28px',
      height: '28px',
    }),
    valueContainer: (base) => ({
      ...base,
      height: '26px',
      padding: '0 6px',
    }),
    indicatorsContainer: (base) => ({
      ...base,
      height: '26px',
    }),
    dropdownIndicator: (base) => ({
      ...base,
      padding: '0 4px',
    }),
    clearIndicator: (base) => ({
      ...base,
      padding: '0 4px',
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    singleValue: (base) => ({
      ...base,
      color: '#333',
      fontWeight: 'normal',
      fontSize: '13px',
    }),
    input: (base, state) => ({
      ...base,
      color: '#333',
      margin: 0,
      padding: 0,
      background: 'transparent',
      border: 'none',
      boxShadow: 'none',
      outline: 'none',
      // Hide blinking caret in front of selected value until user types to search
      caretColor: state.selectProps.inputValue ? '#333' : 'transparent',
    }),
    placeholder: (base) => ({
      ...base,
      color: '#888',
      fontSize: '13px',
    }),
    menu: (base) => ({
      ...base,
      background: '#fff',
      color: '#333',
      zIndex: 20,
    }),
  };

  const reportColumns = [
    {
      key: 'ItemCode',
      header: 'Item No',
      width: '14%',
      render: (row) => row.ItemCode || '—'
    },
    {
      key: 'ItemName',
      header: 'Item Name',
      width: '24%',
      render: (row) => row.ItemName || row.Product || '—'
    },
    { key: 'BatchNo', header: 'Batch', width: '12%', render: (row) => row.BatchNo || '—' },
    {
      key: 'CreatedByName',
      header: 'Created By',
      width: '14%',
      render: (row) => row.CreatedByName || row.CreatedBy || '—'
    },
    {
      key: 'CreatedAt',
      header: 'Date',
      width: '12%',
      render: (row) => row.CreatedAt
        ? new Date(row.CreatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—'
    },
    {
      key: 'Status',
      header: 'Status',
      width: '12%',
      render: (row) => (
        <span className={`coa-status-badge coa-status-${(row.Status || '').toLowerCase()}`}>
          {row.Status || '—'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '12%',
      render: (row) => (
        <div className="coa-report-actions">
          <button
            type="button"
            className="dome-table-action-btn dome-table-action-btn--list"
            title="View"
            onClick={(e) => {
              e.stopPropagation();
              loadReport(row.COA_No, 'view');
            }}
          >
            <IconEye size={16} stroke={2} />
          </button>
          {canEdit && (
            <button
              type="button"
              className="dome-table-action-btn dome-table-action-btn--info"
              title="Edit"
              onClick={(e) => {
                e.stopPropagation();
                loadReport(row.COA_No, 'edit');
              }}
            >
              <IconEdit size={16} stroke={2} />
            </button>
          )}
          <button
            type="button"
            className="dome-table-action-btn dome-table-action-btn--check"
            title="Print"
            onClick={(e) => {
              e.stopPropagation();
              handleDirectPrint(row.COA_No);
            }}
          >
            <IconPrinter size={16} stroke={2} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="coa-document-wrapper coa-wrapper-centered">
      <Toaster position="top-right" />

      {canGenerate && (
        <div className={`coa-create-header no-print${showForm ? ' coa-section-hidden' : ''}`}>
          <Button variant="primary" onClick={handleCreateNew} icon={<IconPlus size={18} />}>
            Create New
          </Button>
        </div>
      )}

      {showForm && (
      <div className="coa-document-container">
        {/* Top Header Outside Document */}
        <div className="coa-form-top-bar no-print">
          <Button variant="outline" icon={<IconArrowLeft size={16} />} onClick={handleCloseForm}>
            Back
          </Button>
        
        </div>
        <div className="coa-top-header no-print">
          <div className="coa-top-logo coa-top-logo-no-border">
            <img src="/images/ldslogo.png" alt="LDS Logo" className="coa-top-logo-img" />
            <span className="logo-text">Lab Diagnostic Systems<br/>(SMC) Pvt Ltd</span>
          </div>
          <div className="coa-top-title">
            {formData.productLine || ''}
          </div>
        </div>

        <div className={`coa-document${isReadOnly ? ' coa-document--readonly' : ''}`}>
          
          {/* Header Section */}
        <div className="coa-header">
          <div className="coa-logo-section coa-logo-section-padded">
            <img src="/images/ldslogo.png" alt="LDS Logo" className="coa-header-logo-img" />
          </div>
          <div className="coa-title-section">
            <h2>LAB DIAGNOSTIC SYSTEMS (SMC) PVT LTD.</h2>
            <h3>QUALITY CONTROL LABORATORY</h3>
            <h4>CERTIFICATE OF ANALYSIS FOR FINISHED PRODUCT</h4>
          </div>
          <div className="coa-form-info">
            <div className="coa-form-row">
              <label>Issue Date:</label>
              <input type="text" value={formData.issueDate} onChange={(e) => handleInputChange(e, 'issueDate')} readOnly={isReadOnly} tabIndex={isReadOnly ? -1 : undefined} />
            </div>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="coa-details-section">
          <div className="coa-detail-row full-width coa-detail-row-centered">
            <label>PRODUCT:</label>
            <div className="coa-print-only coa-print-product-text">{formData.productTop}</div>
            {isReadOnly ? (
              <div className="coa-readonly-value coa-screen-only">{formData.productTop || '—'}</div>
            ) : (
            <div className="coa-item-select-container coa-screen-only">
              <AsyncSelect
                cacheOptions
                defaultOptions
                loadOptions={fetchProducts}
                value={selectedProduct}
                onChange={(selected) => {
                  setSelectedProduct(selected);
                  setFormData(prev => ({
                    ...prev,
                    itemCode: selected ? selected.value : '',
                    itemName: selected ? (selected.itemName || '') : '',
                    productTop: selected ? selected.label : '',
                    productLine: selected ? selected.productLine : ''
                  }));
                  if (selected && selected.value) {
                    fetchProductDetails(selected.value, selected.productLine);
                  }
                }}
                styles={customSelectStyles}
                placeholder="Search Product..."
                isClearable
              />
            </div>
            )}
          </div>
          <div className="coa-detail-row full-width">
            <label>COMPOSITION:</label>
            <input type="text" value={formData.composition} onChange={(e) => handleInputChange(e, 'composition')} readOnly={isReadOnly} tabIndex={isReadOnly ? -1 : undefined} />
          </div>
          
          <div className="coa-grid-details">
            <div className="coa-grid-col">
              <div className="coa-detail-row">
                <label>PRODUCT</label>
                <input type="text" value={formData.product} onChange={(e) => handleInputChange(e, 'product')} readOnly={isReadOnly} tabIndex={isReadOnly ? -1 : undefined} />
              </div>
              <div className="coa-detail-row">
                <label>BATCH:</label>
                <div className="coa-print-only">{formData.batch}</div>
                {isReadOnly ? (
                  <div className="coa-readonly-value coa-screen-only">{formData.batch || '—'}</div>
                ) : (
                <div className="coa-item-select-container coa-screen-only">
                  <Select
                    value={formData.batch ? { value: formData.batch, label: formData.batch } : null}
                    onChange={(selected) => {
                      const match = batchOptions.find((batch) => batch.batch === selected?.value);
                      setFormData(prev => ({
                        ...prev,
                        batch: selected ? selected.value : '',
                        batchSize: match?.batchSize || prev.batchSize,
                        sopNo: match?.bmrNo || prev.sopNo,
                        mfgDate: match ? formatDate(match.mfgDate) : prev.mfgDate,
                        expDate: match ? formatDate(match.expDate) : prev.expDate,
                      }));
                    }}
                    options={batchOptions.map((batch) => ({ value: batch.batch, label: batch.batch }))}
                    styles={customSelectStyles}
                    placeholder="Select batch..."
                    isClearable
                    isSearchable
                  />
                </div>
                )}
              </div>
              <div className="coa-detail-row">
                <label>BATCH SIZE:</label>
                <input type="text" value={formData.batchSize} onChange={(e) => handleInputChange(e, 'batchSize')} readOnly={isReadOnly} tabIndex={isReadOnly ? -1 : undefined} />
              </div>
              <div className="coa-detail-row">
                <label>SOP NO.:</label>
                <input type="text" value={formData.sopNo} onChange={(e) => handleInputChange(e, 'sopNo')} readOnly={isReadOnly} tabIndex={isReadOnly ? -1 : undefined} />
              </div>
              <div className="coa-detail-row">
                <label>PROCESS STAGE:</label>
                <input type="text" value={formData.processStage} onChange={(e) => handleInputChange(e, 'processStage')} readOnly={isReadOnly} tabIndex={isReadOnly ? -1 : undefined} />
              </div>
              <div className="coa-detail-row">
                <label>REG:</label>
                <input type="text" value={formData.reg} onChange={(e) => handleInputChange(e, 'reg')} readOnly={isReadOnly} tabIndex={isReadOnly ? -1 : undefined} />
              </div>
            </div>
            <div className="coa-grid-col">
              <div className="coa-detail-row">
                <label>CAT No:</label>
                <input type="text" value={formData.catNo} onChange={(e) => handleInputChange(e, 'catNo')} readOnly={isReadOnly} tabIndex={isReadOnly ? -1 : undefined} />
              </div>
              <div className="coa-detail-row">
                <label>PACK SIZE:</label>
                <input type="text" value={formData.packSize} onChange={(e) => handleInputChange(e, 'packSize')} readOnly={isReadOnly} tabIndex={isReadOnly ? -1 : undefined} />
              </div>
              <div className="coa-detail-row">
                <label>MFG DATE:</label>
                <input type="text" value={formData.mfgDate} onChange={(e) => handleInputChange(e, 'mfgDate')} readOnly={isReadOnly} tabIndex={isReadOnly ? -1 : undefined} />
              </div>
              <div className="coa-detail-row">
                <label>EXP DATE:</label>
                <input type="text" value={formData.expDate} onChange={(e) => handleInputChange(e, 'expDate')} readOnly={isReadOnly} tabIndex={isReadOnly ? -1 : undefined} />
              </div>
              <div className="coa-detail-row">
                <label>REVISION NO.:</label>
                <input type="text" value={formData.revisionNo} onChange={(e) => handleInputChange(e, 'revisionNo')} readOnly={isReadOnly} tabIndex={isReadOnly ? -1 : undefined} />
              </div>
              <div className="coa-detail-row">
                <label>DATE REPORTED:</label>
                <input type="text" value={formData.dateReported} onChange={(e) => handleInputChange(e, 'dateReported')} readOnly={isReadOnly} tabIndex={isReadOnly ? -1 : undefined} />
              </div>
            </div>
          </div>
        </div>

        {/* Tests Table Section */}
        <div className="coa-table-section">
          <table className="coa-table">
            <thead>
              <tr>
                <th className="coa-col-sn">S.#</th>
                <th className="coa-col-tests">TESTS</th>
                <th className="coa-col-specs">SPECIFICATIONS</th>
                <th className="coa-col-analyzed">ANALYZED BY</th>
                <th className="coa-col-result">RESULT</th>
                <th className="coa-col-conclusion">CONCLUSION</th>
              </tr>
            </thead>
            <tbody>
              {formData.tests.map((test, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td><textarea value={test.tests} onChange={(e) => handleTestChange(index, 'tests', e.target.value)} onInput={(e) => handleAutoResize(e.target)} ref={handleAutoResize} readOnly={isReadOnly} tabIndex={isReadOnly ? -1 : undefined} /></td>
                  <td><textarea value={test.specifications} onChange={(e) => handleTestChange(index, 'specifications', e.target.value)} onInput={(e) => handleAutoResize(e.target)} ref={handleAutoResize} readOnly={isReadOnly} tabIndex={isReadOnly ? -1 : undefined} /></td>
                  <td><input type="text" value={test.analyzedBy} onChange={(e) => handleTestChange(index, 'analyzedBy', e.target.value)} readOnly={isReadOnly} tabIndex={isReadOnly ? -1 : undefined} /></td>
                  <td><input type="text" value={test.result} onChange={(e) => handleTestChange(index, 'result', e.target.value)} readOnly={isReadOnly} tabIndex={isReadOnly ? -1 : undefined} /></td>
                  <td><input type="text" value={test.conclusion} onChange={(e) => handleTestChange(index, 'conclusion', e.target.value)} readOnly={isReadOnly} tabIndex={isReadOnly ? -1 : undefined} /></td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>

        {/* Remarks Section */}
        <div className="coa-remarks-section">
          <div className="coa-remarks-label">REMARKS</div>
          <div className="coa-remarks-input">
            <textarea value={formData.remarks} onChange={(e) => handleInputChange(e, 'remarks')} onInput={(e) => handleAutoResize(e.target)} ref={handleAutoResize} readOnly={isReadOnly} tabIndex={isReadOnly ? -1 : undefined} />
          </div>
        </div>

        {/* Signatures Section */}
        <div className="coa-signatures-section">
          <div className="coa-signature-block">
            <div className="coa-sig-header">ANALYZED BY</div>
            <input type="text" placeholder="Name" value={formData.analyzedBy.name} onChange={(e) => handleInputChange(e, 'analyzedBy', 'name')} className="coa-sign-input-bold" readOnly={isReadOnly} tabIndex={isReadOnly ? -1 : undefined} />
            <input type="text" placeholder="Title" value={formData.analyzedBy.title} onChange={(e) => handleInputChange(e, 'analyzedBy', 'title')} className="coa-sign-input-bold" readOnly={isReadOnly} tabIndex={isReadOnly ? -1 : undefined} />
            <input type="text" placeholder="Date" value={formData.analyzedBy.date} onChange={(e) => handleInputChange(e, 'analyzedBy', 'date')} className="coa-sign-input-grey-bold" readOnly={isReadOnly} tabIndex={isReadOnly ? -1 : undefined} />
          </div>
          <div className="coa-signature-block">
            <div className="coa-sig-header">CHECKED BY</div>
            <input type="text" placeholder="Name" value={formData.checkedBy.name} onChange={(e) => handleInputChange(e, 'checkedBy', 'name')} className="coa-sign-input-bold" readOnly={isReadOnly} tabIndex={isReadOnly ? -1 : undefined} />
            <input type="text" placeholder="Title" value={formData.checkedBy.title} onChange={(e) => handleInputChange(e, 'checkedBy', 'title')} className="coa-sign-input-bold" readOnly={isReadOnly} tabIndex={isReadOnly ? -1 : undefined} />
            <input type="text" placeholder="Date" value={formData.checkedBy.date} onChange={(e) => handleInputChange(e, 'checkedBy', 'date')} className="coa-sign-input-grey-bold" readOnly={isReadOnly} tabIndex={isReadOnly ? -1 : undefined} />
          </div>
          <div className="coa-signature-block">
            <div className="coa-sig-header">APPROVED BY</div>
            <input type="text" placeholder="Name" value={formData.approvedBy.name} onChange={(e) => handleInputChange(e, 'approvedBy', 'name')} className="coa-sign-input-bold" readOnly={isReadOnly} tabIndex={isReadOnly ? -1 : undefined} />
            <input type="text" placeholder="Title" value={formData.approvedBy.title} onChange={(e) => handleInputChange(e, 'approvedBy', 'title')} className="coa-sign-input-bold" readOnly={isReadOnly} tabIndex={isReadOnly ? -1 : undefined} />
            <input type="text" placeholder="Date" value={formData.approvedBy.date} onChange={(e) => handleInputChange(e, 'approvedBy', 'date')} className="coa-sign-input-grey-bold" readOnly={isReadOnly} tabIndex={isReadOnly ? -1 : undefined} />
          </div>
        </div>

        {/* Footer Section */}
        <div className="coa-footer-status">
          <div className="coa-approved-text">APPROVED</div>
        </div>

        <div className="coa-form-actions no-print">
          <button type="button" onClick={handleCloseForm} className="coa-secondary-btn">
            Cancel
          </button>
          {!isReadOnly && (
            mode === 'edit' ? (
              <button
                type="button"
                onClick={() => handleSave(formData.status === 'Generated' ? 'Generated' : 'Draft')}
                className="btn btn-primary"
                disabled={isSaving}
              >
                Update
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleSave('Draft')}
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSave('Generated')}
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  Generate Report
                </button>
              </>
            )
          )}
          <button
            type="button"
            onClick={handleFormPrint}
            className="btn btn-primary"
          >
            Print PDF
          </button>
        </div>
      </div>
    </div>
      )}

      <div className={`coa-reports-section no-print${showForm ? ' coa-section-hidden' : ''}`}>
        <Table
          data={reports}
          columns={reportColumns}
          isLoading={isFetchingReports}
          showActions={false}
          showPagination
          totalEntries={totalReports}
          currentPage={page}
          pageSize={limit}
          onPageChange={setPage}
          onItemsPerPageChange={(size) => {
            setLimit(size);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
};

export default COA;
