import React, { useState, useEffect } from "react";
import Select from "react-select";
import toast from "react-hot-toast";
import { axiosInstance } from "../../apis/axiosinstance";
import { API_ENDPOINTS } from "../../apis/endpoints";
import Button from "../../global-components/Button/Button";
import { IconSearch, IconRefresh, IconPlus } from "@tabler/icons-react";
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
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDocNum, setSelectedDocNum] = useState(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    project: "",
    product: "",
    warehouse: "",
    fromDate: "",
    toDate: "",
  });

  const statusOptions = [
    { value: "Planned", label: "Planned" },
    { value: "Released", label: "Released" },
    { value: "Closed", label: "Closed" },
    { value: "Cancelled", label: "Cancelled" },
  ];

  const projectOptions = (projectList || []).map((p) => ({
    value: p.PrjCode,
    label: p.PrjName ? `${p.PrjCode} - ${p.PrjName}` : p.PrjCode,
  }));

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
    fetchPaginatedOrders(currentPage, pageSize, searchQuery, filters, sortConfig);
  }, [currentPage, pageSize, searchQuery, filters, sortConfig]);

  const fetchPaginatedOrders = async (
    page,
    limit,
    search,
    currentFilters = filters,
    currentSort = sortConfig,
  ) => {
    setTableLoading(true);
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.PRODUCTION_ORDERS.PAGINATED_ORDERS(
          page,
          limit,
          search,
          currentFilters,
          currentSort,
        ),
      );
      if (response.data?.success) {
        setPaginatedOrders(response.data.data);
        setTotalOrders(response.data.total);
      }
    } catch (err) {
      toast.error("Failed to fetch production orders table.");
    } finally {
      setTableLoading(false);
    }
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
      status: "",
      project: "",
      product: "",
      warehouse: "",
      fromDate: "",
      toDate: "",
    });
    setSortConfig(null);
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    filters.status ||
    filters.project ||
    filters.product ||
    filters.warehouse ||
    filters.fromDate ||
    filters.toDate,
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

  const tableColumns = [
    { key: "DocNum", header: "PO No.", width: "10%" },
    { key: "ProductNo", header: "Item No.", width: "15%" },
    { key: "ProductDescription", header: "Item Name", width: "25%" },
    { key: "PlannedQty", header: "Planned Qty", width: "10%" },
    {
      key: "DueDate",
      header: "Due Date",
      width: "15%",
      render: (row) => formatDate(row.DueDate),
    },
    { key: "Project", header: "Project", width: "15%" },
    { key: "Status", header: "Status", width: "10%" },
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
              onClick={handleAddPO}
            >
              Create
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
                    placeholder="Search by Doc No, Item, Project..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="po-filter-search-input"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="po-filter-item" style={{ minWidth: "160px" }}>
                <label className="po-filter-label">Status</label>
                <Select
                  value={
                    statusOptions.find((opt) => opt.value === filters.status) ||
                    null
                  }
                  onChange={(opt) =>
                    handleFilterChange("status", opt ? opt.value : "")
                  }
                  options={statusOptions}
                  placeholder="All Statuses"
                  isClearable
                  isSearchable
                  menuPortalTarget={document.body}
                  styles={filterSelectStyles}
                />
              </div>

              {/* Project Filter */}
              <div className="po-filter-item" style={{ minWidth: "200px" }}>
                <label className="po-filter-label">Project</label>
                <Select
                  value={
                    projectOptions.find((opt) => opt.value === filters.project) ||
                    null
                  }
                  onChange={(opt) =>
                    handleFilterChange("project", opt ? opt.value : "")
                  }
                  options={projectOptions}
                  placeholder="All Projects"
                  isClearable
                  isSearchable
                  menuPortalTarget={document.body}
                  styles={filterSelectStyles}
                />
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

              {/* Due Date From */}
              <div className="po-filter-item">
                <label className="po-filter-label">Due From</label>
                <input
                  type="date"
                  className="po-filter-date-input"
                  value={filters.fromDate}
                  onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                />
              </div>

              {/* Due Date To */}
              <div className="po-filter-item">
                <label className="po-filter-label">Due To</label>
                <input
                  type="date"
                  className="po-filter-date-input"
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange("toDate", e.target.value)}
                />
              </div>

              {/* Reset Filters */}
              <div className="po-filter-item">
                <label className="po-filter-label">&nbsp;</label>
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
            onRowClick={(row) => {
              setSelectedDocNum(row.DocNum);
              setIsDetailsModalOpen(true);
            }}
          />
        </div>
      )}

      <ProductionOrderDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        docNum={selectedDocNum}
      />
    </div>
  );
};

export default ProductionOrders;
