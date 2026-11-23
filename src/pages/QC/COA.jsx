import React, { useEffect, useState } from "react";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import toast, { Toaster } from "react-hot-toast";
import {
  IconArrowLeft,
  IconEdit,
  IconEye,
  IconPlus,
  IconPrinter,
  IconSearch,
  IconRefresh,
  IconHourglass,
} from "@tabler/icons-react";
import { API_ENDPOINTS } from "../../apis/endpoints";
import { axiosInstance } from "../../apis/axiosinstance";
import { useAuth } from "../../context/AuthContext";
import { usePermission } from "../../context/permissioncheck";
import Button from "../../global-components/Button/Button";
import GlobalPopup from "../../global-components/GlobalPopup/GlobalPopup";
import Table from "../../global-components/Table/Table";
import "./COA.css";
import "../ProductionOrders/ProductionOrders.css";
import "../Sampling/Sampling.css";

const getTodayFormatted = () => {
  const date = new Date();
  return date
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, "-");
};

const getTodayFormattedUpper = () => {
  const date = new Date();
  return date
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .toUpperCase()
    .replace(/-/g, " ");
};

const MONTHS = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

const toIsoDate = (value) => {
  if (!value) return "";
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const match = text.match(/^(\d{1,2})[-\s]([A-Za-z]{3})[-\s](\d{4})$/);
  if (!match) return "";
  const month = MONTHS[match[2].slice(0, 3).toLowerCase()];
  if (!month) return "";
  return `${match[3]}-${month}-${match[1].padStart(2, "0")}`;
};

const formatStoredDate = (iso) => {
  if (!iso) return "";
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, "-");
};

const CoaDateInput = ({ value, onChange, readOnly }) => (
  <input
    type={readOnly ? "text" : "date"}
    value={readOnly ? value || "" : toIsoDate(value)}
    readOnly={readOnly}
    onChange={
      readOnly ? undefined : (e) => onChange(formatStoredDate(e.target.value))
    }
  />
);

const emptyForm = () => ({
  coaNo: null,
  status: "Draft",
  formNo: "",
  issueDate: getTodayFormatted(),
  itemCode: "",
  itemName: "",
  productTop: "",
  productLine: "",
  composition: "",
  product: "",
  catNo: "",
  batch: "",
  packSize: "",
  batchSize: "",
  mfgDate: "",
  sopNo: "",
  expDate: "",
  processStage: "",
  revisionNo: "",
  reg: "",
  dateReported: "",
  nominalVolume: "",
  component: "",
  samplingDate: "",
  sampleQuantity: "",
  sampleCompletionDate: "",
  tests: [
    {
      id: 1,
      tests: "",
      specifications: "",
      analyzedBy: "",
      result: "",
      conclusion: "",
    },
  ],
  remarks: "This product complies as per approved specifications.",
  footerNotes: [],
  conformityOptions: [],
  conformity: "",
  templateKey: "",
  approvalStatus: "APPROVED",
  analyzedBy: { name: "", title: "QC Analyst", date: getTodayFormattedUpper() },
  checkedBy: { name: "", title: "QC Officer", date: getTodayFormattedUpper() },
  approvedBy: { name: "", title: "QC Manager", date: getTodayFormattedUpper() },
});

const emptyHeaderExtras = () => ({
  nominalVolume: "",
  component: "",
  samplingDate: "",
  sampleQuantity: "",
  sampleCompletionDate: "",
  conformity: "",
  templateKey: "",
  approvalStatus: "APPROVED",
});

const conformityStatementText = (data) => {
  const selected = String(data?.conformity || "").trim();
  if (!selected) return "";
  const options = Array.isArray(data?.conformityOptions)
    ? data.conformityOptions
    : [];
  const match = options.find((option) =>
    [option?.Value, option?.value, option?.Text, option?.text].some(
      (item) => String(item || "").trim() === selected,
    ),
  );
  return String(match?.Text || match?.text || "").trim() || selected;
};

const readHeaderExtras = (formNo) => {
  if (!formNo || String(formNo).charAt(0) !== "{") return emptyHeaderExtras();
  try {
    const parsed = JSON.parse(formNo);
    return { ...emptyHeaderExtras(), ...parsed };
  } catch {
    return emptyHeaderExtras();
  }
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

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
  .coa-header-brand { display: flex; align-items: center; gap: 8px; }
  .coa-header-brand span { font-size: 11px; font-weight: 700; color: #000; line-height: 1.2; }
  .coa-meta { width: 100%; border-collapse: collapse; margin-top: 6px; }
  .coa-meta td { border: 1px solid #111; padding: 3px 6px; }
  .coa-cert { width: 100%; border-collapse: collapse; }
  .coa-cert th, .coa-cert td { border: 1px solid #111; padding: 6px 8px; vertical-align: middle; }
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
  .coa-table-section { width: 100%; padding: 8px 0 0; }
  .coa-end {
    text-align: center;
    font-weight: bold;
    padding: 8px 8px 12px;
    font-size: 13px;
  }
  .coa-table {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
  }
  .coa-table th,
  .coa-table td {
    border: 1px solid #333;
    padding: 6px 8px;
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
  .coa-remarks-table { width: 100%; border-collapse: collapse; margin-bottom: -1px; }
  .coa-remarks-table th, .coa-remarks-table td { border: 1px solid #333; padding: 8px; text-align: left; }
  .coa-remarks-table th { width: 140px; }
  .coa-sign-table { width: 100%; table-layout: fixed; border-collapse: collapse; }
  .coa-sign-table th, .coa-sign-table td { border: 1px solid #333; width: 33.33%; text-align: center; padding: 8px; }
`;

const isISugarLine = (line) =>
  String(line || "")
    .toLowerCase()
    .includes("i-sugar");
const isRTestLine = (line) => {
  const value = String(line || "").toLowerCase();
  return value.includes("r-test") || value.includes("lfa");
};
const coaDocumentNo = (line, templateKey) => {
  if (isISugarLine(line)) {
    return String(templateKey) === "2" ? "LDS-QC-FRM-LMS-011IS" : "LDS-QC-FRM-LMS-011ISG";
  }
  if (isRTestLine(line)) return "LDS-QC-FRM-LMS-011R";
  return "LDS-QC-FRM-LMS-011AV";
};

const parseTemplateJson = (value, fallback) => {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    try {
      return JSON.parse(value.replace(/,\s*([}\]])/g, "$1"));
    } catch (err) {
      console.error("Invalid template JSON:", err);
      return fallback;
    }
  }
};

const buildCoaPrintHtml = (data) => {
  const tests =
    Array.isArray(data.tests) && data.tests.length
      ? data.tests
      : [
          {
            tests: "",
            specifications: "",
            analyzedBy: "",
            result: "",
            conclusion: "",
          },
        ];
  const testRows = tests
    .map(
      (t, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escapeHtml(t.tests)}</td>
      <td>${escapeHtml(t.specifications)}</td>
      <td>${escapeHtml(t.analyzedBy)}</td>
      <td>${escapeHtml(t.result)}</td>
      <td>${escapeHtml(t.conclusion)}</td>
    </tr>
  `,
    )
    .join("");
  const isISugar = isISugarLine(data.productLine);
  const isRTest = isRTestLine(data.productLine);
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
        <div class="coa-header-brand"><img src="${logoUrl}" alt="LDS Logo" /><span>Lab Diagnostic Systems<br/>(SMC) Pvt Ltd</span></div>
        <table class="coa-meta">
          <tr><td>Document No</td><td>${escapeHtml(coaDocumentNo(data.productLine, data.templateKey))}</td></tr>
          <tr><td>Version No</td><td>02</td></tr>
        </table>
      </div>
    </div>
    <table class="coa-cert">
      ${
        isISugar
          ? `<tr><th>Product Name:</th><td colspan="3">${escapeHtml(data.product || data.productTop)}</td></tr>
      <tr><th>Components:</th><td colspan="3">${escapeHtml(data.composition)}</td></tr>
      <tr><th>Product Code:</th><td>${escapeHtml(data.itemCode)}</td><th>Sampling Date:</th><td>${escapeHtml(data.samplingDate)}</td></tr>
      <tr><th>Batch No:</th><td>${escapeHtml(data.batch)}</td><th>Sample Quantity:</th><td>${escapeHtml(data.sampleQuantity)}</td></tr>
      <tr><th>Batch Size:</th><td>${escapeHtml(data.batchSize)}</td><th>Test Completion Date:</th><td>${escapeHtml(data.sampleCompletionDate)}</td></tr>
      <tr><th>Pack Size:</th><td>${escapeHtml(data.packSize)}</td><th>Reporting Date:</th><td>${escapeHtml(data.dateReported)}</td></tr>
      <tr><th>Registration No:</th><td>${escapeHtml(data.reg)}</td><th>Revision No:</th><td>${escapeHtml(data.revisionNo)}</td></tr>
      <tr><th>CAT No:</th><td>${escapeHtml(data.catNo)}</td><th>CoA Issuance Date:</th><td>${escapeHtml(data.issueDate)}</td></tr>
      <tr><th>Test Procedure No:</th><td>${escapeHtml(data.sopNo)}</td><th>Manufacturing Date:</th><td>${escapeHtml(data.mfgDate)}</td></tr>
      <tr><th>Analyst Name:</th><td>${escapeHtml(data.analyzedBy?.name || data.analyzedBy?.title || "QC Analyst")}</td><th>${String(data.templateKey) === "2" ? "Strip Expiry Date:" : "Expiry Date:"}</th><td>${escapeHtml(data.expDate)}</td></tr>`
          : isRTest
            ? `<tr><th>Product Name:</th><td colspan="3">${escapeHtml(data.product || data.productTop)}</td></tr>
      <tr><th>Component:</th><td colspan="3">${escapeHtml(data.component)}</td></tr>
      <tr><th>Product Code:</th><td>${escapeHtml(data.itemCode)}</td><th>Sampling Date:</th><td>${escapeHtml(data.samplingDate)}</td></tr>
      <tr><th>Batch No:</th><td>${escapeHtml(data.batch)}</td><th>Sample Quantity:</th><td>${escapeHtml(data.sampleQuantity)}</td></tr>
      <tr><th>Batch Size:</th><td>${escapeHtml(data.batchSize)}</td><th>Test Completion Date:</th><td>${escapeHtml(data.sampleCompletionDate)}</td></tr>
      <tr><th>Pack Size:</th><td>${escapeHtml(data.packSize)}</td><th>Reporting Date:</th><td>${escapeHtml(data.dateReported)}</td></tr>
      <tr><th>Registration No:</th><td>${escapeHtml(data.reg)}</td><th>Revision No:</th><td>${escapeHtml(data.revisionNo)}</td></tr>
      <tr><th>CAT No:</th><td>${escapeHtml(data.catNo)}</td><th>CoA Issuance Date:</th><td>${escapeHtml(data.issueDate)}</td></tr>
      <tr><th>Specifications:</th><td>${escapeHtml(data.composition)}</td><th>Manufacturing Date:</th><td>${escapeHtml(data.mfgDate)}</td></tr>
      <tr><th>Test Procedure No:</th><td>${escapeHtml(data.sopNo)}</td><th>Expiry Date:</th><td>${escapeHtml(data.expDate)}</td></tr>`
            : `<tr><th>Product Name:</th><td>${escapeHtml(data.product || data.productTop)}</td><th>Sampling Date:</th><td>${escapeHtml(data.samplingDate)}</td></tr>
      <tr><th>Product Code:</th><td>${escapeHtml(data.itemCode)}</td><th>Sample Quantity:</th><td>${escapeHtml(data.sampleQuantity)}</td></tr>
      <tr><th>Nominal Volume:</th><td>${escapeHtml(data.nominalVolume)}</td><th>Sample Completion Date:</th><td>${escapeHtml(data.sampleCompletionDate)}</td></tr>
      <tr><th>Batch No:</th><td>${escapeHtml(data.batch)}</td><th>Reporting Date:</th><td>${escapeHtml(data.dateReported)}</td></tr>
      <tr><th>Batch Size:</th><td>${escapeHtml(data.batchSize)}</td><th>Revision No:</th><td>${escapeHtml(data.revisionNo)}</td></tr>
      <tr><th>Pack Presentation:</th><td>${escapeHtml(data.packSize)}</td><th>CoA Issuance Date:</th><td>${escapeHtml(data.issueDate)}</td></tr>
      <tr><th>Registration No:</th><td>${escapeHtml(data.reg)}</td><th>Manufacturing Date:</th><td>${escapeHtml(data.mfgDate)}</td></tr>
      <tr><th>CAT No:</th><td>${escapeHtml(data.catNo)}</td><th>Expiry Date:</th><td>${escapeHtml(data.expDate)}</td></tr>
      <tr><th>Tube Type:</th><td>${escapeHtml(data.processStage)}</td><th>Test Procedure No:</th><td>${escapeHtml(data.sopNo)}</td></tr>
      <tr><th>Specifications:</th><td colspan="3">${escapeHtml(data.composition)}</td></tr>`
      }
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
    ${(Array.isArray(data.footerNotes) ? data.footerNotes : []).map((note) => `<p class="coa-note">Note ${escapeHtml(note.NoteNo)}: ${escapeHtml(note.Text)}</p>`).join("")}
    ${data.conformity ? `<p class="coa-note"><strong>Statement of Conformity:</strong> ${escapeHtml(conformityStatementText(data))}</p>` : ""}
    <table class="coa-remarks-table">
      <tr><th>REMARKS</th><td>${escapeHtml(data.remarks)}</td></tr>
    </table>
    <table class="coa-sign-table">
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
      ${["released", "reject", "hold"].includes(String(data.status || "").toLowerCase()) ? `<tr><td colspan="3" style="text-align:center;font-weight:700;">${escapeHtml(data.status)}</td></tr>` : ""}
      <tr><td colspan="3">This is SAP-PMS generated Document and does not require signature</td></tr>
    </table>
    <div class="coa-end">End of Document</div>
  </div>
</body>
</html>`;
};

const printCoaData = (data) => {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  // Chrome prints blank from 0x0 iframes — keep real page size, just hide it.
  iframe.style.cssText =
    "position:fixed;left:0;top:0;width:210mm;height:297mm;border:0;opacity:0;pointer-events:none;z-index:-1;";
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
  const [mode, setMode] = useState("create"); // create | edit | view
  const [isSaving, setIsSaving] = useState(false);
  const [pendingSave, setPendingSave] = useState(null);
  const [clearanceTarget, setClearanceTarget] = useState(null);
  const [clearanceStatus, setClearanceStatus] = useState("");
  const [clearanceReview, setClearanceReview] = useState(false);
  const [reports, setReports] = useState([]);
  const [isFetchingReports, setIsFetchingReports] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalReports, setTotalReports] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    productLine: "",
    fromDate: "",
    toDate: "",
  });
  const [statusOptions, setStatusOptions] = useState([]);
  const [productLines, setProductLines] = useState([]);
  const [lineTemplates, setLineTemplates] = useState([]);

  const isReadOnly = mode === "view";

  const canGenerate = hasChildPermission(
    "QC",
    "Certificate of Analysis",
    "Can Generate",
  );
  const canEdit = hasChildPermission(
    "QC",
    "Certificate of Analysis",
    "Can edit",
  );
  const qaPermission = hasChildPermission(
    "QC",
    "Certificate of Analysis",
    "QA Permission",
  );
  const isSuperAdmin = Boolean(user?.isSuperAdmin);
  const qaOnly = qaPermission && !isSuperAdmin;
  const qaStatuses = ["Pending", "Released", "Hold", "Reject"];

  const getUserMeta = () => ({
    createdBy: user?.empId || user?.EmpID || user?.id || user?.emp_id || 0,
    createdByName: user?.FirstName
      ? `${user.FirstName}${user.LastName ? ` ${user.LastName}` : ""}`.trim()
      : user?.name || user?.Name || null,
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
          excludeStatus: clearance ? "Draft" : undefined,
          statusIn:
            qaPermission && !canGenerate && !filters.status
              ? qaStatuses.join(",")
              : undefined,
        },
        skipGlobalLoading: true,
      });
      if (res.data.success) {
        setReports(res.data.data || []);
        setTotalReports(res.data.pagination?.total || 0);
        if (qaPermission && !canGenerate) {
          setStatusOptions(qaStatuses);
        } else if (Array.isArray(res.data.statuses)) {
          setStatusOptions(
            clearance
              ? res.data.statuses.filter(
                  (item) => String(item).toLowerCase() !== "draft",
                )
              : res.data.statuses,
          );
        }
        if (Array.isArray(res.data.productLines))
          setProductLines(res.data.productLines);
      }
    } catch (error) {
      console.error("Error fetching COA reports:", error);
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
        [field]: { ...formData[field], [subField]: value },
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
    setFormData((prev) => ({
      ...prev,
      tests: [
        ...prev.tests,
        {
          id: prev.tests.length + 1,
          tests: "",
          specifications: "",
          analyzedBy: "",
          result: "",
          conclusion: "",
        },
      ],
    }));
  };

  const handleAutoResize = (el) => {
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  };

  const fetchProducts = async (inputValue) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}${API_ENDPOINTS.COMPLAINTS.LOOKUP_ITEMS}?search=${inputValue}&limit=100&type=FG`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await response.json();
      if (data.success) {
        return data.data.map((item) => ({
          value: item.ItemCode,
          label: `${item.ItemCode} - ${item.ItemName}`,
          itemName: item.ItemName,
          productLine: item.U_Prod_line,
        }));
      }
      return [];
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    return date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, "-");
  };

  const fetchUsedBatches = async (itemCode) => {
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.QC.USED_COA_BATCHES, {
        params: { itemCode },
        skipGlobalLoading: true,
      });
      if (res.data.success) {
        return (res.data.data || []).map((b) => String(b));
      }
    } catch (error) {
      console.error("Error fetching used COA batches:", error);
    }
    return [];
  };

  const loadEditBatches = async (itemCode, currentBatch) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}${API_ENDPOINTS.COMPLAINTS.COA_PRODUCT_DETAILS(itemCode)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await response.json();
      const allBatches = Array.isArray(data.data?.batches) ? data.data.batches : [];
      const usedBatches = await fetchUsedBatches(itemCode);
      const availableBatches = allBatches.filter((b) => {
        const batchNo = String(b?.batch || "");
        if (!batchNo) return false;
        if (currentBatch && batchNo === String(currentBatch)) return true;
        return !usedBatches.includes(batchNo);
      });
      setBatchOptions(availableBatches);
    } catch (error) {
      console.error("Error loading edit batches:", error);
    }
  };

  const fetchProductDetails = async (itemCode, productLineStr) => {
    if (!itemCode) return;
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}${API_ENDPOINTS.COMPLAINTS.COA_PRODUCT_DETAILS(itemCode)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();

      let presetTests = emptyForm().tests;
      let templateHeader = null;
      let templateFooter = null;
      let templateRows = [];

      try {
        if (productLineStr) {
          const templateRes = await axiosInstance.get(
            API_ENDPOINTS.QC.GET_TEMPLATE_BY_LINE,
            {
              params: { line: productLineStr },
              skipGlobalLoading: true,
            },
          );
          templateRows = Array.isArray(templateRes.data?.data)
            ? templateRes.data.data
            : [];
          setLineTemplates(templateRows);
          if (templateRows.length === 1) {
            const row = templateRows[0];
            const parsedTests = parseTemplateJson(row.Description, null);
            templateHeader = parseTemplateJson(row.Header, {});
            templateFooter = parseTemplateJson(row.Footer, {});
            if (Array.isArray(parsedTests)) {
              const filled = (value) => String(value ?? "").trim() !== "";
              presetTests = parsedTests.map((t, i) => {
                const tests = t.Test || t.test || "";
                const specifications =
                  t.Specifications || t.specification || "";
                const analyzedBy = t.AnalyzedBy || "";
                const result = t.Results || t.result || "";
                const conclusion = t.Conclusion || "";
                return {
                  id: t.SrNo || i + 1,
                  tests,
                  specifications,
                  analyzedBy,
                  result,
                  conclusion,
                  testsLocked: filled(tests),
                  specificationsLocked: filled(specifications),
                  analyzedByLocked: filled(analyzedBy),
                  resultLocked: filled(result),
                  conclusionLocked: filled(conclusion),
                };
              });
            }
          }
        }
      } catch (err) {
        console.error("Error fetching line template:", err);
      }

      if (data.success && data.data) {
        const details = data.data;
        const allBatches = Array.isArray(details.batches)
          ? details.batches
          : [];
        const usedBatches = await fetchUsedBatches(itemCode);
        // Keep current batch available when editing the same COA
        const keepBatch =
          mode === "edit" || mode === "view" ? formData.batch : "";
        const availableBatches = allBatches.filter((b) => {
          const batchNo = String(b?.batch || "");
          if (!batchNo) return false;
          if (keepBatch && batchNo === String(keepBatch)) return true;
          return !usedBatches.includes(batchNo);
        });
        const firstBatch = availableBatches[0];
        setBatchOptions(availableBatches);

        setFormData((prev) => ({
          ...prev,
          product: details["PRODUCT"] || "",
          batch: firstBatch?.batch || "",
          batchSize: firstBatch?.batchSize || details["BATCH SIZE"] || "",
          processStage: details["PROCESS STAGE"] || "",
          catNo: details["CAT NO."] || "",
          packSize:
            templateHeader?.["Pack Presentation"] || details["PACK SIZE"] || "",
          mfgDate: firstBatch ? formatDate(firstBatch.mfgDate) || "" : "",
          expDate: firstBatch ? formatDate(firstBatch.expDate) || "" : "",
          dateReported: formatDate(details["DATE REPORTED"]) || "",
          composition:
            templateHeader?.Composition ||
            templateHeader?.Specifications ||
            details["COMPOSITION"] ||
            prev.composition,
          reg: "",
          revisionNo: templateHeader?.["Revision No"] || prev.revisionNo,
          sopNo:
            templateHeader?.["Test Procedure No"] || firstBatch?.bmrNo || "",
          footerNotes: templateFooter?.Notes || [],
          conformityOptions:
            templateFooter?.StatementOfConformity?.Options || [],
          conformity: "",
          templateKey:
            templateRows.length === 1 ? String(templateRows[0].ID) : "",
          tests: presetTests,
          testsFromTemplate: Boolean(templateHeader),
          locked: {
            batchSize: Boolean(firstBatch?.batchSize || details["BATCH SIZE"]),
            processStage: Boolean(details["PROCESS STAGE"]),
            catNo: Boolean(details["CAT NO."]),
            packSize: Boolean(
              templateHeader?.["Pack Presentation"] || details["PACK SIZE"],
            ),
            mfgDate: Boolean(firstBatch?.mfgDate),
            expDate: Boolean(firstBatch?.expDate),
            dateReported: Boolean(details["DATE REPORTED"]),
            composition: Boolean(
              templateHeader?.Composition ||
              templateHeader?.Specifications ||
              details["COMPOSITION"],
            ),
            revisionNo: Boolean(templateHeader?.["Revision No"]),
            sopNo: Boolean(
              templateHeader?.["Test Procedure No"] || firstBatch?.bmrNo,
            ),
          },
          remarks: prev.remarks,
        }));
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
    }
  };

  const buildPayload = (status) => {
    const userMeta = getUserMeta();
    return {
      coaNo: formData.coaNo,
      status,
      formNo: JSON.stringify({
        nominalVolume: formData.nominalVolume,
        component: formData.component,
        samplingDate: formData.samplingDate,
        sampleQuantity: formData.sampleQuantity,
        sampleCompletionDate: formData.sampleCompletionDate,
        conformity: formData.conformity,
        templateKey: formData.templateKey,
        approvalStatus: formData.approvalStatus,
      }),
      issueDate: formData.issueDate,
      itemCode: formData.itemCode || selectedProduct?.value || "",
      itemName: formData.itemName || selectedProduct?.itemName || "",
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
      updatedByName: userMeta.createdByName,
    };
  };

  const handleSave = async (status) => {
    if (isReadOnly) return false;
    if (!formData.itemCode && !selectedProduct?.value) {
      toast.error("Please select a product first.");
      return false;
    }

    try {
      setIsSaving(true);
      const saveStatus =
        status === "Draft" &&
        String(formData.status || "").toLowerCase() === "hold"
          ? "Hold"
          : status;
      const res = await axiosInstance.post(
        API_ENDPOINTS.QC.SAVE_COA_REPORT,
        buildPayload(saveStatus),
        {
          skipGlobalLoading: true,
        },
      );
      if (res.data.success) {
        toast.success(res.data.message || "Saved successfully");
        handleCloseForm();
        if (page !== 1) {
          setPage(1);
        } else {
          fetchReports(1, limit);
        }
        return true;
      }
      toast.error(res.data.message || "Failed to save COA");
      return false;
    } catch (error) {
      console.error("Error saving COA:", error);
      toast.error("An error occurred while saving the COA");
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
        toast.error(res.data?.message || "Failed to update status");
        return;
      }
      toast.success(res.data.message || "Status updated");
      setClearanceTarget(null);
      setClearanceStatus("");
      setClearanceReview(false);
      handleCloseForm();
      fetchReports(page, limit);
    } catch (error) {
      console.error("Error updating COA status:", error);
      toast.error("Failed to update status");
    } finally {
      setIsSaving(false);
    }
  };

  const mapReportToForm = (data) => ({
    coaNo: data.COA_No,
    status: data.Status || "Draft",
    formNo: data.FormNo || "",
    issueDate: data.IssueDate || getTodayFormatted(),
    itemCode: data.ItemCode || "",
    itemName: data.ItemName || "",
    productTop: data.ProductTop || "",
    productLine: data.ProductLine || "",
    composition: data.Composition || "",
    product: data.Product || "",
    catNo: data.CatNo || "",
    batch: data.BatchNo || "",
    packSize: data.PackSize || "",
    batchSize: data.BatchSize || "",
    mfgDate: data.MfgDate || "",
    sopNo: data.SopNo || "",
    expDate: data.ExpDate || "",
    processStage: data.ProcessStage || "",
    revisionNo: data.RevisionNo || "",
    reg: data.RegNo || "",
    dateReported: data.DateReported || "",
    ...readHeaderExtras(data.FormNo),
    tests: (data.tests || []).map((t, i) => {
      const filled = (value) => String(value ?? "").trim() !== "";
      const tests = t.Tests || "";
      const specifications = t.Specifications || "";
      const analyzedBy = t.AnalyzedBy || "";
      const result = t.Result || "";
      const conclusion = t.Conclusion || "";
      return {
        id: t.LineId || i + 1,
        tests,
        specifications,
        analyzedBy,
        result,
        conclusion,
        testsLocked: filled(tests),
        specificationsLocked: filled(specifications),
        analyzedByLocked: filled(analyzedBy),
        resultLocked: filled(result),
        conclusionLocked: filled(conclusion),
      };
    }),
    testsFromTemplate: (data.tests || []).length > 0,
    locked: {
      composition: Boolean(data.Composition),
      packSize: Boolean(data.PackSize),
      revisionNo: Boolean(data.RevisionNo),
      sopNo: Boolean(data.SopNo),
      batchSize: Boolean(data.BatchSize),
      catNo: Boolean(data.CatNo),
      processStage: Boolean(data.ProcessStage),
      mfgDate: Boolean(data.MfgDate),
      expDate: Boolean(data.ExpDate),
      dateReported: Boolean(data.DateReported),
    },
    remarks: data.Remarks || "",
    analyzedBy: {
      name: data.AnalyzedByName || "",
      title: data.AnalyzedByTitle || "",
      date: data.AnalyzedByDate || "",
    },
    checkedBy: {
      name: data.CheckedByName || "",
      title: data.CheckedByTitle || "",
      date: data.CheckedByDate || "",
    },
    approvedBy: {
      name: data.ApprovedByName || "",
      title: data.ApprovedByTitle || "",
      date: data.ApprovedByDate || "",
    },
  });

  const loadReport = async (coaNo, nextMode) => {
    try {
      const res = await axiosInstance.get(
        API_ENDPOINTS.QC.GET_COA_REPORT(coaNo),
        {
          skipGlobalLoading: true,
        },
      );
      if (!res.data.success || !res.data.data) {
        toast.error(res.data.message || "Failed to load COA report");
        return;
      }
      const data = res.data.data;
      const mapped = mapReportToForm(data);
      setFormData(
        mapped.tests.length ? mapped : { ...mapped, tests: emptyForm().tests },
      );
      setSelectedProduct(
        data.ItemCode
          ? {
              value: data.ItemCode,
              label:
                data.ProductTop ||
                `${data.ItemCode}${data.ItemName ? ` - ${data.ItemName}` : ""}`,
              itemName: data.ItemName,
              productLine: data.ProductLine,
            }
          : null,
      );
      setBatchOptions([]);
      setMode(nextMode);
      setShowForm(true);
      if (nextMode === "edit" && data.ItemCode) {
        loadEditBatches(data.ItemCode, data.BatchNo || "");
      }
      if (data.ProductLine) {
        try {
          const templateRes = await axiosInstance.get(
            API_ENDPOINTS.QC.GET_TEMPLATE_BY_LINE,
            {
              params: { line: data.ProductLine },
              skipGlobalLoading: true,
            },
          );
          const templateRows = Array.isArray(templateRes.data?.data)
            ? templateRes.data.data
            : [];
          setLineTemplates(templateRows);
          if (templateRows[0]) {
            const footer = parseTemplateJson(templateRows[0].Footer, {});
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
          console.error("Error loading template footer:", err);
        }
      }
    } catch (error) {
      console.error("Error loading COA report:", error);
      toast.error("Failed to load COA report");
    }
  };

  const handleCreateNew = () => {
    setFormData(emptyForm());
    setSelectedProduct(null);
    setBatchOptions([]);
    setLineTemplates([]);
    setMode("create");
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormData(emptyForm());
    setSelectedProduct(null);
    setBatchOptions([]);
    setLineTemplates([]);
    setMode("create");
    setClearanceReview(false);
    setClearanceTarget(null);
    setClearanceStatus("");
  };

  const handleDirectPrint = async (coaNo) => {
    try {
      const res = await axiosInstance.get(
        API_ENDPOINTS.QC.GET_COA_REPORT(coaNo),
        {
          skipGlobalLoading: true,
        },
      );
      if (!res.data.success || !res.data.data) {
        toast.error(res.data.message || "Failed to load COA report");
        return;
      }
      const mapped = mapReportToForm(res.data.data);
      let printData = mapped.tests.length
        ? mapped
        : { ...mapped, tests: emptyForm().tests };
      if (printData.productLine && !printData.conformityOptions?.length) {
        try {
          const templateRes = await axiosInstance.get(
            API_ENDPOINTS.QC.GET_TEMPLATE_BY_LINE,
            {
              params: { line: printData.productLine },
              skipGlobalLoading: true,
            },
          );
          const options = (
            Array.isArray(templateRes.data?.data) ? templateRes.data.data : []
          ).flatMap((row) => {
            const footer = parseTemplateJson(row.Footer, {});
            return footer?.StatementOfConformity?.Options || [];
          });
          printData = { ...printData, conformityOptions: options };
        } catch (err) {
          console.error("Error loading conformity text:", err);
        }
      }
      printCoaData(printData);
    } catch (error) {
      console.error("Error printing COA report:", error);
      toast.error("Failed to print COA report");
    }
  };

  const handleFormPrint = () => {
    printCoaData(formData);
  };

  const customSelectStyles = {
    control: (base) => ({
      ...base,
      background: "#f8fafc",
      border: "1px solid #c5cdd8",
      borderRadius: "3px",
      boxShadow: "none",
      minHeight: "28px",
      height: "28px",
    }),
    valueContainer: (base) => ({
      ...base,
      height: "26px",
      padding: "0 6px",
    }),
    indicatorsContainer: (base) => ({
      ...base,
      height: "26px",
    }),
    dropdownIndicator: (base) => ({
      ...base,
      padding: "0 4px",
    }),
    clearIndicator: (base) => ({
      ...base,
      padding: "0 4px",
    }),
    indicatorSeparator: () => ({ display: "none" }),
    singleValue: (base) => ({
      ...base,
      color: "#333",
      fontWeight: "normal",
      fontSize: "13px",
    }),
    input: (base, state) => ({
      ...base,
      color: "#333",
      margin: 0,
      padding: 0,
      background: "transparent",
      border: "none",
      boxShadow: "none",
      outline: "none",
      // Hide blinking caret in front of selected value until user types to search
      caretColor: state.selectProps.inputValue ? "#333" : "transparent",
    }),
    placeholder: (base) => ({
      ...base,
      color: "#888",
      fontSize: "13px",
    }),
    menu: (base) => ({
      ...base,
      background: "#fff",
      color: "#333",
      zIndex: 20,
    }),
  };

  const reportColumns = [
    {
      key: "ItemCode",
      header: "Item No",
      width: "14%",
      render: (row) => row.ItemCode || "—",
    },
    {
      key: "ItemName",
      header: "Item Name",
      width: "24%",
      render: (row) => row.ItemName || row.Product || "—",
    },
    {
      key: "BatchNo",
      header: "Batch",
      width: "12%",
      render: (row) => row.BatchNo || "—",
    },
    {
      key: "CreatedByName",
      header: "Created By",
      width: "14%",
      render: (row) => row.CreatedByName || row.CreatedBy || "—",
    },
    {
      key: "CreatedAt",
      header: "Date",
      width: "12%",
      render: (row) =>
        row.CreatedAt
          ? new Date(row.CreatedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "—",
    },
    {
      key: "Status",
      header: "Status",
      width: "12%",
      render: (row) => (
        <span
          className={`coa-status-badge coa-status-${(row.Status || "").toLowerCase()}`}
        >
          {row.Status || "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "12%",
      render: (row) => (
        <div className="coa-report-actions">
          {(!qaOnly ||
            String(row.Status || "").toLowerCase() === "released") && (
            <button
              type="button"
              className="dome-table-action-btn dome-table-action-btn--list"
              title="View"
              onClick={(e) => {
                e.stopPropagation();
                setClearanceReview(false);
                loadReport(row.COA_No, "view");
              }}
            >
              <IconEye size={16} stroke={2} />
            </button>
          )}
          {!qaOnly &&
            !clearance &&
            (canEdit || isSuperAdmin) &&
            ["draft", "hold"].includes(
              String(row.Status || "").toLowerCase(),
            ) && (
              <button
                type="button"
                className="dome-table-action-btn dome-table-action-btn--info"
                title="Edit"
                onClick={(e) => {
                  e.stopPropagation();
                  loadReport(row.COA_No, "edit");
                }}
              >
                <IconEdit size={16} stroke={2} />
              </button>
            )}
          {qaOnly &&
            ["pending", "generated", "hold"].includes(
              String(row.Status || "").toLowerCase(),
            ) && (
              <button
                type="button"
                className="dome-table-action-btn dome-table-action-btn--list"
                title="QA clearance"
                onClick={(e) => {
                  e.stopPropagation();
                  setClearanceTarget(row);
                  setClearanceStatus("");
                  setClearanceReview(true);
                  loadReport(row.COA_No, "view");
                }}
              >
                <IconHourglass size={16} stroke={2} />
              </button>
            )}
          {!clearance &&
            String(row.Status || "").toLowerCase() === "released" && (
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
      ),
    },
  ];

  return (
    <div
      className={`coa-document-wrapper coa-wrapper-centered${clearance ? " qa-clearance-page" : ""}`}
    >
      <Toaster position="top-right" />

      {(Boolean(user?.isSuperAdmin) || (canGenerate && !qaPermission)) &&
        !clearance && (
          <div
            className={`coa-create-header no-print${showForm ? " coa-section-hidden" : ""}`}
          >
            <Button
              variant="primary"
              onClick={handleCreateNew}
              icon={<IconPlus size={18} />}
            >
              Create New
            </Button>
          </div>
        )}

      {showForm && (
        <div className="coa-document-container">
          {/* Top Header Outside Document */}
          <div className="coa-form-top-bar no-print">
            <Button
              variant="outline"
              icon={<IconArrowLeft size={16} />}
              onClick={handleCloseForm}
            >
              Back
            </Button>
          </div>
          <div className="coa-top-header no-print">
            <div className="coa-top-title">{formData.productLine || ""}</div>
            {mode !== "view" &&
                formData.itemCode &&
                lineTemplates.length > 1 && (
                  <label className="coa-template-pick">
                    <span>Template</span>
                    <select
                      value={formData.templateKey || ""}
                      onChange={(e) => {
                        const row = lineTemplates.find(
                          (item) => String(item.ID) === e.target.value,
                        );
                        if (!row) return;
                        const parsedTests = parseTemplateJson(
                          row.Description,
                          [],
                        );
                        const templateHeader = parseTemplateJson(
                          row.Header,
                          {},
                        );
                        const templateFooter = parseTemplateJson(
                          row.Footer,
                          {},
                        );
                        const filled = (value) =>
                          String(value ?? "").trim() !== "";
                        setFormData((prev) => ({
                          ...prev,
                          templateKey: String(row.ID),
                          packSize:
                            templateHeader?.["Pack Presentation"] ||
                            prev.packSize,
                          composition:
                            templateHeader?.Composition ||
                            templateHeader?.Specifications ||
                            prev.composition,
                          revisionNo:
                            templateHeader?.["Revision No"] || prev.revisionNo,
                          sopNo:
                            templateHeader?.["Test Procedure No"] || prev.sopNo,
                          testsFromTemplate: true,
                          locked: {
                            ...(prev.locked || {}),
                            composition: Boolean(
                              templateHeader?.Composition ||
                              templateHeader?.Specifications ||
                              prev.composition,
                            ),
                            packSize: Boolean(
                              templateHeader?.["Pack Presentation"] ||
                              prev.packSize,
                            ),
                            revisionNo: Boolean(
                              templateHeader?.["Revision No"] ||
                              prev.revisionNo,
                            ),
                            sopNo: Boolean(
                              templateHeader?.["Test Procedure No"] ||
                              prev.sopNo,
                            ),
                          },
                          footerNotes: templateFooter?.Notes || [],
                          conformityOptions:
                            templateFooter?.StatementOfConformity?.Options ||
                            [],
                          tests: Array.isArray(parsedTests)
                            ? parsedTests.map((t, i) => ({
                                id: t.SrNo || i + 1,
                                tests: t.Test || t.test || "",
                                specifications:
                                  t.Specifications || t.specification || "",
                                analyzedBy: t.AnalyzedBy || "",
                                result: t.Results || t.result || "",
                                conclusion: t.Conclusion || "",
                                testsLocked: filled(t.Test || t.test),
                                specificationsLocked: filled(
                                  t.Specifications || t.specification,
                                ),
                                analyzedByLocked: filled(t.AnalyzedBy),
                                resultLocked: filled(t.Results || t.result),
                                conclusionLocked: filled(t.Conclusion),
                              }))
                            : prev.tests,
                        }));
                      }}
                    >
                      <option value="">Select template</option>
                      {lineTemplates.map((item) => (
                        <option key={item.ID} value={item.ID}>
                          {`ID ${item.ID}${item.TemplateName ? ` — ${item.TemplateName}` : ""}`}
                        </option>
                      ))}
                    </select>
                  </label>
            )}
          </div>

          <div
            className={`coa-document${isReadOnly ? " coa-document--readonly" : ""}`}
          >
            {/* Header Section */}
            <div className="coa-header coa-cert-head">
              <div className="coa-title-section">
                <h2>LAB DIAGNOSTIC SYSTEMS (SMC) PRIVATE LIMITED</h2>
                <p>Plot No 36-A, PSIC, SIE, Taxila – Rawalpindi, Pakistan</p>
                <h3>CERTIFICATE OF ANALYSIS</h3>
                <h4>(Finished Product)</h4>
              </div>
              <div className="coa-form-info">
                <div className="coa-header-brand">
                  <img
                    src="/images/ldslogo.png"
                    alt="LDS Logo"
                    className="coa-header-logo-img"
                  />
                  <span>
                    Lab Diagnostic Systems
                    (SMC) Pvt Ltd
                  </span>
                </div>
                <table className="coa-meta">
                  <tbody>
                    <tr>
                      <td>Document No</td>
                      <td>{coaDocumentNo(formData.productLine, formData.templateKey)}</td>
                    </tr>
                    <tr>
                      <td>Version No</td>
                      <td>02</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <table className="coa-cert">
              <tbody>
                <tr>
                  <th>Product Name:</th>
                  <td
                    colSpan={
                      isISugarLine(formData.productLine) ||
                      isRTestLine(formData.productLine)
                        ? 3
                        : 1
                    }
                  >
                    {isReadOnly ? (
                      formData.product || formData.productTop || "—"
                    ) : (
                      <AsyncSelect
                        cacheOptions
                        defaultOptions
                        loadOptions={fetchProducts}
                        value={selectedProduct}
                        onChange={(selected) => {
                          setSelectedProduct(selected);
                          setFormData((prev) => ({
                            ...prev,
                            itemCode: selected ? selected.value : "",
                            itemName: selected ? selected.itemName || "" : "",
                            productTop: selected ? selected.label : "",
                            product: selected
                              ? selected.itemName || selected.label || ""
                              : "",
                            productLine: selected ? selected.productLine : "",
                          }));
                          if (selected && selected.value)
                            fetchProductDetails(
                              selected.value,
                              selected.productLine,
                            );
                        }}
                        styles={customSelectStyles}
                        placeholder="Search Product..."
                        isClearable
                      />
                    )}
                  </td>
                  {!isISugarLine(formData.productLine) &&
                    !isRTestLine(formData.productLine) && (
                      <>
                        <th>Sampling Date:</th>
                        <td>
                          <CoaDateInput
                            value={formData.samplingDate}
                            onChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                samplingDate: value,
                              }))
                            }
                            readOnly={isReadOnly}
                          />
                        </td>
                      </>
                    )}
                </tr>
                {isISugarLine(formData.productLine) ? (
                  <>
                    <tr>
                      <th>Components:</th>
                      <td colSpan={3}>
                        <textarea
                          value={formData.composition}
                          readOnly={isReadOnly || formData.locked?.composition}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>Product Code:</th>
                      <td>
                        <input
                          type="text"
                          value={formData.itemCode}
                          readOnly
                          placeholder="fetch by system"
                        />
                      </td>
                      <th>Sampling Date:</th>
                      <td>
                        <CoaDateInput
                          value={formData.samplingDate}
                          onChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              samplingDate: value,
                            }))
                          }
                          readOnly={isReadOnly}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>Batch No:</th>
                      <td>
                        {isReadOnly ||
                        (mode === "create" && batchOptions.length <= 1) ? (
                          formData.batch || "—"
                        ) : (
                          <Select
                            value={
                              formData.batch
                                ? {
                                    value: formData.batch,
                                    label: formData.batch,
                                  }
                                : null
                            }
                            onChange={(selected) => {
                              const match = batchOptions.find(
                                (batch) => batch.batch === selected?.value,
                              );
                              setFormData((prev) => ({
                                ...prev,
                                batch: selected ? selected.value : "",
                                batchSize: match?.batchSize || prev.batchSize,
                                sopNo: match?.bmrNo || prev.sopNo,
                                mfgDate: match
                                  ? formatDate(match.mfgDate)
                                  : prev.mfgDate,
                                expDate: match
                                  ? formatDate(match.expDate)
                                  : prev.expDate,
                              }));
                            }}
                            options={batchOptions.map((batch) => ({
                              value: batch.batch,
                              label: batch.batch,
                            }))}
                            styles={customSelectStyles}
                            placeholder="Select batch..."
                            isClearable
                            isSearchable
                          />
                        )}
                      </td>
                      <th>Sample Quantity:</th>
                      <td>
                        <input
                          type="text"
                          value={formData.sampleQuantity}
                          onChange={(e) =>
                            handleInputChange(e, "sampleQuantity")
                          }
                          readOnly={isReadOnly}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>Batch Size:</th>
                      <td>
                        <input
                          type="text"
                          value={formData.batchSize}
                          readOnly={isReadOnly || formData.locked?.batchSize}
                        />
                      </td>
                      <th>Test Completion Date:</th>
                      <td>
                        <CoaDateInput
                          value={formData.sampleCompletionDate}
                          onChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              sampleCompletionDate: value,
                            }))
                          }
                          readOnly={isReadOnly}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>Pack Size:</th>
                      <td>
                        <input
                          type="text"
                          value={formData.packSize}
                          readOnly={isReadOnly || formData.locked?.packSize}
                        />
                      </td>
                      <th>Reporting Date:</th>
                      <td>
                        <CoaDateInput
                          value={formData.dateReported}
                          onChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              dateReported: value,
                            }))
                          }
                          readOnly={isReadOnly || formData.locked?.dateReported}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>Registration No:</th>
                      <td>
                        <input
                          type="text"
                          value={formData.reg}
                          onChange={(e) => handleInputChange(e, "reg")}
                          readOnly={isReadOnly}
                        />
                      </td>
                      <th>Revision No:</th>
                      <td>
                        <input
                          type="text"
                          value={formData.revisionNo}
                          onChange={(e) => handleInputChange(e, "revisionNo")}
                          readOnly={isReadOnly || formData.locked?.revisionNo}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>CAT No:</th>
                      <td>
                        <input
                          type="text"
                          value={formData.catNo}
                          readOnly={isReadOnly || formData.locked?.catNo}
                        />
                      </td>
                      <th>CoA Issuance Date:</th>
                      <td>
                        <CoaDateInput
                          value={formData.issueDate}
                          onChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              issueDate: value,
                            }))
                          }
                          readOnly
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>Test Procedure No:</th>
                      <td>
                        <input
                          type="text"
                          value={formData.sopNo}
                          readOnly={isReadOnly || formData.locked?.sopNo}
                        />
                      </td>
                      <th>Manufacturing Date:</th>
                      <td>
                        <CoaDateInput
                          value={formData.mfgDate}
                          onChange={(value) =>
                            setFormData((prev) => ({ ...prev, mfgDate: value }))
                          }
                          readOnly={isReadOnly || formData.locked?.mfgDate}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>Analyst Name:</th>
                      <td>
                        <input
                          type="text"
                          value={
                            formData.analyzedBy?.name ||
                            formData.analyzedBy?.title ||
                            "QC Analyst"
                          }
                          readOnly
                        />
                      </td>
                      <th>
                        {String(formData.templateKey) === "2"
                          ? "Strip Expiry Date:"
                          : "Expiry Date:"}
                      </th>
                      <td>
                        <CoaDateInput
                          value={formData.expDate}
                          onChange={(value) =>
                            setFormData((prev) => ({ ...prev, expDate: value }))
                          }
                          readOnly={isReadOnly || formData.locked?.expDate}
                        />
                      </td>
                    </tr>
                  </>
                ) : isRTestLine(formData.productLine) ? (
                  <>
                    <tr>
                      <th>Component:</th>
                      <td colSpan={3}>
                        <textarea
                          value={formData.component || ""}
                          onChange={(e) => handleInputChange(e, "component")}
                          readOnly={isReadOnly}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>Product Code:</th>
                      <td>
                        <input
                          type="text"
                          value={formData.itemCode}
                          readOnly
                          placeholder="fetch by system"
                        />
                      </td>
                      <th>Sampling Date:</th>
                      <td>
                        <CoaDateInput
                          value={formData.samplingDate}
                          onChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              samplingDate: value,
                            }))
                          }
                          readOnly={isReadOnly}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>Batch No:</th>
                      <td>
                        {isReadOnly ||
                        (mode === "create" && batchOptions.length <= 1) ? (
                          formData.batch || "—"
                        ) : (
                          <Select
                            value={
                              formData.batch
                                ? {
                                    value: formData.batch,
                                    label: formData.batch,
                                  }
                                : null
                            }
                            onChange={(selected) => {
                              const match = batchOptions.find(
                                (batch) => batch.batch === selected?.value,
                              );
                              setFormData((prev) => ({
                                ...prev,
                                batch: selected ? selected.value : "",
                                batchSize: match?.batchSize || prev.batchSize,
                                sopNo: match?.bmrNo || prev.sopNo,
                                mfgDate: match
                                  ? formatDate(match.mfgDate)
                                  : prev.mfgDate,
                                expDate: match
                                  ? formatDate(match.expDate)
                                  : prev.expDate,
                              }));
                            }}
                            options={batchOptions.map((batch) => ({
                              value: batch.batch,
                              label: batch.batch,
                            }))}
                            styles={customSelectStyles}
                            placeholder="Select batch..."
                            isClearable
                            isSearchable
                          />
                        )}
                      </td>
                      <th>Sample Quantity:</th>
                      <td>
                        <input
                          type="text"
                          value={formData.sampleQuantity}
                          onChange={(e) =>
                            handleInputChange(e, "sampleQuantity")
                          }
                          readOnly={isReadOnly}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>Batch Size:</th>
                      <td>
                        <input
                          type="text"
                          value={formData.batchSize}
                          readOnly={isReadOnly || formData.locked?.batchSize}
                        />
                      </td>
                      <th>Test Completion Date:</th>
                      <td>
                        <CoaDateInput
                          value={formData.sampleCompletionDate}
                          onChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              sampleCompletionDate: value,
                            }))
                          }
                          readOnly={isReadOnly}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>Pack Size:</th>
                      <td>
                        <input
                          type="text"
                          value={formData.packSize}
                          readOnly={isReadOnly || formData.locked?.packSize}
                        />
                      </td>
                      <th>Reporting Date:</th>
                      <td>
                        <CoaDateInput
                          value={formData.dateReported}
                          onChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              dateReported: value,
                            }))
                          }
                          readOnly={isReadOnly || formData.locked?.dateReported}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>Registration No:</th>
                      <td>
                        <input
                          type="text"
                          value={formData.reg}
                          onChange={(e) => handleInputChange(e, "reg")}
                          readOnly={isReadOnly}
                        />
                      </td>
                      <th>Revision No:</th>
                      <td>
                        <input
                          type="text"
                          value={formData.revisionNo}
                          onChange={(e) => handleInputChange(e, "revisionNo")}
                          readOnly={isReadOnly || formData.locked?.revisionNo}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>CAT No:</th>
                      <td>
                        <input
                          type="text"
                          value={formData.catNo}
                          readOnly={isReadOnly || formData.locked?.catNo}
                        />
                      </td>
                      <th>CoA Issuance Date:</th>
                      <td>
                        <CoaDateInput
                          value={formData.issueDate}
                          onChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              issueDate: value,
                            }))
                          }
                          readOnly
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>Specifications:</th>
                      <td>
                        <textarea
                          value={formData.composition}
                          readOnly={isReadOnly || formData.locked?.composition}
                        />
                      </td>
                      <th>Manufacturing Date:</th>
                      <td>
                        <CoaDateInput
                          value={formData.mfgDate}
                          onChange={(value) =>
                            setFormData((prev) => ({ ...prev, mfgDate: value }))
                          }
                          readOnly={isReadOnly || formData.locked?.mfgDate}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>Test Procedure No:</th>
                      <td>
                        <input
                          type="text"
                          value={formData.sopNo}
                          readOnly={isReadOnly || formData.locked?.sopNo}
                        />
                      </td>
                      <th>
                        {String(formData.templateKey) === "2"
                          ? "Strip Expiry Date:"
                          : "Expiry Date:"}
                      </th>
                      <td>
                        <CoaDateInput
                          value={formData.expDate}
                          onChange={(value) =>
                            setFormData((prev) => ({ ...prev, expDate: value }))
                          }
                          readOnly={isReadOnly || formData.locked?.expDate}
                        />
                      </td>
                    </tr>
                  </>
                ) : (
                  <>
                    <tr>
                      <th>Product Code:</th>
                      <td>
                        <input
                          type="text"
                          value={formData.itemCode}
                          readOnly
                          placeholder="fetch by system"
                        />
                      </td>
                      <th>Sample Quantity:</th>
                      <td>
                        <input
                          type="text"
                          value={formData.sampleQuantity}
                          onChange={(e) =>
                            handleInputChange(e, "sampleQuantity")
                          }
                          readOnly={isReadOnly}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>Nominal Volume:</th>
                      <td>
                        <input
                          type="text"
                          value={formData.nominalVolume}
                          onChange={(e) =>
                            handleInputChange(e, "nominalVolume")
                          }
                          readOnly={isReadOnly}
                        />
                      </td>
                      <th>Test Completion Date:</th>
                      <td>
                        <CoaDateInput
                          value={formData.sampleCompletionDate}
                          onChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              sampleCompletionDate: value,
                            }))
                          }
                          readOnly={isReadOnly}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>Batch No:</th>
                      <td>
                        {isReadOnly ||
                        (mode === "create" && batchOptions.length <= 1) ? (
                          formData.batch || "—"
                        ) : (
                          <Select
                            value={
                              formData.batch
                                ? {
                                    value: formData.batch,
                                    label: formData.batch,
                                  }
                                : null
                            }
                            onChange={(selected) => {
                              const match = batchOptions.find(
                                (batch) => batch.batch === selected?.value,
                              );
                              setFormData((prev) => ({
                                ...prev,
                                batch: selected ? selected.value : "",
                                batchSize: match?.batchSize || prev.batchSize,
                                sopNo: match?.bmrNo || prev.sopNo,
                                mfgDate: match
                                  ? formatDate(match.mfgDate)
                                  : prev.mfgDate,
                                expDate: match
                                  ? formatDate(match.expDate)
                                  : prev.expDate,
                              }));
                            }}
                            options={batchOptions.map((batch) => ({
                              value: batch.batch,
                              label: batch.batch,
                            }))}
                            styles={customSelectStyles}
                            placeholder="Select batch..."
                            isClearable
                            isSearchable
                          />
                        )}
                      </td>
                      <th>Reporting Date:</th>
                      <td>
                        <CoaDateInput
                          value={formData.dateReported}
                          onChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              dateReported: value,
                            }))
                          }
                          readOnly={isReadOnly || formData.locked?.dateReported}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>Batch Size:</th>
                      <td>
                        <input
                          type="text"
                          value={formData.batchSize}
                          readOnly={isReadOnly || formData.locked?.batchSize}
                        />
                      </td>
                      <th>Revision No:</th>
                      <td>
                        <input
                          type="text"
                          value={formData.revisionNo}
                          onChange={(e) => handleInputChange(e, "revisionNo")}
                          readOnly={isReadOnly || formData.locked?.revisionNo}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>Pack Presentation:</th>
                      <td>
                        <input
                          type="text"
                          value={formData.packSize}
                          readOnly={isReadOnly || formData.locked?.packSize}
                        />
                      </td>
                      <th>CoA Issuance Date:</th>
                      <td>
                        <CoaDateInput
                          value={formData.issueDate}
                          onChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              issueDate: value,
                            }))
                          }
                          readOnly
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>Registration No:</th>
                      <td>
                        <input
                          type="text"
                          value={formData.reg}
                          onChange={(e) => handleInputChange(e, "reg")}
                          readOnly={isReadOnly}
                        />
                      </td>
                      <th>Manufacturing Date:</th>
                      <td>
                        <CoaDateInput
                          value={formData.mfgDate}
                          onChange={(value) =>
                            setFormData((prev) => ({ ...prev, mfgDate: value }))
                          }
                          readOnly={isReadOnly || formData.locked?.mfgDate}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>CAT No:</th>
                      <td>
                        <input
                          type="text"
                          value={formData.catNo}
                          readOnly={isReadOnly || formData.locked?.catNo}
                        />
                      </td>
                      <th>
                        {String(formData.templateKey) === "2"
                          ? "Strip Expiry Date:"
                          : "Expiry Date:"}
                      </th>
                      <td>
                        <CoaDateInput
                          value={formData.expDate}
                          onChange={(value) =>
                            setFormData((prev) => ({ ...prev, expDate: value }))
                          }
                          readOnly={isReadOnly || formData.locked?.expDate}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>Tube Type:</th>
                      <td>
                        <input
                          type="text"
                          value={formData.processStage}
                          readOnly={isReadOnly || formData.locked?.processStage}
                        />
                      </td>
                      <th>Test Procedure No:</th>
                      <td>
                        <input
                          type="text"
                          value={formData.sopNo}
                          readOnly={isReadOnly || formData.locked?.sopNo}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>Specifications:</th>
                      <td colSpan={3}>
                        <textarea
                          value={formData.composition}
                          readOnly={isReadOnly || formData.locked?.composition}
                        />
                      </td>
                    </tr>
                  </>
                )}
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
                      <td>
                        <textarea
                          value={test.tests}
                          onChange={(e) =>
                            handleTestChange(index, "tests", e.target.value)
                          }
                          readOnly={
                            isReadOnly ||
                            (formData.testsFromTemplate && test.testsLocked)
                          }
                        />
                      </td>
                      <td>
                        <textarea
                          value={test.specifications}
                          onChange={(e) =>
                            handleTestChange(
                              index,
                              "specifications",
                              e.target.value,
                            )
                          }
                          readOnly={
                            isReadOnly ||
                            (formData.testsFromTemplate &&
                              test.specificationsLocked)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={test.analyzedBy}
                          onChange={(e) =>
                            handleTestChange(
                              index,
                              "analyzedBy",
                              e.target.value,
                            )
                          }
                          readOnly={
                            isReadOnly ||
                            (formData.testsFromTemplate &&
                              test.analyzedByLocked)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={test.result}
                          onChange={(e) =>
                            handleTestChange(index, "result", e.target.value)
                          }
                          readOnly={
                            isReadOnly ||
                            (formData.testsFromTemplate && test.resultLocked)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={test.conclusion}
                          onChange={(e) =>
                            handleTestChange(
                              index,
                              "conclusion",
                              e.target.value,
                            )
                          }
                          readOnly={
                            isReadOnly ||
                            (formData.testsFromTemplate &&
                              test.conclusionLocked)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {Array.isArray(formData.footerNotes) &&
              formData.footerNotes.length > 0 && (
                <div className="coa-notes">
                  {formData.footerNotes.map((note) => (
                    <p key={note.NoteNo}>
                      Note {note.NoteNo}: {note.Text}
                    </p>
                  ))}
                </div>
              )}

            {Array.isArray(formData.conformityOptions) &&
              formData.conformityOptions.length > 0 &&
              !(
                qaOnly &&
                ["draft", "hold"].includes(
                  String(formData.status || "").toLowerCase(),
                )
              ) && (
                <div className="coa-conformity">
                  <div className="coa-conformity-label">
                    Statement of Conformity:
                  </div>
                  {qaOnly ? (
                    <div>
                      {formData.conformityOptions.find(
                        (option) => option.Value === formData.conformity,
                      )?.Text ||
                        formData.conformity ||
                        "—"}
                    </div>
                  ) : (
                    <select
                      value={formData.conformity}
                      disabled={isReadOnly}
                      onChange={(e) => handleInputChange(e, "conformity")}
                    >
                      <option value="">Select</option>
                      {formData.conformityOptions.map((option) => (
                        <option key={option.Value} value={option.Value}>
                          {option.Text}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

            {/* Remarks Section */}
            <table className="coa-remarks-table">
              <tbody>
                <tr>
                  <th>REMARKS</th>
                  <td>
                    <textarea
                      value={formData.remarks}
                      onChange={(e) => handleInputChange(e, "remarks")}
                      readOnly={isReadOnly}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
            <table className="coa-sign-table">
              <tbody>
                <tr>
                  <th>ANALYZED BY</th>
                  <th>CHECKED BY</th>
                  <th>APPROVED BY</th>
                </tr>
                <tr>
                  <td>
                    <div className="coa-sign-role">
                      {formData.analyzedBy.title}
                    </div>
                    <div>{formData.analyzedBy.date}</div>
                  </td>
                  <td>
                    <div className="coa-sign-role">
                      {formData.checkedBy.title}
                    </div>
                    <div>{formData.checkedBy.date}</div>
                  </td>
                  <td>
                    <div className="coa-sign-role">
                      {formData.approvedBy.title}
                    </div>
                    <div>{formData.approvedBy.date}</div>
                  </td>
                </tr>
                {["released", "reject", "hold"].includes(
                  String(formData.status || "").toLowerCase(),
                ) && (
                  <tr>
                    <td colSpan={3} className="coa-sign-status">
                      {formData.status}
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan={3}>
                    This is SAP-PMS generated Document and does not require
                    signature
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="coa-end-document">End of Document</div>

            {qaPermission && clearanceReview && (
              <div className="qa-clearance-decision no-print">
                <span>Clearance decision</span>
                <div className="qa-clearance-status-actions">
                  {["Released", "Hold", "Reject"].map((status) => (
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
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="coa-secondary-btn"
                >
                  Cancel
                </button>
                {!isReadOnly &&
                  (mode === "edit" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setPendingSave("Draft")}
                        className="btn btn-primary"
                        disabled={isSaving}
                      >
                        Update
                      </button>
                      {String(formData.status || "").toLowerCase() ===
                        "draft" && (
                        <button
                          type="button"
                          onClick={() => setPendingSave("Pending")}
                          className="btn btn-primary"
                          disabled={isSaving}
                        >
                          Send for approval
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setPendingSave("Draft")}
                        className="btn btn-primary"
                        disabled={isSaving}
                      >
                        Save Draft
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingSave("Pending")}
                        className="btn btn-primary"
                        disabled={isSaving}
                      >
                        Send for approval
                      </button>
                    </>
                  ))}
                {String(formData.status || "").toLowerCase() === "released" && (
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

      <div
        className={`coa-reports-section no-print${showForm ? " coa-section-hidden" : ""}`}
      >
        <div className="po-filter-toolbar-card">
          <div className="po-filter-toolbar-grid">
            <div className="po-filter-item po-filter-search-box">
              <label className="po-filter-label">Search</label>
              <div style={{ position: "relative" }}>
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
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="po-filter-item">
              <label className="po-filter-label">Product Line</label>
              <select
                className="po-filter-select"
                value={filters.productLine}
                onChange={(e) => {
                  setFilters((prev) => ({
                    ...prev,
                    productLine: e.target.value,
                  }));
                  setPage(1);
                }}
              >
                <option value="">All lines</option>
                {productLines.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
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
                disabled={
                  !searchQuery &&
                  !filters.status &&
                  !filters.productLine &&
                  !filters.fromDate &&
                  !filters.toDate
                }
                onClick={() => {
                  setSearchQuery("");
                  setFilters({
                    status: "",
                    productLine: "",
                    fromDate: "",
                    toDate: "",
                  });
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
          onClose={() => {
            if (!isSaving) setClearanceStatus("");
          }}
          showClose={false}
          className="po-create-confirm-popup"
        >
          <div className="po-create-confirm">
            <h3 className="po-create-confirm-title">
              Set status to {clearanceStatus}?
            </h3>
            <p className="po-create-confirm-text">
              The certificate stays as you read it. Only the status changes to{" "}
              {clearanceStatus}.
            </p>
            <div className="po-create-confirm-actions">
              <Button
                variant="outline"
                disabled={isSaving}
                onClick={() => setClearanceStatus("")}
              >
                Back
              </Button>
              <Button
                variant="primary"
                isLoading={isSaving}
                disabled={isSaving}
                onClick={applyClearanceStatus}
              >
                Confirm
              </Button>
            </div>
          </div>
        </GlobalPopup>
      )}
      {pendingSave && (
        <GlobalPopup
          title={pendingSave === "Pending" ? "Generate report" : "Save draft"}
          onClose={() => {
            if (!isSaving) setPendingSave(null);
          }}
          showClose={false}
          className="po-create-confirm-popup"
        >
          <div className="po-create-confirm">
            <h3 className="po-create-confirm-title">
              {pendingSave === "Pending"
                ? "Generate this report?"
                : "Save this draft?"}
            </h3>
            <p className="po-create-confirm-text">
              {pendingSave === "Pending"
                ? "This certificate will be saved with status Pending."
                : "This certificate will be saved as a draft. You can still edit it later."}
            </p>
            <div className="po-create-confirm-actions">
              <Button
                variant="outline"
                onClick={() => setPendingSave(null)}
                disabled={isSaving}
              >
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
                {pendingSave === "Pending" ? "Send QA for clearance" : "Save"}
              </Button>
            </div>
          </div>
        </GlobalPopup>
      )}
    </div>
  );
};

export default COA;
