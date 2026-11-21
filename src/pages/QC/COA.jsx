import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import toast, { Toaster } from 'react-hot-toast';
import { IconArrowLeft, IconEdit, IconEye, IconPlus, IconPrinter, IconSearch, IconRefresh, IconHourglass } from '@tabler/icons-react';
import { API_ENDPOINTS } from '../../apis/endpoints';
import { axiosInstance } from '../../apis/axiosinstance';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../context/permissioncheck';
import Button from '../../global-components/Button/Button';
import GlobalPopup from '../../global-components/GlobalPopup/GlobalPopup';
import Table from '../../global-components/Table/Table';
import './COA.css';
import '../ProductionOrders/ProductionOrders.css';
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
  nominalVolume: '',
  samplingDate: '',
  sampleQuantity: '',
  sampleCompletionDate: '',
  tests: [
    { id: 1, tests: '', specifications: '', analyzedBy: '', result: '', conclusion: '' }
  ],
  remarks: 'This product complies as per approved specifications.',
  footerNotes: [],
  conformityOptions: [],
  conformity: '',
  approvalStatus: 'APPROVED',
  analyzedBy: { name: '', title: 'QC Analyst', date: getTodayFormattedUpper() },
  checkedBy: { name: '', title: 'QC Officer', date: getTodayFormattedUpper() },
  approvedBy: { name: '', title: 'QC Manager', date: getTodayFormattedUpper() }
});

const emptyHeaderExtras = () => ({
  nominalVolume: '',
  samplingDate: '',
  sampleQuantity: '',
  sampleCompletionDate: '',
  conformity: '',
  approvalStatus: 'APPROVED',
});

const readHeaderExtras = (formNo) => {
  if (!formNo || String(formNo).charAt(0) !== '{') return emptyHeaderExtras();
  try {
    const parsed = JSON.parse(formNo);
    return { ...emptyHeaderExtras(), ...parsed };
  } catch {
    return emptyHeaderExtras();
  }
};

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
  .coa-header { display: flex; border-bottom: 1px solid #111; color: #111; }
  .coa-title-section {
    width: 68%;
    text-align: left;
    padding: 10px 12px;
    border-right: 1px solid #111;
  }
  .coa-title-section h2 { margin: 0 0 4px; font-size: 15px; font-weight: 700; }
  .coa-title-section p { margin: 0 0 8px; font-size: 12px; }
  .coa-title-section h3 { margin: 0; font-size: 18px; font-weight: 700; }
  .coa-title-section h4 { margin: 0; font-size: 16px; font-weight: 700; }
  .coa-form-info { width: 32%; padding: 8px; font-size: 12px; color: #111; }
  .coa-form-info img { height: 48px; object-fit: contain; }
  .coa-meta { width: 100%; border-collapse: collapse; margin-top: 6px; }
  .coa-meta td { border: 1px solid #111; padding: 3px 6px; }
  .coa-cert { width: 100%; border-collapse: collapse; }
  .coa-cert th, .coa-cert td { border: 1px solid #111; padding: 3px 6px; vertical-align: top; }
  .coa-cert th { width: 18%; text-align: left; font-weight: 700; color: #111; }
  .coa-cert td { width: 32%; color: #111; font-weight: 600; }
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
      <div class="coa-title-section">
        <h2>LAB DIAGNOSTIC SYSTEMS (SMC) PRIVATE LIMITED</h2>
        <p>Plot No 36-A, PSIC, SIE, Taxila – Rawalpindi, Pakistan</p>
        <h3>CERTIFICATE OF ANALYSIS</h3>
        <h4>(Finished Product)</h4>
      </div>
      <div class="coa-form-info">
        <img src="${logoUrl}" alt="LDS Logo" />
        <table class="coa-meta">
          <tr><td>Document No</td><td>LDS-QC-FRM-LMS-011AV</td></tr>
          <tr><td>Version No</td><td>02</td></tr>
        </table>
      </div>
    </div>
    <table class="coa-cert">
      <tr><th>Product Name:</th><td>${escapeHtml(data.product || data.productTop)}</td><th>Sampling Date:</th><td>${escapeHtml(data.samplingDate)}</td></tr>
      <tr><th>Product Code:</th><td>${escapeHtml(data.itemCode)}</td><th>Sample Quantity:</th><td>${escapeHtml(data.sampleQuantity)}</td></tr>
      <tr><th>Nominal Volume:</th><td>${escapeHtml(data.nominalVolume)}</td><th>Sample Completion Date:</th><td>${escapeHtml(data.sampleCompletionDate)}</td></tr>
      <tr><th>Batch No:</th><td>${escapeHtml(data.batch)}</td><th>Reporting Date:</th><td>${escapeHtml(data.dateReported)}</td></tr>
      <tr><th>Batch Size:</th><td>${escapeHtml(data.batchSize)}</td><th>Revision No:</th><td>${escapeHtml(data.revisionNo)}</td></tr>
      <tr><th>Pack Presentation:</th><td>${escapeHtml(data.packSize)}</td><th>CoA Issuance Date:</th><td>${escapeHtml(data.issueDate)}</td></tr>
      <tr><th>Registration No:</th><td>${escapeHtml(data.reg)}</td><th>Manufacturing Date:</th><td>${escapeHtml(data.mfgDate)}</td></tr>
      <tr><th>CAT No:</th><td>${escapeHtml(data.catNo)}</td><th>Expiry Date:</th><td>${escapeHtml(data.expDate)}</td></tr>
      <tr><th>Tube Type:</th><td>${escapeHtml(data.processStage)}</td><th>Test Procedure No:</th><td>${escapeHtml(data.sopNo)}</td></tr>
      <tr><th>Specifications:</th><td colspan="3">${escapeHtml(data.composition)}</td></tr>
    </table>
    <div class="coa-table-section">
      <table class="coa-table">
        <thead>
          <tr>
            <th class="coa-col-sn">S.#</th>
            <th class="coa-col-tests">Test</th>
            <th class="coa-col-specs">Specifications</th>
            <th class="coa-col-analyzed">Analyzed By</th>
            <th class="coa-col-result">Results</th>
            <th class="coa-col-conclusion">Conclusion</th>
          </tr>
        </thead>
        <tbody>${testRows}</tbody>
      </table>
    </div>
    ${(Array.isArray(data.footerNotes) ? data.footerNotes : []).map((note) => `<p class="coa-note">Note ${escapeHtml(note.NoteNo)}: ${escapeHtml(note.Text)}</p>`).join('')}
    ${data.conformity ? `<p class="coa-note"><strong>Statement of Conformity:</strong> ${escapeHtml((data.conformityOptions || []).find((option) => option.Value === data.conformity)?.Text || data.conformity)}</p>` : ''}
    <table class="coa-sign-table">
      <tr><th>REMARKS</th><td colspan="2">${escapeHtml(data.remarks)}</td></tr>
      <tr>
        <th>ANALYZED BY</th>
        <th>CHECKED BY</th>
        <th>APPROVED BY</th>
      </tr>
      <tr>
        <td><strong>${escapeHtml(data.analyzedBy?.title)}</strong><br/>${escapeHtml(data.analyzedBy?.date)}</td>
        <td><strong>${escapeHtml(data.checkedBy?.title)}</strong><br/>${escapeHtml(data.checkedBy?.date)}</td>
        <td><strong>${escapeHtml(data.approvedBy?.title)}</strong><br/>${escapeHtml(data.approvedBy?.date)}</td>
      </tr>
      <tr><td colspan="3" style="text-align:center;font-weight:700;">${escapeHtml(data.approvalStatus || 'APPROVED')}</td></tr>
      <tr><td colspan="3">This is SAP-PMS generated Document and does not require signature</td></tr>
    </table>
    <div class="coa-end">End of Document</div>
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

const COA = ({ clearance = false }) => {
  const { user } = useAuth();
  const { hasChildPermission } = usePermission();
  const [batchOptions, setBatchOptions] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState('create'); // create | edit | view
  const [isSaving, setIsSaving] = useState(false);
  const [pendingSave, setPendingSave] = useState(null);
  const [clearanceTarget, setClearanceTarget] = useState(null);
  const [clearanceStatus, setClearanceStatus] = useState('');
  const [clearanceReview, setClearanceReview] = useState(false);
  const [reports, setReports] = useState([]);
  const [isFetchingReports, setIsFetchingReports] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalReports, setTotalReports] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ status: '', productLine: '', fromDate: '', toDate: '' });
  const [statusOptions, setStatusOptions] = useState([]);
  const [productLines, setProductLines] = useState([]);

  const isReadOnly = mode === 'view';

  const canGenerate = hasChildPermission('QC', 'Certificate of Analysis', 'Can Generate');
  const canEdit = hasChildPermission('QC', 'Certificate of Analysis', 'Can edit');
  const qaPermission = hasChildPermission('QC', 'Certificate of Analysis', 'QA Permission');
  const qaStatuses = ['Pending', 'Released', 'Hold', 'Reject'];

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
        params: {
          page: pageOverride,
          limit: limitOverride,
          search: searchQuery.trim() || undefined,
          status: filters.status || undefined,
          productLine: filters.productLine || undefined,
          fromDate: filters.fromDate || undefined,
          toDate: filters.toDate || undefined,
          excludeStatus: clearance ? 'Draft' : undefined,
          statusIn: qaPermission && !filters.status ? qaStatuses.join(',') : undefined,
        },
        skipGlobalLoading: true
      });
      if (res.data.success) {
        setReports(res.data.data || []);
        setTotalReports(res.data.pagination?.total || 0);
        if (qaPermission) {
          setStatusOptions(qaStatuses);
        } else if (Array.isArray(res.data.statuses)) {
          setStatusOptions(
            clearance
              ? res.data.statuses.filter((item) => String(item).toLowerCase() !== 'draft')
              : res.data.statuses,
          );
        }
        if (Array.isArray(res.data.productLines)) setProductLines(res.data.productLines);
      }
    } catch (error) {
      console.error('Error fetching COA reports:', error);
    } finally {
      setIsFetchingReports(false);
    }
  };

  useEffect(() => {
    fetchReports(page, limit);
  }, [page, limit, searchQuery, filters, qaPermission]);

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
      let templateHeader = null;
      let templateFooter = null;

      try {
        if (productLineStr) {
          const templateRes = await axiosInstance.get(API_ENDPOINTS.QC.GET_TEMPLATE_BY_LINE, {
            params: { line: productLineStr },
            skipGlobalLoading: true
          });
          if (templateRes.data.success && templateRes.data.data) {
            const row = templateRes.data.data;
            const parsedTests = typeof row.Description === 'string' ? JSON.parse(row.Description) : row.Description;
            templateHeader = typeof row.Header === 'string' ? JSON.parse(row.Header || '{}') : (row.Header || {});
            templateFooter = typeof row.Footer === 'string' ? JSON.parse(row.Footer || '{}') : (row.Footer || {});
            if (Array.isArray(parsedTests)) {
              presetTests = parsedTests.map((t, i) => ({
                id: t.SrNo || i + 1,
                tests: t.Test || t.test || '',
                specifications: t.Specifications || t.specification || '',
                analyzedBy: t.AnalyzedBy || '',
                result: t.Results || t.result || '',
                conclusion: t.Conclusion || ''
              }));
            }
          }
        }
      } catch (err) {
        console.error('Error fetching line template:', err);
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
          batchSize: firstBatch?.batchSize || details['BATCH SIZE'] || '',
          processStage: details['PROCESS STAGE'] || '',
          catNo: details['CAT NO.'] || '',
          packSize: templateHeader?.['Pack Presentation'] || details['PACK SIZE'] || '',
          mfgDate: firstBatch ? (formatDate(firstBatch.mfgDate) || '') : '',
          expDate: firstBatch ? (formatDate(firstBatch.expDate) || '') : '',
          dateReported: formatDate(details['DATE REPORTED']) || '',
          composition: templateHeader?.Specifications || details['COMPOSITION'] || prev.composition,
          reg: '',
          revisionNo: templateHeader?.['Revision No'] || prev.revisionNo,
          sopNo: templateHeader?.['Test Procedure No'] || firstBatch?.bmrNo || '',
          footerNotes: templateFooter?.Notes || [],
          conformityOptions: templateFooter?.StatementOfConformity?.Options || [],
          conformity: '',
          tests: presetTests,
          testsFromTemplate: Boolean(templateHeader),
          locked: {
            batchSize: Boolean(firstBatch?.batchSize || details['BATCH SIZE']),
            processStage: Boolean(details['PROCESS STAGE']),
            catNo: Boolean(details['CAT NO.']),
            packSize: Boolean(templateHeader?.['Pack Presentation'] || details['PACK SIZE']),
            mfgDate: Boolean(firstBatch?.mfgDate),
            expDate: Boolean(firstBatch?.expDate),
            dateReported: Boolean(details['DATE REPORTED']),
            composition: Boolean(templateHeader?.Specifications || details['COMPOSITION']),
            revisionNo: Boolean(templateHeader?.['Revision No']),
            sopNo: Boolean(templateHeader?.['Test Procedure No'] || firstBatch?.bmrNo),
          },
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
      formNo: JSON.stringify({
        nominalVolume: formData.nominalVolume,
        samplingDate: formData.samplingDate,
        sampleQuantity: formData.sampleQuantity,
        sampleCompletionDate: formData.sampleCompletionDate,
        conformity: formData.conformity,
        approvalStatus: formData.approvalStatus,
      }),
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
    if (isReadOnly) return false;
    if (!formData.itemCode && !selectedProduct?.value) {
      toast.error('Please select a product first.');
      return false;
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
        return true;
      }
      toast.error(res.data.message || 'Failed to save COA');
      return false;
    } catch (error) {
      console.error('Error saving COA:', error);
      toast.error('An error occurred while saving the COA');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const applyClearanceStatus = async () => {
    if (!clearanceTarget?.COA_No || !clearanceStatus) return;
    try {
      setIsSaving(true);
      const userMeta = getUserMeta();
      const res = await axiosInstance.patch(
        API_ENDPOINTS.QC.UPDATE_COA_STATUS(clearanceTarget.COA_No),
        {
          status: clearanceStatus,
          updatedBy: userMeta.createdBy,
          updatedByName: userMeta.createdByName,
        },
        { skipGlobalLoading: true },
      );
      if (!res.data?.success) {
        toast.error(res.data?.message || 'Failed to update status');
        return;
      }
      toast.success(res.data.message || 'Status updated');
      setClearanceTarget(null);
      setClearanceStatus('');
      setClearanceReview(false);
      handleCloseForm();
      fetchReports(page, limit);
    } catch (error) {
      console.error('Error updating COA status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsSaving(false);
    }
  };

  const mapReportToForm = (data) => ({
    coaNo: data.COA_No,
    status: data.Status || 'Draft',
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
    ...readHeaderExtras(data.FormNo),
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
      if (data.ProductLine) {
        try {
          const templateRes = await axiosInstance.get(API_ENDPOINTS.QC.GET_TEMPLATE_BY_LINE, {
            params: { line: data.ProductLine },
            skipGlobalLoading: true
          });
          if (templateRes.data.success && templateRes.data.data) {
            const footer = typeof templateRes.data.data.Footer === 'string'
              ? JSON.parse(templateRes.data.data.Footer || '{}')
              : (templateRes.data.data.Footer || {});
            setFormData((prev) => ({
              ...prev,
              footerNotes: footer.Notes || [],
              conformityOptions: footer.StatementOfConformity?.Options || [],
              testsFromTemplate: true,
              locked: {
                ...(prev.locked || {}),
                packSize: true,
                composition: true,
                revisionNo: true,
                sopNo: true,
                batchSize: true,
                catNo: true,
                processStage: true,
                mfgDate: true,
                expDate: true,
                dateReported: true,
              },
            }));
          }
        } catch (err) {
          console.error('Error loading template footer:', err);
        }
      }
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
    setClearanceReview(false);
    setClearanceTarget(null);
    setClearanceStatus('');
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
          {(!qaPermission || String(row.Status || '').toLowerCase() === 'released') && (
          <button
            type="button"
            className="dome-table-action-btn dome-table-action-btn--list"
            title="View"
              onClick={(e) => {
                e.stopPropagation();
                setClearanceReview(false);
                loadReport(row.COA_No, 'view');
              }}
          >
            <IconEye size={16} stroke={2} />
          </button>
          )}
          {!qaPermission && !clearance && canEdit && String(row.Status || '').toLowerCase() === 'draft' && (
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
          {qaPermission && ['pending', 'generated', 'hold'].includes(String(row.Status || '').toLowerCase()) && (
            <button
              type="button"
              className="dome-table-action-btn dome-table-action-btn--list"
              title="QA clearance"
              onClick={(e) => {
                e.stopPropagation();
                setClearanceTarget(row);
                setClearanceStatus('');
                setClearanceReview(true);
                loadReport(row.COA_No, 'view');
              }}
            >
              <IconHourglass size={16} stroke={2} />
            </button>
          )}
          {!clearance && String(row.Status || '').toLowerCase() === 'released' && (
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
          )}
        </div>
      )
    }
  ];

  return (
    <div className={`coa-document-wrapper coa-wrapper-centered${clearance ? ' qa-clearance-page' : ''}`}>
      <Toaster position="top-right" />

      {(Boolean(user?.isSuperAdmin) || (canGenerate && !qaPermission)) && !clearance && (
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
          <div className="coa-header coa-cert-head">
            <div className="coa-title-section">
              <h2>LAB DIAGNOSTIC SYSTEMS (SMC) PRIVATE LIMITED</h2>
              <p>Plot No 36-A, PSIC, SIE, Taxila – Rawalpindi, Pakistan</p>
              <h3>CERTIFICATE OF ANALYSIS</h3>
              <h4>(Finished Product)</h4>
            </div>
            <div className="coa-form-info">
              <img src="/images/ldslogo.png" alt="LDS Logo" className="coa-header-logo-img" />
              <table className="coa-meta">
                <tbody>
                  <tr><td>Document No</td><td>LDS-QC-FRM-LMS-011AV</td></tr>
                  <tr><td>Version No</td><td>02</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <table className="coa-cert">
            <tbody>
              <tr>
                <th>Product Name:</th>
                <td>
                  {isReadOnly ? (formData.product || formData.productTop || '—') : (
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
                          product: selected ? (selected.itemName || selected.label || '') : '',
                          productLine: selected ? selected.productLine : ''
                        }));
                        if (selected && selected.value) fetchProductDetails(selected.value, selected.productLine);
                      }}
                      styles={customSelectStyles}
                      placeholder="Search Product..."
                      isClearable
                    />
                  )}
                </td>
                <th>Sampling Date:</th>
                <td><input type="text" value={formData.samplingDate} onChange={(e) => handleInputChange(e, 'samplingDate')} readOnly={isReadOnly} /></td>
              </tr>
              <tr>
                <th>Product Code:</th>
                <td><input type="text" value={formData.itemCode} readOnly placeholder="fetch by system" /></td>
                <th>Sample Quantity:</th>
                <td><input type="text" value={formData.sampleQuantity} onChange={(e) => handleInputChange(e, 'sampleQuantity')} readOnly={isReadOnly} /></td>
              </tr>
              <tr>
                <th>Nominal Volume:</th>
                <td><input type="text" value={formData.nominalVolume} onChange={(e) => handleInputChange(e, 'nominalVolume')} readOnly={isReadOnly} /></td>
                <th>Test Completion Date:</th>
                <td><input type="text" value={formData.sampleCompletionDate} onChange={(e) => handleInputChange(e, 'sampleCompletionDate')} readOnly={isReadOnly} /></td>
              </tr>
              <tr>
                <th>Batch No:</th>
                <td>
                  {isReadOnly ? (formData.batch || '—') : (
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
                  )}
                </td>
                <th>Reporting Date:</th>
                <td><input type="text" value={formData.dateReported} readOnly={isReadOnly || formData.locked?.dateReported} /></td>
              </tr>
              <tr>
                <th>Batch Size:</th>
                <td><input type="text" value={formData.batchSize} readOnly={isReadOnly || formData.locked?.batchSize} /></td>
                <th>Revision No:</th>
                <td><input type="text" value={formData.revisionNo} onChange={(e) => handleInputChange(e, 'revisionNo')} readOnly={isReadOnly || formData.locked?.revisionNo} /></td>
              </tr>
              <tr>
                <th>Pack Presentation:</th>
                <td><input type="text" value={formData.packSize} readOnly={isReadOnly || formData.locked?.packSize} /></td>
                <th>CoA Issuance Date:</th>
                <td><input type="text" value={formData.issueDate} onChange={(e) => handleInputChange(e, 'issueDate')} readOnly={isReadOnly} /></td>
              </tr>
              <tr>
                <th>Registration No:</th>
                <td><input type="text" value={formData.reg} onChange={(e) => handleInputChange(e, 'reg')} readOnly={isReadOnly} /></td>
                <th>Manufacturing Date:</th>
                <td><input type="text" value={formData.mfgDate} readOnly={isReadOnly || formData.locked?.mfgDate} /></td>
              </tr>
              <tr>
                <th>CAT No:</th>
                <td><input type="text" value={formData.catNo} readOnly={isReadOnly || formData.locked?.catNo} /></td>
                <th>Expiry Date:</th>
                <td><input type="text" value={formData.expDate} readOnly={isReadOnly || formData.locked?.expDate} /></td>
              </tr>
              <tr>
                <th>Tube Type:</th>
                <td><input type="text" value={formData.processStage} readOnly={isReadOnly || formData.locked?.processStage} /></td>
                <th>Test Procedure No:</th>
                <td><input type="text" value={formData.sopNo} readOnly={isReadOnly || formData.locked?.sopNo} /></td>
              </tr>
              <tr>
                <th>Specifications:</th>
                <td colSpan={3}><textarea value={formData.composition} readOnly={isReadOnly || formData.locked?.composition} /></td>
              </tr>
            </tbody>
          </table>

        {/* Tests Table Section */}
        <div className="coa-table-section">
          <table className="coa-table">
            <thead>
              <tr>
                <th className="coa-col-sn">S.#</th>
                <th className="coa-col-tests">Test</th>
                <th className="coa-col-specs">Specifications</th>
                <th className="coa-col-analyzed">Analyzed By</th>
                <th className="coa-col-result">Results</th>
                <th className="coa-col-conclusion">Conclusion</th>
              </tr>
            </thead>
            <tbody>
              {formData.tests.map((test, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td><textarea value={test.tests} onChange={(e) => handleTestChange(index, 'tests', e.target.value)} readOnly={isReadOnly || formData.testsFromTemplate} /></td>
                  <td><textarea value={test.specifications} onChange={(e) => handleTestChange(index, 'specifications', e.target.value)} readOnly={isReadOnly || formData.testsFromTemplate} /></td>
                  <td><input type="text" value={test.analyzedBy} onChange={(e) => handleTestChange(index, 'analyzedBy', e.target.value)} readOnly={isReadOnly || formData.testsFromTemplate} /></td>
                  <td><input type="text" value={test.result} onChange={(e) => handleTestChange(index, 'result', e.target.value)} readOnly={isReadOnly || formData.testsFromTemplate} /></td>
                  <td><input type="text" value={test.conclusion} onChange={(e) => handleTestChange(index, 'conclusion', e.target.value)} readOnly={isReadOnly || formData.testsFromTemplate} /></td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>

        {Array.isArray(formData.footerNotes) && formData.footerNotes.length > 0 && (
          <div className="coa-notes">
            {formData.footerNotes.map((note) => (
              <p key={note.NoteNo}>Note {note.NoteNo}: {note.Text}</p>
            ))}
          </div>
        )}

        {Array.isArray(formData.conformityOptions) && formData.conformityOptions.length > 0 && (
          <div className="coa-conformity">
            <div className="coa-conformity-label">Statement of Conformity:</div>
            <select
              value={formData.conformity}
              disabled={isReadOnly}
              onChange={(e) => handleInputChange(e, 'conformity')}
            >
              <option value="">Select</option>
              {formData.conformityOptions.map((option) => (
                <option key={option.Value} value={option.Value}>{option.Text}</option>
              ))}
            </select>
          </div>
        )}

        {/* Remarks Section */}
        <table className="coa-sign-table">
          <tbody>
            <tr>
              <th>REMARKS</th>
              <td colSpan={2}>
                <textarea value={formData.remarks} onChange={(e) => handleInputChange(e, 'remarks')} readOnly={isReadOnly} />
              </td>
            </tr>
            <tr>
              <th>ANALYZED BY</th>
              <th>CHECKED BY</th>
              <th>APPROVED BY</th>
            </tr>
            <tr>
              <td>
                <div className="coa-sign-role">{formData.analyzedBy.title}</div>
                <div>{formData.analyzedBy.date}</div>
              </td>
              <td>
                <div className="coa-sign-role">{formData.checkedBy.title}</div>
                <div>{formData.checkedBy.date}</div>
              </td>
              <td>
                <div className="coa-sign-role">{formData.approvedBy.title}</div>
                <div>{formData.approvedBy.date}</div>
              </td>
            </tr>
            <tr>
              <td colSpan={3} className="coa-sign-status">
                {isReadOnly ? formData.approvalStatus : (
                  <select value={formData.approvalStatus} onChange={(e) => handleInputChange(e, 'approvalStatus')}>
                    <option>APPROVED</option>
                    <option>HOLD</option>
                    <option>REJECT</option>
                  </select>
                )}
              </td>
            </tr>
            <tr>
              <td colSpan={3}>This is SAP-PMS generated Document and does not require signature</td>
            </tr>
          </tbody>
        </table>
        <div className="coa-end-document">End of Document</div>

        {qaPermission && clearanceReview && (
          <div className="qa-clearance-decision no-print">
            <span>Clearance decision</span>
            <div className="qa-clearance-status-actions">
              {['Released', 'Hold', 'Reject'].map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`qa-clearance-status-btn qa-clearance-status-btn--${status.toLowerCase()}`}
                  onClick={() => setClearanceStatus(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        )}
        {!clearance && (
        <div className="coa-form-actions no-print">
          <button type="button" onClick={handleCloseForm} className="coa-secondary-btn">
            Cancel
          </button>
          {!isReadOnly && (
            mode === 'edit' ? (
              <button
                type="button"
                onClick={() => setPendingSave(formData.status === 'Pending' || formData.status === 'Generated' ? 'Pending' : 'Draft')}
                className="btn btn-primary"
                disabled={isSaving}
              >
                Update
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setPendingSave('Draft')}
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => setPendingSave('Pending')}
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  Send for approval
                </button>
              </>
            )
          )}
          {String(formData.status || '').toLowerCase() === 'released' && (
            <button
              type="button"
              onClick={handleFormPrint}
              className="btn btn-primary"
            >
              Print PDF
            </button>
          )}
        </div>
        )}
      </div>
    </div>
      )}

      <div className={`coa-reports-section no-print${showForm ? ' coa-section-hidden' : ''}`}>
        <div className="po-filter-toolbar-card">
          <div className="po-filter-toolbar-grid">
            <div className="po-filter-item po-filter-search-box">
              <label className="po-filter-label">Search</label>
              <div style={{ position: 'relative' }}>
                <IconSearch size={18} className="po-filter-search-icon" />
                <input
                  type="text"
                  placeholder="COA, item, batch, created by..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="po-filter-search-input"
                />
              </div>
            </div>
            <div className="po-filter-item">
              <label className="po-filter-label">Status</label>
              <select
                className="po-filter-select"
                value={filters.status}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, status: e.target.value }));
                  setPage(1);
                }}
              >
                <option value="">All statuses</option>
                {statusOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
            <div className="po-filter-item">
              <label className="po-filter-label">Product Line</label>
              <select
                className="po-filter-select"
                value={filters.productLine}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, productLine: e.target.value }));
                  setPage(1);
                }}
              >
                <option value="">All lines</option>
                {productLines.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
            <div className="po-filter-item">
              <label className="po-filter-label">Created From</label>
              <input
                type="date"
                className="po-filter-date-input"
                value={filters.fromDate}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, fromDate: e.target.value }));
                  setPage(1);
                }}
              />
            </div>
            <div className="po-filter-item">
              <label className="po-filter-label">Created To</label>
              <input
                type="date"
                className="po-filter-date-input"
                value={filters.toDate}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, toDate: e.target.value }));
                  setPage(1);
                }}
              />
            </div>
            <div className="po-filter-item">
              <label className="po-filter-label">&nbsp;</label>
              <button
                type="button"
                className="po-filter-reset-btn"
                disabled={!searchQuery && !filters.status && !filters.productLine && !filters.fromDate && !filters.toDate}
                onClick={() => {
                  setSearchQuery('');
                  setFilters({ status: '', productLine: '', fromDate: '', toDate: '' });
                  setPage(1);
                }}
              >
                <IconRefresh size={16} />
                Reset
              </button>
            </div>
          </div>
        </div>
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
      {clearanceStatus && (
        <GlobalPopup
          title="QA clearance"
          onClose={() => { if (!isSaving) setClearanceStatus(''); }}
          showClose={false}
          className="po-create-confirm-popup"
        >
          <div className="po-create-confirm">
            <h3 className="po-create-confirm-title">Set status to {clearanceStatus}?</h3>
            <p className="po-create-confirm-text">
              The certificate stays as you read it. Only the status changes to {clearanceStatus}.
            </p>
            <div className="po-create-confirm-actions">
              <Button variant="outline" disabled={isSaving} onClick={() => setClearanceStatus('')}>Back</Button>
              <Button variant="primary" isLoading={isSaving} disabled={isSaving} onClick={applyClearanceStatus}>
                Confirm
              </Button>
            </div>
          </div>
        </GlobalPopup>
      )}
      {pendingSave && (
        <GlobalPopup
          title={pendingSave === 'Pending' ? 'Generate report' : 'Save draft'}
          onClose={() => { if (!isSaving) setPendingSave(null); }}
          showClose={false}
          className="po-create-confirm-popup"
        >
          <div className="po-create-confirm">
            <h3 className="po-create-confirm-title">
              {pendingSave === 'Pending' ? 'Generate this report?' : 'Save this draft?'}
            </h3>
            <p className="po-create-confirm-text">
              {pendingSave === 'Pending'
                ? 'This certificate will be saved with status Pending.'
                : 'This certificate will be saved as a draft. You can still edit it later.'}
            </p>
            <div className="po-create-confirm-actions">
              <Button variant="outline" onClick={() => setPendingSave(null)} disabled={isSaving}>
                Cancel
              </Button>
              <Button
                variant="primary"
                isLoading={isSaving}
                disabled={isSaving}
                onClick={async () => {
                  const saved = await handleSave(pendingSave);
                  if (saved) setPendingSave(null);
                }}
              >
                {pendingSave === 'Pending' ? 'Send QA for clearance' : 'Save'}
              </Button>
            </div>
          </div>
        </GlobalPopup>
      )}
    </div>
  );
};

export default COA;
