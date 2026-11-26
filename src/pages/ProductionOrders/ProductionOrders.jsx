import React, { useState, useEffect, useRef } from "react";
import Select from "react-select";
import toast from "react-hot-toast";
import { axiosInstance } from "../../apis/axiosinstance";
import { API_ENDPOINTS } from "../../apis/endpoints";
import Button from "../../global-components/Button/Button";
import GlobalPopup from "../../global-components/GlobalPopup/GlobalPopup";
import { IconSearch, IconRefresh, IconPlus, IconFileSpreadsheet, IconList, IconLayoutKanban } from "@tabler/icons-react";
import * as XLSX from "xlsx";
import ProductionOrderHeader from "./ProductionOrderHeader";
import ProductionOrderComponents from "./ProductionOrderComponents";
import Table from "../../global-components/Table/Table";
import ProductionOrderDetailsModal from "./ProductionOrderDetailsModal";
import "./ProductionOrders.css";
import "../PurchaseOrder/PurchaseOrder.css";

const filterSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "38px",
    height: "38px",
    fontSize: "13px",
    borderRadius: "2px",
    borderColor: state.isFocused ? "var(--primary-blue)" : "#cbd5e1",
    boxShadow: "none",
    backgroundColor: "#ffffff",
    cursor: "text",
    "&:hover": {
      borderColor: state.isFocused ? "var(--primary-blue)" : "#94a3b8",
    },
  }),
  valueContainer: (base) => ({
    ...base,
    height: "38px",
    padding: "0 8px",
    display: "flex",
    alignItems: "center",
  }),
  input: (base) => ({
    ...base,
    margin: "0",
    padding: "0",
    color: "#1e293b",
  }),
  indicatorsContainer: (base) => ({
    ...base,
    height: "38px",
  }),
  dropdownIndicator: (base) => ({
    ...base,
    padding: "4px 6px",
    color: "#64748b",
    "&:hover": {
      color: "#1e293b",
    },
  }),
  clearIndicator: (base) => ({
    ...base,
    padding: "4px",
    color: "#94a3b8",
    "&:hover": {
      color: "#ef4444",
    },
  }),
  menu: (base) => ({
    ...base,
    fontSize: "13px",
    borderRadius: "2px",
    zIndex: 9999,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
    border: "1px solid #e2e8f0",
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  option: (base, state) => ({
    ...base,
    fontSize: "13px",
    padding: "8px 12px",
    backgroundColor: state.isSelected
      ? "var(--primary-blue)"
      : state.isFocused
        ? "#f1f5f9"
        : "#ffffff",
    color: state.isSelected ? "#ffffff" : "#1e293b",
    cursor: "pointer",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }),
  placeholder: (base) => ({
    ...base,
    color: "#94a3b8",
    fontSize: "13px",
    whiteSpace: "nowrap",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#1e293b",
    fontSize: "13px",
    whiteSpace: "nowrap",
  }),
};

const ProductionOrders = () => {
  const [itemCode, setItemCode] = useState("");
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [projectList, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [headerData, setHeaderData] = useState({
    Type: "Standard",
    Status: "Planned",
    ProcureItems: false,
    Priority: 100,
  });
  const [componentsData, setComponentsData] = useState([]);

  // Table & Pagination state
  const [paginatedOrders, setPaginatedOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalOrders, setTotalOrders] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDocNum, setSelectedDocNum] = useState(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [createConfirmPreview, setCreateConfirmPreview] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    lifecycle: "",
    product: "",
    productLine: "",
    warehouse: "",
    fromDate: "",
    toDate: "",
    createdFrom: "",
    createdTo: "",
  });
  const [productLines, setProductLines] = useState([]);
  const [kanbanByStatus, setKanbanByStatus] = useState({
    "New Order": [],
    Planned: [],
    "In Progress": [],
    Completed: [],
    Cancelled: [],
  });
  const [kanbanTotals, setKanbanTotals] = useState({
    "New Order": 0,
    Planned: 0,
    "In Progress": 0,
    Completed: 0,
    Cancelled: 0,
  });
  const [kanbanLoading, setKanbanLoading] = useState(false);
  const [kanbanLoadingMore, setKanbanLoadingMore] = useState("");
  const kanbanListRefs = useRef({});
  const prevViewModeRef = useRef(viewMode);

  const KANBAN_PAGE_SIZE = 15;

  const kanbanColumns = [
    { key: "New Order", label: "New Order", tone: "planned" },
    { key: "Planned", label: "Planned", tone: "released" },
    { key: "In Progress", label: "In Progress", tone: "progress" },
    { key: "Completed", label: "Completed", tone: "completed" },
    { key: "Cancelled", label: "Cancelled", tone: "cancelled" },
  ];

  const statusOptions = kanbanColumns.map((column) => ({
    value: column.key,
    label: column.label,
  }));

  const emptyKanbanByStatus = {
    "New Order": [],
    Planned: [],
    "In Progress": [],
    Completed: [],
    Cancelled: [],
  };

  const emptyKanbanTotals = {
    "New Order": 0,
    Planned: 0,
    "In Progress": 0,
    Completed: 0,
    Cancelled: 0,
  };

  const productOptions = (products || []).map((pr) => {
    const code = pr.Code || pr.ItemCode;
    const name = pr.Name || pr.ItemName || "";
    return {
      value: code,
      label: name ? `${code} - ${name}` : code,
    };
  });

  const warehouseOptions = (warehouses || []).map((w) => ({
    value: w.WhsCode,
    label: w.WhsName ? `${w.WhsCode} - ${w.WhsName}` : w.WhsCode,
  }));

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axiosInstance.get(
          API_ENDPOINTS.PRODUCTION_ORDERS.PRODUCTS,
        );
        if (res.data?.success) {
          setProducts(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching products list:", err);
      }
    };

    const fetchWarehouses = async () => {
      try {
        const res = await axiosInstance.get(
          API_ENDPOINTS.PRODUCTION_ORDERS.WAREHOUSES,
        );
        if (res.data?.success) {
          setWarehouses(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching warehouses:", err);
      }
    };

    const fetchBranches = async () => {
      try {
        const res = await axiosInstance.get(
          API_ENDPOINTS.PRODUCTION_ORDERS.BRANCHES,
        );
        if (res.data?.success) {
          setBranches(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching branches:", err);
      }
    };

    const fetchProjects = async () => {
      try {
        const res = await axiosInstance.get(
          API_ENDPOINTS.PRODUCTION_ORDERS.PROJECTS,
        );
        if (res.data?.success) {
          setProjects(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
      }
    };

    fetchProducts();
    fetchWarehouses();
    fetchBranches();
    fetchProjects();
  }, []);

  useEffect(() => {
    const switchedView = prevViewModeRef.current !== viewMode;
    prevViewModeRef.current = viewMode;

    if (viewMode === "list") {
      const silent = switchedView && paginatedOrders.length > 0;
      fetchPaginatedOrders(currentPage, pageSize, searchQuery, filters, sortConfig, { silent });
    } else {
      const hasKanbanData = Object.values(kanbanByStatus).some((rows) => rows.length > 0);
      const silent = switchedView && hasKanbanData;
      loadKanbanBoard(searchQuery, filters, sortConfig, { silent });
    }
  }, [currentPage, pageSize, searchQuery, filters, sortConfig, viewMode]);

  const fetchPaginatedOrders = async (
    page,
    limit,
    search,
    currentFilters = filters,
    currentSort = sortConfig,
    { silent = false } = {},
  ) => {
    if (!silent) setTableLoading(true);
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.PRODUCTION_ORDERS.PAGINATED_ORDERS(
          page,
          limit,
          search,
          currentFilters,
          currentSort,
        ),
        { skipGlobalLoading: true },
      );
      if (response.data?.success) {
        setPaginatedOrders(response.data.data);
        setTotalOrders(response.data.total);
        if (Array.isArray(response.data.productLines)) {
          setProductLines(response.data.productLines);
        }
      }
    } catch (err) {
      toast.error("Failed to fetch production orders table.");
    } finally {
      if (!silent) setTableLoading(false);
    }
  };

  const fetchKanbanColumn = async ({
    lifecycle,
    page = 1,
    search = searchQuery,
    currentFilters = filters,
    currentSort = sortConfig,
  }) => {
    const response = await axiosInstance.get(
      API_ENDPOINTS.PRODUCTION_ORDERS.PAGINATED_ORDERS(
        page,
        KANBAN_PAGE_SIZE,
        search,
        { ...currentFilters, lifecycle },
        currentSort,
      ),
      { skipGlobalLoading: true },
    );
    if (!response.data?.success) {
      throw new Error(response.data?.message || "Failed to load kanban column");
    }
    if (Array.isArray(response.data.productLines)) {
      setProductLines(response.data.productLines);
    }
    return {
      lifecycle,
      rows: response.data.data || [],
      total: response.data.total || 0,
    };
  };

  const loadKanbanBoard = async (
    search = searchQuery,
    currentFilters = filters,
    currentSort = sortConfig,
    { silent = false } = {},
  ) => {
    if (!silent) {
      setKanbanLoading(true);
      setKanbanByStatus(emptyKanbanByStatus);
      setKanbanTotals(emptyKanbanTotals);
    }
    try {
      const stages = currentFilters.lifecycle
        ? [currentFilters.lifecycle]
        : kanbanColumns.map((column) => column.key);

      const results = await Promise.all(
        stages.map((lifecycle) =>
          fetchKanbanColumn({
            lifecycle,
            page: 1,
            search,
            currentFilters,
            currentSort,
          }),
        ),
      );

      const nextByStatus = { ...emptyKanbanByStatus };
      const nextTotals = { ...emptyKanbanTotals };
      results.forEach(({ lifecycle, rows, total }) => {
        nextByStatus[lifecycle] = rows;
        nextTotals[lifecycle] = total;
      });
      setKanbanByStatus(nextByStatus);
      setKanbanTotals(nextTotals);
    } catch (err) {
      toast.error(err.message || "Failed to fetch kanban board.");
    } finally {
      if (!silent) setKanbanLoading(false);
    }
  };

  const loadMoreKanbanColumn = async (status) => {
    const loaded = kanbanByStatus[status]?.length || 0;
    const nextPage = Math.floor(loaded / KANBAN_PAGE_SIZE) + 1;
    setKanbanLoadingMore(status);
    try {
      const { rows, total } = await fetchKanbanColumn({
        lifecycle: status,
        page: nextPage,
      });
      setKanbanByStatus((prev) => ({
        ...prev,
        [status]: [...(prev[status] || []), ...rows],
      }));
      setKanbanTotals((prev) => ({ ...prev, [status]: total }));

      if (rows.length > 0) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const listEl = kanbanListRefs.current[status];
            if (!listEl) return;
            listEl.scrollBy({ top: 72, behavior: "smooth" });
          });
        });
      }
    } catch (err) {
      toast.error(err.message || "Failed to load more orders.");
    } finally {
      setKanbanLoadingMore("");
    }
  };

  const openOrderDetails = (row) => {
    setSelectedDocNum(row.DocNum);
    setIsDetailsModalOpen(true);
  };

  const handleSortChange = (newSortConfig) => {
    setSortConfig(newSortConfig);
    setCurrentPage(1);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilters({
      lifecycle: "",
      product: "",
      productLine: "",
      warehouse: "",
      fromDate: "",
      toDate: "",
      createdFrom: "",
      createdTo: "",
    });
    setSortConfig(null);
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    filters.lifecycle ||
    filters.product ||
    filters.productLine ||
    filters.warehouse ||
    filters.fromDate ||
    filters.toDate ||
    filters.createdFrom ||
    filters.createdTo,
  );

  const fetchProductionOrder = async (codeToFetch) => {
    const code = codeToFetch !== undefined ? codeToFetch : itemCode;
    if (!code || !code.trim()) return;

    setLoading(true);
    setError(null);
    setHeaderData(null);
    setComponentsData([]);

    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.PRODUCTION_ORDERS.DETAILS(code),
      );
      if (response.data?.success) {
        if (response.data.data.header) {
          setHeaderData(response.data.data.header);
          setComponentsData(response.data.data.lines);
        } else {
          setError(`No Production Order found for product ${code}.`);
        }
      } else {
        setError("Failed to fetch production order data.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "An error occurred.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchBOMOrder = async (codeToFetch) => {
    const code = codeToFetch !== undefined ? codeToFetch : itemCode;
    if (!code || !code.trim()) return;

    setLoading(true);
    setError(null);
    setHeaderData(null);
    setComponentsData([]);

    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.PRODUCTION_ORDERS.BOM_DETAILS(code),
      );
      if (response.data?.success) {
        if (response.data.data.header) {
          const { header, lines } = response.data.data;
          setHeaderData({
            ...header,
            OrderDate: header.OrderDate
              ? new Date(header.OrderDate).toISOString().split("T")[0]
              : "",
            StartDate: header.StartDate
              ? new Date(header.StartDate).toISOString().split("T")[0]
              : "",
            DueDate: header.DueDate
              ? new Date(header.DueDate).toISOString().split("T")[0]
              : "",
          });
          setComponentsData(lines || []);
        } else {
          setError(`No BOM found for product ${code}.`);
        }
      } else {
        setError("Failed to fetch BOM data.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "An error occurred.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setHeaderData({
      Type: "Standard",
      Status: "Planned",
      ProcureItems: false,
      Priority: 100,
    });
    setComponentsData([]);
    setItemCode("");
    setError(null);
  };

  const handleCancel = () => {
    handleClear();
    setShowCreateForm(false);
  };

  const handleHeaderPlannedQtyChange = (val) => {
    setHeaderData((prev) => ({ ...(prev || {}), PlannedQuantity: val }));

    const numVal = parseFloat(val) || 0;
    setComponentsData((prev) =>
      prev.map((comp) => ({
        ...comp,
        PlannedQty: comp.BaseQty
          ? parseFloat((comp.BaseQty * numVal).toFixed(6))
          : 0,
        isEdited: false,
      })),
    );
  };

  const handleHeaderWarehouseChange = (newWarehouseCode) => {
    setHeaderData((prev) => ({ ...(prev || {}), Warehouse: newWarehouseCode }));

    const updatedComponents = componentsData.map((comp) => ({
      ...comp,
      Warehouse: newWarehouseCode,
    }));
    setComponentsData(updatedComponents);
  };

  const handleHeaderFieldChange = (field, value) => {
    setHeaderData((prev) => ({ ...(prev || {}), [field]: value }));

    // If the user clears the "Linked To" field, restore the original BOM
    if (field === "LinkedTo" && !value && itemCode) {
      fetchBOMOrder(itemCode);
    }
  };

  const handleRemoveComponent = (index) => {
    setComponentsData((prev) => prev.filter((_, i) => i !== index));
  };

  const handleComponentChange = (index, field, value) => {
    setComponentsData((prev) =>
      prev.map((comp, i) => {
        if (i === index) {
          return { ...comp, [field]: value, isEdited: true };
        }
        return comp;
      }),
    );
  };

  const openCreateConfirm = () => {
    if (!isFormValid) {
      toast.error("Please complete the required fields before creating.");
      return;
    }
    setCreateConfirmPreview(false);
    setShowCreateConfirm(true);
  };

  const openCreateConfirmPreview = () => {
    setCreateConfirmPreview(true);
    setShowCreateConfirm(true);
  };

  const closeCreateConfirm = () => {
    setShowCreateConfirm(false);
    setCreateConfirmPreview(false);
  };

  const handleAddPO = async () => {
    if (!itemCode || !headerData.PlannedQuantity) {
      toast.error("Please select a product and provide a planned quantity.");
      return;
    }

    const payload = {
      CompanyDB: "LDS_Live",
      ItemCode: itemCode,
      PlannedQuantity: parseFloat(headerData.PlannedQuantity),
      WarehouseCode: headerData.Warehouse || "",
      BranchId: parseInt(headerData.Branch, 10) || null,
      PostingDate: headerData.OrderDate || "",
      StartDate: headerData.StartDate || "",
      DueDate: headerData.DueDate || "",
      Priority: parseInt(headerData.Priority, 10) || 0,
      ProjectCode: headerData.Project || "",
      Status: headerData.Status === "Planned" ? "Planned" : headerData.Status,
      Type: headerData.Type === "Standard" ? "Standard" : headerData.Type,
    };

    if (headerData.LinkedTo === "Sales Order" && headerData.LinkedOrder) {
      payload.LinkToObj = 17;
      payload.OriginNum = parseInt(headerData.LinkedOrder, 10) || null;
    } else if (
      headerData.LinkedTo === "Production Order" &&
      headerData.LinkedOrder
    ) {
      payload.LinkToObj = 202;
      payload.OriginNum = parseInt(headerData.LinkedOrder, 10) || null;
    }

    const changedLines = componentsData
      .filter((comp) => comp.isEdited)
      .map((comp) => ({
        ItemCode: comp.No,
        PlannedQuantity: parseFloat(comp.PlannedQty) || 0,
      }));

    if (changedLines.length > 0) {
      payload.Lines = changedLines;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.PRODUCTION_ORDERS.CREATE_ORDER,
        payload,
      );

      if (response.data?.success) {
        const responseData = response.data.data;
        const message =
          responseData?.Message ||
          responseData?.message ||
          (typeof responseData === "string"
            ? responseData
            : JSON.stringify(responseData));
        toast.success(message || "Production Order created successfully!", {
          duration: 5000,
        });
        closeCreateConfirm();
        handleClear();
        fetchPaginatedOrders(1, pageSize, searchQuery, filters, sortConfig); // Refresh list
        setCurrentPage(1);
        setShowCreateForm(false);
      } else {
        toast.error(
          response.data?.message || "Failed to create Production Order.",
        );
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        err.message ||
        "An error occurred while creating.",
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const response = await axiosInstance.get(
        API_ENDPOINTS.PRODUCTION_ORDERS.PAGINATED_ORDERS(
          1,
          Math.max(totalOrders || 0, 1000),
          searchQuery,
          filters,
          sortConfig,
        ),
      );
      if (!response.data?.success) {
        toast.error(response.data?.message || "Failed to export production orders");
        return;
      }
      const rows = (response.data.data || []).map((row) => ({
        "PO No.": row.DocNum ?? "",
        "Item No.": row.ProductNo ?? "",
        "Item Name": row.ProductDescription ?? "",
        "Planned Qty": row.PlannedQty ?? "",
        "Due Date": formatDate(row.DueDate) || "",
        Project: row.Project ?? "",
        Status: row.Status ?? "",
        "Lifecycle Stage": row.ProductionLifecycleStage ?? "",
      }));
      if (!rows.length) {
        toast.error("No records to export");
        return;
      }
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Production Orders");
      XLSX.writeFile(
        workbook,
        `Production_Orders_${filters.fromDate || "all"}_to_${filters.toDate || "all"}.xlsx`,
      );
      toast.success(`Exported ${rows.length} record(s)`);
    } catch (err) {
      console.error("Export Excel failed:", err);
      toast.error(err?.response?.data?.message || err.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const tableColumns = [
    { key: "DocNum", header: "PO No.", width: "8%" },
  
    { key: "ProductNo", header: "Item No.", width: "11%" },
    { key: "ProductDescription", header: "Item Name", width: "24%" },
    { key: "PlannedQty", header: "Planned Qty", width: "9%" },
    {
      key: "CreateDate",
      header: "Created Date",
      width: "10%",
      render: (row) => formatDate(row.CreateDate),
    },
    {
      key: "DueDate",
      header: "Due Date",
      width: "10%",
      render: (row) => formatDate(row.DueDate),
    },
    { key: "Project", header: "Project", width: "12%" },
    // { key: "Status", header: "Status", width: "9%" },
    { key: "ProductionLifecycleStage", header: "Status", width: "18%" },
  ];

  const isFormValid = Boolean(
    itemCode &&
    headerData?.Type &&
    headerData?.Status &&
    headerData?.PlannedQuantity &&
    headerData?.Warehouse &&
    headerData?.Branch &&
    headerData?.Priority !== undefined &&
    headerData?.Priority !== "" &&
    headerData?.OrderDate &&
    headerData?.StartDate &&
    headerData?.DueDate,
  );

  return (
    <div className="po-container">
      {error && <div className="po-error">{error}</div>}

      {showCreateForm ? (
        <>
          <div className="po-form">
            <ProductionOrderHeader
              headerData={headerData}
              isCreateMode={true}
              products={products}
              warehouses={warehouses}
              branches={branches}
              projectList={projectList}
              onSelectProduct={fetchBOMOrder}
              selectedItemCode={itemCode}
              setItemCode={setItemCode}
              onPlannedQtyChange={handleHeaderPlannedQtyChange}
              onWarehouseChange={handleHeaderWarehouseChange}
              onHeaderChange={handleHeaderFieldChange}
            />
            <ProductionOrderComponents
              componentsData={componentsData}
              itemCode={itemCode}
              onRemoveRow={handleRemoveComponent}
              onRowChange={handleComponentChange}
              isLinked={!!headerData?.LinkedTo}
            />
          </div>

          <div className="po-footer-actions">
            <Button
              variant="primary"
              disabled={loading || !isFormValid}
              isLoading={loading}
              onClick={openCreateConfirm}
            >
              Create Production Order
            </Button>
          
            <Button
              variant="secondary"
              onClick={handleClear}
              disabled={loading}
            >
              Clear Form
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <div className="layout-page-padding">
          <div className="po-table-header">
            <div className="po-view-toggle" role="group" aria-label="View mode">
              <button
                type="button"
                className={`po-view-toggle-btn ${viewMode === "list" ? "active" : ""}`}
                onClick={() => setViewMode("list")}
                title="List view"
                aria-pressed={viewMode === "list"}
              >
                <IconList size={18} />
              </button>
              <button
                type="button"
                className={`po-view-toggle-btn ${viewMode === "kanban" ? "active" : ""}`}
                onClick={() => setViewMode("kanban")}
                title="Kanban view"
                aria-pressed={viewMode === "kanban"}
              >
                <IconLayoutKanban size={18} />
              </button>
            </div>
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
                <div style={{ position: "relative" }}>
                  <IconSearch size={18} className="po-filter-search-icon" />
                  <input
                    type="text"
                    placeholder="Search by Doc No, Item..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="po-filter-search-input"
                  />
                </div>
              </div>

              {/* Lifecycle filter */}
              <div className="po-filter-item" style={{ minWidth: "200px" }}>
                <label className="po-filter-label">Status</label>
                <Select
                  value={
                    statusOptions.find((opt) => opt.value === filters.lifecycle) ||
                    null
                  }
                  onChange={(opt) =>
                    handleFilterChange("lifecycle", opt ? opt.value : "")
                  }
                  options={statusOptions}
                  placeholder="All stages"
                  isClearable
                  isSearchable
                  menuPortalTarget={document.body}
                  styles={filterSelectStyles}
                />
              </div>

              <div className="po-filter-item">
                <label className="po-filter-label">Product Line</label>
                <select
                  className="po-filter-select"
                  value={filters.productLine}
                  onChange={(e) => handleFilterChange("productLine", e.target.value)}
                >
                  <option value="">All lines</option>
                  {productLines.map((line) => (
                    <option key={line} value={line}>
                      {line}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Filter */}
              <div className="po-filter-item" style={{ minWidth: "220px" }}>
                <label className="po-filter-label">Product</label>
                <Select
                  value={
                    productOptions.find((opt) => opt.value === filters.product) ||
                    null
                  }
                  onChange={(opt) =>
                    handleFilterChange("product", opt ? opt.value : "")
                  }
                  options={productOptions}
                  placeholder="All Products"
                  isClearable
                  isSearchable
                  menuPortalTarget={document.body}
                  styles={filterSelectStyles}
                />
              </div>

              <div className="po-filter-item">
                <label className="po-filter-label">Due Date From</label>
                <input
                  type="date"
                  className="po-filter-date-input"
                  value={filters.fromDate}
                  onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                />
              </div>

              <div className="po-filter-item">
                <label className="po-filter-label">Due Date To</label>
                <input
                  type="date"
                  className="po-filter-date-input"
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange("toDate", e.target.value)}
                />
              </div>

              <div className="po-filter-item">
                <label className="po-filter-label">Created From</label>
                <input
                  type="date"
                  className="po-filter-date-input"
                  value={filters.createdFrom}
                  onChange={(e) => handleFilterChange("createdFrom", e.target.value)}
                />
              </div>

              <div className="po-filter-item">
                <label className="po-filter-label">Created To</label>
                <input
                  type="date"
                  className="po-filter-date-input"
                  value={filters.createdTo}
                  onChange={(e) => handleFilterChange("createdTo", e.target.value)}
                />
              </div>

              {/* Reset / Export */}
              <div className="po-filter-item">
                <label className="po-filter-label">&nbsp;</label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <Button
                    type="button"
                    variant="success"
                    size="sm"
                    onClick={handleExportExcel}
                    disabled={exporting || tableLoading}
                    title="Export Excel"
                    icon={<IconFileSpreadsheet size={16} />}
                  >
                    {exporting ? "Exporting..." : "Export Excel"}
                  </Button>
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
          </div>
          {viewMode === "list" ? (
            <div className="po-list-table">
            <Table
              data={paginatedOrders}
              columns={tableColumns}
              totalEntries={totalOrders}
              currentPage={currentPage}
              pageSize={pageSize}
              isLoading={tableLoading}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setPageSize}
              showActions={false}
              sortConfig={sortConfig}
              onSortChange={handleSortChange}
              onRowClick={openOrderDetails}
            />
            </div>
          ) : (
            <div className="po-kanban-board">
              {kanbanColumns.map((column) => {
                const cards = kanbanByStatus[column.key] || [];
                const total = kanbanTotals[column.key] || 0;
                return (
                  <section
                    key={column.key}
                    className={`po-kanban-column po-kanban-column-${column.tone}`}
                  >
                    <header>
                      <span className="po-kanban-column-label">
                        <i />
                        {column.label}
                      </span>
                      <strong>{total}</strong>
                    </header>
                    <div
                      className="po-kanban-column-list"
                      ref={(node) => {
                        kanbanListRefs.current[column.key] = node;
                      }}
                    >
                      {kanbanLoading && cards.length === 0 ? (
                        <div className="po-kanban-column-loading">
                          <span className="table-loader-spinner" />
                          Loading...
                        </div>
                      ) : cards.length === 0 ? (
                        <p className="po-kanban-empty">No orders</p>
                      ) : (
                        cards.map((order) => (
                          <article
                            key={order.DocNum}
                            className="po-kanban-card"
                            onClick={() => openOrderDetails(order)}
                          >
                            <div className="po-kanban-card-meta">
                              <span>PO #{order.DocNum}</span>
                              <span>Created: {formatDate(order.CreateDate) || "—"}</span>
                            </div>
                            <h3>{order.ProductNo}</h3>
                            <p>{order.ProductDescription || "—"}</p>
                            <div className="po-kanban-card-footer">
                              <span>Qty: {order.PlannedQty ?? "—"}</span>
                              <time>Due: {formatDate(order.DueDate) || "—"}</time>
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                    {cards.length < total && (
                      <button
                        type="button"
                        className="po-kanban-see-more"
                        disabled={kanbanLoadingMore === column.key}
                        onClick={() => loadMoreKanbanColumn(column.key)}
                        aria-label={kanbanLoadingMore === column.key ? "Loading more" : "Show more"}
                      >
                        {kanbanLoadingMore === column.key ? (
                          <span className="po-kanban-see-more-spinner" aria-hidden="true" />
                        ) : (
                          "Show more"
                        )}
                      </button>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      )}

      <ProductionOrderDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        docNum={selectedDocNum}
      />

      {showCreateConfirm && (
        <GlobalPopup
          title={createConfirmPreview ? "Preview confirmation" : "Confirm create"}
          onClose={closeCreateConfirm}
          showClose={false}
          className="po-create-confirm-popup"
        >
          <div className="po-create-confirm">
            <h3 className="po-create-confirm-title">
              {createConfirmPreview
                ? "Confirmation modal preview"
                : "Create this production order?"}
            </h3>
            <p className="po-create-confirm-text">
              {createConfirmPreview
                ? "This is only a preview of the confirmation modal. Nothing will be created."
                : "Are you sure you want to create this production order? This action cannot be undone."}
            </p>
            <div className="po-create-confirm-actions">
              <Button variant="outline" onClick={closeCreateConfirm} disabled={loading}>
                {createConfirmPreview ? "Close" : "Cancel"}
              </Button>
              {!createConfirmPreview && (
                <Button
                  variant="primary"
                  disabled={loading}
                  isLoading={loading}
                  onClick={handleAddPO}
                >
                  Yes, Create Order
                </Button>
              )}
            </div>
          </div>
        </GlobalPopup>
      )}
    </div>
  );
};

export default ProductionOrders;
