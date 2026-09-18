import React, { useState, useEffect } from "react";
import axios from "axios";
import Card from "../../global-components/Card/Card";
import Table from "../../global-components/Table/Table";
import GlobalPopup from "../../global-components/GlobalPopup/GlobalPopup";
import EmptyState from "../../global-components/EmptyState/EmptyState";
import GlobalLoading from "../../global-components/GlobalLoading/GlobalLoading";
import GlobalLineChart from "../../global-components/Charts/LineChart";
import GlobalPieChart from "../../global-components/Charts/PieChart";
import {
  IconClipboardList,
  IconCurrencyDollar,
  IconPercentage,
  IconCalculator,
  IconChartLine,
  IconSearch,
} from "@tabler/icons-react";
import { useLoading } from "../../context/LoadingContext";
import "./CostAnalysis.css";

const CostAnalysis = () => {
  const { showLoading, hideLoading } = useLoading();
  const [tableLoading, setTableLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Drill-down Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [orderStaff, setOrderStaff] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);

  const costContributionData = React.useMemo(() => {
    if (!orders || orders.length === 0) return [];

    let rm = 0,
      labour = 0,
      machine = 0,
      foh = 0;
    orders.forEach((o) => {
      rm += o.ActualMaterialCost || 0;
      labour += o.ActualLabourCost || 0;
      machine += o.ActualMachineCost || 0;
      foh += o.ActualFOHCost || 0;
    });

    return [
      { name: "Raw Material", value: rm, color: "#0088FE" },
      { name: "Labour", value: labour, color: "#00C49F" },
      { name: "Machine", value: machine, color: "#FFBB28" },
      { name: "Overhead (FOH)", value: foh, color: "#FF8042" },
    ].filter((item) => item.value > 0);
  }, [orders]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search !== searchInput) {
        setSearch(searchInput);
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);

  useEffect(() => {
    fetchOrders();
  }, [page, limit, search]);

  const fetchDashboardData = async () => {
    showLoading();
    try {
      const [summaryRes, trendRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/cost-analysis/summary`),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/cost-analysis/trend`),
      ]);

      if (summaryRes.data?.success) setSummary(summaryRes.data.data);
      if (trendRes.data?.success) setTrendData(trendRes.data.data);
    } catch (error) {
      console.error("Error fetching cost analysis data", error);
    }
    hideLoading();
  };

  const fetchOrders = async () => {
    setTableLoading(true);
    try {
      const ordersRes = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/cost-analysis/orders`,
        {
          params: { page, limit, search },
        },
      );
      if (ordersRes.data?.success) {
        setOrders(ordersRes.data.data);
        if (ordersRes.data.pagination)
          setTotalOrders(ordersRes.data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching orders data", error);
    }
    setTableLoading(false);
  };

  const handleOrderClick = async (record) => {
    setSelectedOrder(record);
    setIsModalVisible(true);
    setMaterialsLoading(true);
    setOrderStaff([]);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/cost-analysis/orders/${record.DocEntry}/materials`,
      );
      if (res.data?.success) {
        setMaterials(res.data.data);
        setOrderStaff(res.data.staff || []);
      }
    } catch (error) {
      console.error("Failed to load materials for order", error);
    }
    setMaterialsLoading(false);
  };

  const columns = [
    { key: "DocNum", header: "PO No", render: (row) => row.DocNum },
    { key: "FGItemCode", header: "Product", render: (row) => row.FGItemCode },
    { key: "FGItemName", header: "Product Name", render: (row) => row.FGItemName },
    {
      key: "Status",
      header: "Status",
      render: (row) => {
        let text = row.Status;
        let cls = "unknown";
        if (row.Status === "R") {
          text = "Released";
          cls = "open";
        }
        if (row.Status === "P") {
          text = "Planned";
          cls = "open";
        }
        if (row.Status === "L" || row.Status === "C") {
          text = "Closed";
          cls = "closed";
        }
        return <span className={`status-badge po-badge-${cls}`}>{text}</span>;
      },
    },
    {
      key: "PlannedFGQty",
      header: "PO Qty",
      render: (row) => Number(row.PlannedFGQty || 0).toLocaleString(),
    },
    {
      key: "ActualFGQty",
      header: "Produced Qty",
      render: (row) => Number(row.ActualFGQty || 0).toLocaleString(),
    },
    {
      key: "PlannedCost",
      header: "Planned Total",
      render: (row) =>
        `${Number(row.PlannedCost || row.PlannedMaterialCost || 0).toFixed(2)}`,
    },
    {
      key: "ActualCost",
      header: "Standard Cost",
      render: (row) =>
        `${Number(row.ActualCost || row.ActualMaterialCost || 0).toFixed(2)}`,
    },
    {
      key: "MaterialCost",
      header: "Material",
      render: (row) => `${Number(row.ActualMaterialCost || 0).toFixed(2)}`,
    },
    {
      key: "LabourCost",
      header: "Labour",
      render: (row) => `${Number(row.ActualLabourCost || 0).toFixed(2)}`,
    },
    {
      key: "HR",
      header: "HR",
      render: () => "-",
    },
    {
      key: "Capex",
      header: "Capex",
      render: () => "-",
    },
    // {
    //   key: 'TotalVariance',
    //   header: 'Variance',
    //   render: (row) => {
    //     const variance = (row.ActualCost || row.ActualMaterialCost || 0) - (row.PlannedCost || row.PlannedMaterialCost || 0);
    //     const colorClass = variance > 0 ? 'variance-positive' : 'variance-negative';
    //     return <span className={`variance-text ${colorClass}`}>{variance.toFixed(2)}</span>;
    //   }
    // }
  ];

  const materialColumns = [
    { key: "ItemCode", header: "Item Code", render: (row) => row.ItemCode },
    {
      key: "ItemDescription",
      header: "Description",
      render: (row) => row["Item Description"],
    },
    {
      key: "Type",
      header: "Type",
      render: (row) => {
        if (row.Type === "Item") return "Material";
        if (row.Type === "Resource") {
          const desc = (row["Item Description"] || "").toLowerCase();
          const code = (row.ItemCode || "").toLowerCase();
          if (
            desc.includes("labor") ||
            desc.includes("labour") ||
            code.includes("-lc-")
          )
            return "Labour";
          if (desc.includes("foh") || code.includes("-foh-")) return "FOH";
          if (desc.includes("qc") || code.includes("-qc-")) return "QC";
        }
        return row.Type;
      },
    },
    {
      key: "PlannedQty",
      header: "Qty",
      render: (row) => Number(row.PlannedQty || 0).toFixed(2),
    },
    {
      key: "PlannedCost",
      header: "Standard Cost",
      render: (row) => {
        const stdCost =
          (Number(row.PlannedQty) || 0) * (Number(row["Item Cost"]) || 0);
        return stdCost.toFixed(2);
      },
    },
    {
      key: "ActualCost",
      header: "Actual Cost",
      render: (row) => {
        if (row.Type !== "Item") return "-";
        const actCost =
          (Number(row.PlannedQty) || 0) * (Number(row["Item Cost"]) || 0);
        return actCost.toFixed(2);
      },
    },
    {
      key: "TotalVariance",
      header: "Variance",
      render: (row) => {
        if (row.Type !== "Item")
          return <span className="variance-text">-</span>;
        const stdCost =
          (Number(row.PlannedQty) || 0) * (Number(row["Item Cost"]) || 0);
        const actCost = stdCost;
        const val = stdCost - actCost;
        const colorClass =
          val > 0 ? "variance-positive" : val < 0 ? "variance-negative" : "";
        return (
          <span className={`variance-text variance-bold ${colorClass}`}>
            {Number(val).toFixed(2)}
          </span>
        );
      },
    },
  ];

  // Pagination for table
  const paginatedOrders = orders.slice((page - 1) * limit, page * limit);

  return (
    <div className="cost-analysis-dashboard">
      <>
        {/* KPI Cards Layer 1 */}
        {/* <div className="fade-in-up delay-100 mb-6">
            <Card items={[
              {
                title: "Total Actual Cost",
                value: `${(summary?.TotalActualCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                trendText: `Planned: ${(summary?.TotalPlannedCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                icon: IconCurrencyDollar
              },
              {
                title: "Overall Variance",
                value: `${(summary?.VariancePercent || 0).toFixed(2)}%`,
                trendText: (summary?.VariancePercent > 0) ? 'Over Budget' : 'Under Budget',
                icon: IconPercentage
              },
              {
                title: "Production Yield %",
                value: `${(summary?.YieldPercent || 0).toFixed(2)}%`,
                trendText: `Produced: ${(summary?.TotalFGProduced || 0).toLocaleString()} / Planned: ${(summary?.TotalPlannedFGQty || 0).toLocaleString()}`,
                icon: IconChartLine
              },
              {
                title: "Total WIP Cost",
                value: `${(summary?.TotalWIPCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                trendText: "Cost tied up in Open/Released orders",
                icon: IconClipboardList
              }
            ]} />
          </div> */}

        {/* Charts Row */}
        {/* <div className="cost-charts-row">
            <div className="pt-chart-card dome-card-wrapper fade-in-up delay-200">
              <div className="pt-chart-header">
                <h3 className="pt-chart-title"><IconChartLine size={20} className="title-icon" /> Monthly Cost Trend</h3>
              </div>
              <div className="pt-chart-container chart-container-padded">
                {trendData.length === 0 ? (
                  <EmptyState message="No trend data available" icon={IconChartLine} />
                ) : (
                  <GlobalLineChart
                    data={trendData.map((row) => ({
                      ...row,
                      period: `${row.Year}-${String(row.Month).padStart(2, '0')}`,
                    }))}
                    xAxisKey="period"
                    series={[
                      { key: 'ActualCost', name: 'Actual Cost', color: '#1B47DB' },
                      { key: 'PlannedCost', name: 'Planned Cost', color: '#10B981' },
                    ]}
                  />
                )}
              </div>
            </div>

      
            <div className="pt-chart-card dome-card-wrapper fade-in-up delay-200">
              <div className="pt-chart-header">
                <h3 className="pt-chart-title"><IconCurrencyDollar size={20} className="title-icon" /> Cost Contribution (Actual)</h3>
              </div>
              <div className="pt-chart-container chart-container-padded">
                {costContributionData.length === 0 ? (
                  <EmptyState message="No contribution data available" icon={IconChartLine} />
                ) : (
                  <GlobalPieChart
                    data={costContributionData}
                    innerRadius={80}
                    outerRadius={120}
                  />
                )}
              </div>
            </div>
          </div> */}

        {/* Orders Table */}
        <div className="efficiency-table-wrapper dome-card-wrapper fade-in-up delay-300">
          <div className="section-header-flex">
            <h3 className="section-title">Production Orders</h3>
            <div className="purchase-order-search-wrapper">
              <IconSearch size={18} className="purchase-order-search-icon" />
              <input
                type="text"
                placeholder="Search PO or Product..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="purchase-order-search-input"
              />
            </div>
          </div>
          <Table
            data={orders}
            isLoading={tableLoading}
            columns={columns}
            totalEntries={totalOrders}
            currentPage={page}
            pageSize={limit}
            onPageChange={setPage}
            onItemsPerPageChange={setLimit}
            showActions={false}
            onRowClick={(row) => handleOrderClick(row)}
          />
        </div>
      </>

      {/* Drill-down Modal */}
      {isModalVisible && selectedOrder && (
        <GlobalPopup onClose={() => setIsModalVisible(false)} className="large">
          <div
            className="modal-content"
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: "85vh",
            }}
          >
            {/* Modal Header (Fixed) */}
            <div style={{ flexShrink: 0, padding: "24px 24px 0 24px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  paddingBottom: "16px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1.25rem",
                      color: "#111827",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    Production Order: {selectedOrder.DocNum}
                    <span
                      className={`status-badge po-badge-${selectedOrder.Status === "L" || selectedOrder.Status === "C" ? "closed" : selectedOrder.Status === "R" || selectedOrder.Status === "P" ? "open" : "unknown"}`}
                      style={{
                        fontSize: "0.75rem",
                        padding: "4px 8px",
                        fontWeight: "500",
                      }}
                    >
                      {selectedOrder.Status === "L" ||
                      selectedOrder.Status === "C"
                        ? "Closed"
                        : selectedOrder.Status === "R"
                          ? "Released"
                          : selectedOrder.Status === "P"
                            ? "Planned"
                            : selectedOrder.Status}
                    </span>
                  </h3>
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      fontSize: "0.875rem",
                      color: "#6b7280",
                    }}
                  >
                    Product: {selectedOrder.FGItemCode}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <div
              style={{ flexGrow: 1, overflowY: "auto", padding: "16px 24px" }}
            >
              {materialsLoading ? (
                <GlobalLoading text="Loading materials..." />
              ) : materials.length === 0 ? (
                <EmptyState message="No material/resource data found for this order" />
              ) : (
                <Table
                  data={materials}
                  columns={materialColumns}
                  totalEntries={materials.length}
                  showActions={false}
                  showPagination={false}
                  rowHasSubComponent={(row) => {
                    const desc = (row["Item Description"] || "").toLowerCase();
                    const code = (row.ItemCode || "").toLowerCase();
                    return (
                      row.Type === "Resource" &&
                      (desc.includes("labor") ||
                        desc.includes("labour") ||
                        code.includes("-lc-")) &&
                      orderStaff.length > 0
                    );
                  }}
                  expandedRowRender={(row) => (
                    <>
                      {orderStaff.map((s) => (
                        <tr
                          key={s.StaffID}
                          style={{ backgroundColor: "#f8fafc" }}
                        >
                          <td
                            style={{
                              paddingLeft: "48px",
                              fontSize: "0.875rem",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <span
                                style={{
                                  width: "4px",
                                  height: "4px",
                                  borderRadius: "50%",
                                  backgroundColor: "#64748b",
                                }}
                              ></span>
                              {s.Name}
                            </div>
                          </td>
                          <td style={{ fontSize: "0.875rem" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "16px",
                              }}
                            >
                              <span>{s.Designation}</span>
                              <span
                                style={{ fontSize: "0.8rem", color: "#64748b" }}
                              >
                                {s.DaysWorked ? `${s.DaysWorked} Days` : ""}
                                {s.DaysWorked && s.TotalHours ? " • " : ""}
                                {s.TotalHours ? `${s.TotalHours} Hrs` : ""}
                              </span>
                            </div>
                          </td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td
                            style={{
                              textAlign: "right",
                              fontSize: "0.875rem",
                              fontWeight: "500",
                              color: "#1e293b",
                            }}
                          >
                            {s.CalculatedCost
                              ? parseFloat(s.CalculatedCost).toFixed(2)
                              : "-"}
                          </td>
                          <td></td>
                        </tr>
                      ))}
                    </>
                  )}
                />
              )}
            </div>

            {/* Modal Footer (Fixed) */}
            {!materialsLoading && materials.length > 0 && (
              <div
                style={{
                  flexShrink: 0,
                  padding: "0 24px 24px 24px",
                  backgroundColor: "#fff",
                }}
              >
                {(() => {
                  let totalStandardCost = 0;
                  let totalActualCost = 0;

                  materials.forEach((row) => {
                    const std =
                      (Number(row.PlannedQty) || 0) *
                      (Number(row["Item Cost"]) || 0);
                    totalStandardCost += std;
                    if (row.Type === "Item") {
                      totalActualCost += std;
                    }
                  });

                  const poQuantity = Number(selectedOrder.PlannedFGQty) || 1;
                  const averageTotalCost = totalStandardCost / poQuantity;

                  return (
                    <div
                      className="cost-summary-footer"
                      style={{ marginTop: "0", borderRadius: "0 0 8px 8px" }}
                    >
                      <div className="cost-summary-item">
                        <span className="cost-summary-label">
                          Total Standard Cost
                        </span>
                        <span className="cost-summary-value">
                          {totalStandardCost.toFixed(2)}
                        </span>
                      </div>
                      <div className="cost-summary-item">
                        <span className="cost-summary-label">
                          Total Actual Cost
                        </span>
                        <span className="cost-summary-value">
                          {totalActualCost.toFixed(2)}
                        </span>
                      </div>
                      <div className="cost-summary-item">
                        <span className="cost-summary-label">
                          Average Total Cost
                        </span>
                        <span className="cost-summary-value">
                          {averageTotalCost.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </GlobalPopup>
      )}
    </div>
  );
};

export default CostAnalysis;
