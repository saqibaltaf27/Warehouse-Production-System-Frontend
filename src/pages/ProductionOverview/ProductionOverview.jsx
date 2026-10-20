import React, { useState, useEffect } from "react";
import { axiosInstance } from "../../apis/axiosinstance";
import Table from "../../global-components/Table/Table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import "./ProductionOverview.css";

const DISPLAY_MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

const formatDisplayDate = (value) => {
  if (!value) return "";
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return String(value).replace(/T.*$/, "");
  return `${Number(match[3])} ${DISPLAY_MONTHS[Number(match[2]) - 1]} ${match[1]}`;
};

const qty = (value) => Number(value || 0).toLocaleString();
const rateText = (value) => (value == null ? "Data not available" : `${Number(value).toLocaleString()}%`);
const changeText = (value, suffix) => {
  if (value == null) return "No previous-month baseline";
  const sign = value > 0 ? "+" : "";
  return `${sign}${Number(value).toLocaleString()}${suffix} vs previous month`;
};

const ProductionAnalytics = ({ analytics, error }) => {
  if (error) {
    return <p className="overview-analytics-note">{error}</p>;
  }
  if (!analytics) return null;

  const completion = analytics.completion || {};
  const delayed = analytics.delayed || {};
  const quality = analytics.quality || {};
  const comparison = analytics.comparison || {};

  return (
    <div className="overview-analytics">
      <h3 className="overview-analytics-title">Production analytics</h3>
      <p className="overview-analytics-note">
        Orders due in the selected month, excluding cancelled. Quantities are Planned Qty and Completed Qty on the production order.
      </p>
      <div className="overview-status-grid">
        <div className="overview-status-card">
          <span className="overview-status-label">Production Completion Rate</span>
          <span className="overview-status-value">{rateText(completion.rate)}</span>
          <span className="overview-status-note">{changeText(comparison.completionRate, " pp")}</span>
        </div>
        <div className="overview-status-card">
          <span className="overview-status-label">Remaining Production Quantity</span>
          <span className="overview-status-value">{qty(completion.remainingQty)}</span>
        </div>
        <div className="overview-status-card">
          <span className="overview-status-label">In-Process Production Quantity</span>
          <span className="overview-status-value">{qty(completion.inProcessQty)}</span>
          <span className="overview-status-note">Released orders still short of planned quantity</span>
        </div>
        <div className="overview-status-card">
          <span className="overview-status-label">Production Orders In Progress</span>
          <span className="overview-status-value">{qty(completion.inProgressOrders)}</span>
        </div>
        <div className="overview-status-card">
          <span className="overview-status-label">Average Order Completion Time</span>
          <span className="overview-status-value">
            {analytics.averageCompletionDays == null ? "Data not available" : `${analytics.averageCompletionDays} days`}
          </span>
          <span className="overview-status-note">
            {qty(analytics.averageCompletionOrders)} orders closed in this month, start date to close date
          </span>
        </div>
      </div>

      <div className="card summary-table-card">
        <div className="card-header">Delayed Production Orders</div>
        <div className="overview-status-grid overview-month-grid">
          <div className="overview-status-card">
            <span className="overview-status-label">Total Delayed Orders</span>
            <span className="overview-status-value">{qty(delayed.totalOrders)}</span>
            <span className="overview-status-note">{changeText(comparison.delayedOrders, "%")}</span>
          </div>
          <div className="overview-status-card">
            <span className="overview-status-label">Total Overdue Quantity</span>
            <span className="overview-status-value">{qty(delayed.overdueQty)}</span>
            <span className="overview-status-note">Sum of remaining quantity. Units can differ by item.</span>
          </div>
          <div className="overview-status-card">
            <span className="overview-status-label">Maximum Days Overdue</span>
            <span className="overview-status-value">{qty(delayed.maxDaysOverdue)}</span>
            <span className="overview-status-note">Compared with today, not the end of the selected month</span>
          </div>
        </div>
        <Table
          data={delayed.orders || []}
          columns={[
            { header: "PO No", key: "ProductionOrderNo" },
            { header: "Product", key: "ProductName" },
            { header: "Planned Qty", key: "PlannedQty", align: "right" },
            { header: "Completed Qty", key: "CompletedQty", align: "right" },
            { header: "Remaining Qty", key: "RemainingQty", align: "right" },
            { header: "Due Date", key: "DueDate", render: (row) => formatDisplayDate(row.DueDate) },
            { header: "Status", key: "StatusName" },
            { header: "Days Overdue", key: "DaysOverdue", align: "right" },
          ]}
          totalEntries={(delayed.orders || []).length}
          showActions={false}
          showPagination={false}
        />
      </div>

      <div className="card summary-table-card">
        <div className="card-header">Monthly Production Performance Trend</div>
        <p className="overview-analytics-note">
          Last 12 months of orders by due date. Completed quantity is the quantity currently recorded on those orders.
        </p>
        <div className="overview-analytics-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.trend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="plannedQty" name="Planned" stroke="#1B47DB" dot={false} />
              <Line type="monotone" dataKey="completedQty" name="Completed" stroke="#10B981" dot={false} />
              <Line type="monotone" dataKey="inProcessQty" name="In process" stroke="#F59E0B" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card summary-table-card">
        <div className="card-header">Planned vs Actual Production</div>
        <Table
          data={analytics.byProduct || []}
          columns={[
            { header: "Item", key: "ItemCode" },
            { header: "Product", key: "ProductName" },
            { header: "Planned Qty", key: "PlannedQty", align: "right", render: (row) => qty(row.PlannedQty) },
            { header: "Completed Qty", key: "CompletedQty", align: "right", render: (row) => qty(row.CompletedQty) },
            { header: "Remaining Qty", key: "RemainingQty", align: "right", render: (row) => qty(row.RemainingQty) },
            { header: "Completion", key: "CompletionPct", align: "right", render: (row) => rateText(row.CompletionPct) },
          ]}
          totalEntries={(analytics.byProduct || []).length}
          showActions={false}
          showPagination={false}
        />
      </div>

      <div className="overview-status-grid">
        <div className="overview-status-card">
          <span className="overview-status-label">Samples Inspected</span>
          <span className="overview-status-value">{qty(quality.inspected)}</span>
        </div>
        <div className="overview-status-card">
          <span className="overview-status-label">Accepted Samples</span>
          <span className="overview-status-value">{qty(quality.accepted)}</span>
          <span className="overview-status-note">{changeText(comparison.acceptanceRate, " pp")} acceptance</span>
        </div>
        <div className="overview-status-card">
          <span className="overview-status-label">Rejected Samples</span>
          <span className="overview-status-value">{qty(quality.rejected)}</span>
          <span className="overview-status-note">{changeText(comparison.rejectionRate, " pp")} rejection</span>
        </div>
        <div className="overview-status-card">
          <span className="overview-status-label">Acceptance Rate</span>
          <span className="overview-status-value">{rateText(quality.acceptanceRate)}</span>
        </div>
        <div className="overview-status-card">
          <span className="overview-status-label">Rejection Rate</span>
          <span className="overview-status-value">{rateText(quality.rejectionRate)}</span>
          <span className="overview-status-note">Awaiting inspection: {qty(quality.awaiting)}</span>
        </div>
      </div>

      <div className="card summary-table-card">
        <div className="card-header">Production Performance by Item Group</div>
        <p className="overview-analytics-note">Grouped separately so different item units are not presented as one combined total.</p>
        <Table
          data={analytics.byItemGroup || []}
          columns={[
            { header: "Item Group", key: "ItemGroup" },
            { header: "Planned Qty", key: "PlannedQty", align: "right", render: (row) => qty(row.PlannedQty) },
            { header: "Completed Qty", key: "CompletedQty", align: "right", render: (row) => qty(row.CompletedQty) },
            { header: "Remaining Qty", key: "RemainingQty", align: "right", render: (row) => qty(row.RemainingQty) },
            { header: "Completion", key: "CompletionPct", align: "right", render: (row) => rateText(row.CompletionPct) },
          ]}
          totalEntries={(analytics.byItemGroup || []).length}
          showActions={false}
          showPagination={false}
        />
      </div>

      <div className="card summary-table-card">
        <div className="card-header">Production Bottlenecks</div>
        <p className="overview-analytics-note">
          Backlog only: released orders due this month that are still short of planned quantity. This is not a timed stage analysis.
        </p>
        <Table
          data={analytics.bottlenecks || []}
          columns={[
            { header: "Item Group", key: "ItemGroup" },
            { header: "Open Orders", key: "OrderCount", align: "right" },
            { header: "Remaining Qty", key: "RemainingQty", align: "right", render: (row) => qty(row.RemainingQty) },
          ]}
          totalEntries={(analytics.bottlenecks || []).length}
          showActions={false}
          showPagination={false}
        />
      </div>

      <div className="overview-status-grid overview-month-grid">
        <div className="overview-status-card">
          <span className="overview-status-label">Completed Quantity vs Last Month</span>
          <span className="overview-status-value">{changeText(comparison.completedQty, "%")}</span>
        </div>
        <div className="overview-status-card">
          <span className="overview-status-label">Closed Orders vs Last Month</span>
          <span className="overview-status-value">{changeText(comparison.closedOrders, "%")}</span>
        </div>
        <div className="overview-status-card">
          <span className="overview-status-label">Quality Acceptance vs Last Month</span>
          <span className="overview-status-value">{changeText(comparison.acceptanceRate, " pp")}</span>
        </div>
      </div>
    </div>
  );
};

const ProductionOverview = () => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [monthAchievement, setMonthAchievement] = useState({
    dueInMonth: 0,
    closedInMonth: 0,
    achievement: 0,
    orders: [],
  });
  const [sampleRows, setSampleRows] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsError, setAnalyticsError] = useState("");
  const [sampleStatus, setSampleStatus] = useState([
    { code: "S", label: "Sampled", count: 0 },
    { code: "UI", label: "Under Inspection", count: 0 },
    { code: "A", label: "Accepted", count: 0 },
    { code: "R", label: "Rejected", count: 0 },
    { code: "P", label: "Pending", count: 0 },
    { code: "CA", label: "Conditionally Accepted", count: 0 },
    { code: "CR", label: "Conditionally Rejected", count: 0 },
    { code: "C", label: "Cancel", count: 0 },
  ]);
  const [statusSummary, setStatusSummary] = useState({
    total: 0,
    Planned: 0,
    Released: 0,
    Closed: 0,
    Cancelled: 0,
  });
  const [productionSummaryData, setProductionSummaryData] = useState([]);
  const [costTrendData, setCostTrendData] = useState([]);
  const [loading, setLoading] = useState(true);

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const achievementResponse = await axiosInstance.get("/dashboard/monthly-production-achievement", {
          params: { month: selectedMonth, year: selectedYear },
        });
        if (achievementResponse.data?.success) {
          setMonthAchievement(achievementResponse.data.data);
        }

        const sampleResponse = await axiosInstance.get("/dashboard/monthly-sample-status", {
          params: { month: selectedMonth, year: selectedYear },
        });
        if (sampleResponse.data?.success) {
          setSampleStatus(sampleResponse.data.data?.cards || []);
          setSampleRows(sampleResponse.data.data?.samples || []);
        }

        try {
          const analyticsResponse = await axiosInstance.get("/dashboard/monthly-production-analytics", {
            params: { month: selectedMonth, year: selectedYear },
          });
          if (analyticsResponse.data?.success) {
            setAnalytics(analyticsResponse.data.data);
            setAnalyticsError("");
          }
        } catch (analyticsErr) {
          console.error("Error fetching production analytics:", analyticsErr);
          setAnalytics(null);
          setAnalyticsError("Production analytics are not available.");
        }

        const statusResponse = await axiosInstance.get("/dashboard/order-status-summary");
        if (statusResponse.data?.success) {
          setStatusSummary((current) => ({ ...current, ...statusResponse.data.data }));
        }

        const response = await axiosInstance.get("/dashboard/qc-overview", {
          params: { month: selectedMonth, year: selectedYear },
        });
        if (response.data && response.data.success) {
          const fetchedData = response.data.data.map((item, index) => {
            let packSize = 1;
            const match = item.ProductName.match(/(?:pack of |kit |\()(\d+)(?: tests?|\)|$)/i);
            if (match && match[1]) {
              packSize = parseInt(match[1], 10);
            } else {
              const match2 = item.ProductName.match(/\b(50|96|100|200)\b/);
              if (match2 && match2[1]) packSize = parseInt(match2[1], 10);
            }

            return {
              id: index + 1,
              group: item.ItemGroup,
              name: item.ProductName,
              planned: item.PlannedQty,
              completed: item.CompletedQty,
              overProduced: item.OverProducedQty || 0,
              inProcess: item.InProcessQty,
              resourceValue: item.ResourceValue || 0,
              prodCost: item.ResourceValue || 0,
              costBox: item.CostPerBox || 0,
              costTest: item.CostPerBox ? item.CostPerBox / packSize : 0,
            };
          });
          setProductionSummaryData(fetchedData);
        }

        const trendResponse = await axiosInstance.get("/dashboard/top-products-cost-trend", {
          params: { month: selectedMonth, year: selectedYear },
        });
        if (trendResponse.data && trendResponse.data.success) {
          setCostTrendData(trendResponse.data.data);
        }
      } catch (error) {
        console.error("Error fetching QC Overview data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedMonth, selectedYear]);

  const top5Data = React.useMemo(() => {
    return [...productionSummaryData]
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 5)
      .map((item) => ({
        name: item.name.substring(0, 15) + "...",
        qty: item.completed,
      }));
  }, [productionSummaryData]);

  const productionMixData = React.useMemo(() => {
    const groups = {};
    let total = 0;
    productionSummaryData.forEach((item) => {
      groups[item.group] =
        (groups[item.group] || 0) + (item.resourceValue || 0);
      total += item.resourceValue || 0;
    });
    const colors = [
      "#1B47DB",
      "#6997E4",
      "#10B981",
      "#F59E0B",
      "#B26552",
      "#94B5E3",
    ];

    // Create an "Others" group if needed or just show all. Sorting them makes it nicer.
    const data = Object.keys(groups)
      .map((key, i) => ({
        name: key,
        value: groups[key],
        color: colors[i % colors.length],
        percentage: total > 0 ? (groups[key] / total) * 100 : 0,
      }))
      .filter((g) => g.value > 0)
      .sort((a, b) => b.value - a.value);

    // Ensure colors stay consistent after sort
    data.forEach((d, i) => (d.color = colors[i % colors.length]));

    return { total, data };
  }, [productionSummaryData]);

  const productionStatusData = React.useMemo(() => {
    const totalCompleted = productionSummaryData.reduce(
      (acc, curr) => acc + curr.completed,
      0,
    );
    const totalInProcess = productionSummaryData.reduce(
      (acc, curr) => acc + curr.inProcess,
      0,
    );
    return [
      { name: "Completed", value: totalCompleted, color: "#10B981" },
      { name: "In Process", value: totalInProcess, color: "#F59E0B" },
    ];
  }, [productionSummaryData]);


  if (loading) {
    return (
      <div className="overview-loading">Loading...</div>
    );
  }

  const totalStatus =
    productionStatusData.reduce((acc, curr) => acc + curr.value, 0) || 1; // avoid div by 0

  const fmtMoney = (n) =>
    n
      ? Number(n).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "-";

  const sumField = (field) =>
    productionSummaryData.reduce((acc, row) => acc + (row[field] || 0), 0);

  const summaryRows = [
    ...productionSummaryData,
    {
      id: "total",
      isTotal: true,
      group: "",
      name: "TOTAL",
      planned: sumField("planned"),
      inProcess: sumField("inProcess"),
      completed: sumField("completed"),
      overProduced: sumField("overProduced"),
      resourceValue: sumField("resourceValue"),
      prodCost: sumField("prodCost"),
      costBox: null,
      costTest: null,
    },
  ];

  const summaryColumns = [
    { header: "#", key: "id", render: (row) => (row.isTotal ? "" : row.id) },
    { header: "Item Group", key: "group" },
    {
      header: "Product Name",
      key: "name",
      render: (row) =>
        row.isTotal ? <strong>{row.name}</strong> : row.name,
    },
    {
      header: "Planned Qty",
      key: "planned",
      align: "right",
      render: (row) => (row.planned ? row.planned.toLocaleString() : row.isTotal ? "0" : "-"),
    },
    {
      header: "In Process Qty",
      key: "inProcess",
      align: "right",
      render: (row) => (row.inProcess ? row.inProcess.toLocaleString() : row.isTotal ? "0" : "-"),
    },
    {
      header: "Completed Qty",
      key: "completed",
      align: "right",
      render: (row) => (
        <span>
          {row.completed ? row.completed.toLocaleString() : row.isTotal ? "0" : "-"}
          {row.overProduced > 0 && (
            <div className="overview-overproduced">
              (+{row.overProduced.toLocaleString()} Over Produced)
            </div>
          )}
        </span>
      ),
    },
    {
      header: "Resource Value (PKR)",
      key: "resourceValue",
      align: "right",
      render: (row) => (row.isTotal ? <strong>{fmtMoney(row.resourceValue)}</strong> : fmtMoney(row.resourceValue)),
    },
    {
      header: "Production Cost",
      key: "prodCost",
      align: "right",
      render: (row) => (row.isTotal ? <strong>{fmtMoney(row.prodCost)}</strong> : fmtMoney(row.prodCost)),
    },
    {
      header: "Cost per Box (PKR)",
      key: "costBox",
      align: "right",
      render: (row) => fmtMoney(row.costBox),
    },
    {
      header: "Cost per Test (PKR)",
      key: "costTest",
      align: "right",
      render: (row) => fmtMoney(row.costTest),
    },
  ];

  return (
    <div className="layout-page-padding production-overview">
      <div className="overview-status-grid">
        {[
          { label: "All Orders", value: statusSummary.total },
          { label: "Planned", value: statusSummary.Planned },
          { label: "Released", value: statusSummary.Released },
          { label: "Closed", value: statusSummary.Closed },
          { label: "Cancelled", value: statusSummary.Cancelled },
        ].map((card) => (
          <div className="overview-status-card" key={card.label}>
            <span className="overview-status-label">{card.label}</span>
            <span className="overview-status-value">{Number(card.value || 0).toLocaleString()}</span>
          </div>
        ))}
      </div>
      <div className="overview-header-container">
        <div className="overview-header">
          <h2>
            Monthly Report -{" "}
            {months
              .find((m) => m.value === selectedMonth)
              ?.label?.toUpperCase()}{" "}
            {selectedYear}
          </h2>
          <div className="overview-status-grid overview-month-grid">
            <div className="overview-status-card">
              <span className="overview-status-label">Due in month</span>
              <span className="overview-status-value">{Number(monthAchievement.dueInMonth || 0).toLocaleString()}</span>
            </div>
            <div className="overview-status-card">
              <span className="overview-status-label">Closed in month</span>
              <span className="overview-status-value">{Number(monthAchievement.closedInMonth || 0).toLocaleString()}</span>
            </div>
            <div className="overview-status-card">
              <span className="overview-status-label">Production Achievement</span>
              <span className="overview-status-value">{Number(monthAchievement.achievement || 0).toLocaleString()}%</span>
              <span className="overview-status-note">Closed POs due this month and closed this month</span>
            </div>
          </div>
          <div className="overview-status-grid overview-sample-grid">
            {sampleStatus.map((card) => (
              <div className="overview-status-card" key={card.code}>
                <span className="overview-status-label">{card.label}</span>
                <span className="overview-status-value">{Number(card.count || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="overview-filters">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card summary-table-card overview-due-orders">
        <div className="card-header">Production orders due in this month</div>
        <Table
          data={monthAchievement.orders || []}
          columns={[
            { header: "PO No", key: "ProductionOrderNo" },
            { header: "Item", key: "ItemCode" },
            { header: "Product", key: "ProductName" },
            { header: "Status", key: "StatusName" },
            {
              header: "Due Date",
              key: "DueDate",
              render: (row) => formatDisplayDate(row.DueDate),
            },
            {
              header: "Close Date",
              key: "CloseDate",
              render: (row) => formatDisplayDate(row.CloseDate),
            },
            { header: "Planned Qty", key: "PlannedQty", align: "right" },
            { header: "Completed Qty", key: "CompletedQty", align: "right" },
            {
              header: "Closed in month",
              key: "ClosedInMonth",
              render: (row) => (Number(row.ClosedInMonth) === 1 ? "Yes" : "No"),
            },
          ]}
          totalEntries={(monthAchievement.orders || []).length}
          showActions={false}
          showPagination={false}
        />
      </div>

      <div className="card summary-table-card overview-due-orders">
        <div className="card-header">Samples in this month</div>
        <Table
          data={sampleRows}
          columns={[
            { header: "Sampling No", key: "SamplingNo" },
            {
              header: "Sampling Date",
              key: "SamplingDate",
              render: (row) => formatDisplayDate(row.SamplingDate),
            },
            { header: "Item", key: "ItemCode" },
            { header: "Item Name", key: "ItemName" },
            { header: "Batch", key: "Batch" },
            { header: "Sample Qty", key: "SampleQty", align: "right" },
            { header: "Status", key: "StatusName" },
            { header: "Document Type", key: "DocumentType" },
            { header: "Document No", key: "DocumentNo" },
            { header: "Supplier", key: "SupplierName" },
          ]}
          totalEntries={sampleRows.length}
          showActions={false}
          showPagination={false}
        />
      </div>

      <ProductionAnalytics analytics={analytics} error={analyticsError} />

      <div className="overview-layout">
        <div className="overview-column">
        <div className="card summary-table-card">
          <div className="card-header">1. PRODUCTION SUMMARY (ALL ITEMS)</div>
          <Table
            data={summaryRows}
            columns={summaryColumns}
            totalEntries={summaryRows.length}
            showActions={false}
            showPagination={false}
          />
        </div>

        <div className="card cost-comp-card">
          <div className="card-header">
            5. COST COMPARISON TREND (TOP PRODUCED ITEMS)
          </div>
          <div className="cost-comp-content">
            {costTrendData.length === 0 ? (
              <div className="overview-empty">
                No trend data available for this period.
              </div>
            ) : (
              costTrendData.map((item, index) => {
                const costs = item.trends.map((t) => t.cost).filter((c) => c > 0);
                let highestCost = 0;
                let lowestCost = 0;
                let highestPOs = [];
                let lowestPOs = [];
                let variation = 0;

                if (costs.length > 0) {
                  highestCost = Math.max(...costs);
                  lowestCost = Math.min(...costs);
                  highestPOs = item.trends
                    .filter((t) => t.cost === highestCost)
                    .map((t) => t.po);
                  lowestPOs = item.trends
                    .filter((t) => t.cost === lowestCost)
                    .map((t) => t.po);
                  if (lowestCost > 0) {
                    variation = ((highestCost - lowestCost) / lowestCost) * 100;
                  }
                }

                return (
                  <div className="cost-comp-section" key={item.itemName}>
                    <div className="sub-header">
                      {String.fromCharCode(65 + index)}. {item.itemName.toUpperCase()} - COST PER BOX TREND
                    </div>
                    <div className="cost-comp-row">
                      <div className="cost-table-wrap">
                        <Table
                          data={item.trends}
                          columns={[
                            { header: "Doc Num", key: "po" },
                            {
                              header: "Completed Qty",
                              key: "completedQty",
                              align: "right",
                              render: (row) => row.completedQty.toLocaleString(),
                            },
                            {
                              header: "Cost per Box",
                              key: "cost",
                              align: "right",
                              render: (row) => (row.cost ? row.cost.toFixed(2) : "-"),
                            },
                          ]}
                          totalEntries={item.trends.length}
                          showActions={false}
                          showPagination={false}
                        />
                      </div>
                      <div className="cost-chart-wrap">
                        <ResponsiveContainer width="100%" height={150}>
                          <LineChart
                            data={item.trends}
                            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                          >
                            <XAxis dataKey="po" tick={{ fontSize: 10 }} />
                            <YAxis
                              domain={["auto", "auto"]}
                              tick={{ fontSize: 10 }}
                            />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="cost"
                              stroke={index === 1 ? "#10B981" : "#1B47DB"}
                              strokeWidth={2}
                              dot={{ r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    {costs.length > 0 && (
                      <div className="cost-summary-bar">
                        <div className="summary-stat">
                          <span className="summary-stat-icon">↑</span>
                          <div>
                            <div className="summary-stat-label">Highest Cost / Box</div>
                            <div className="summary-stat-value">PKR {highestCost.toFixed(2)}</div>
                            <div className="summary-stat-note">(PO {highestPOs.join(" & ")})</div>
                          </div>
                        </div>
                        <div className="summary-stat">
                          <span className="summary-stat-icon">↓</span>
                          <div>
                            <div className="summary-stat-label">Lowest Cost / Box</div>
                            <div className="summary-stat-value">PKR {lowestCost.toFixed(2)}</div>
                            <div className="summary-stat-note">(PO {lowestPOs.join(" & ")})</div>
                          </div>
                        </div>
                        <div className="summary-stat">
                          <span className="summary-stat-icon">↗</span>
                          <div>
                            <div className="summary-stat-label">Variation</div>
                            <div className="summary-stat-value">{variation.toFixed(2)}%</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
        </div>

        <div className="overview-column">
        <div className="card top5-card">
          <div className="card-header">2. TOP 5 ITEMS BY COMPLETED QTY</div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={top5Data}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={120}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip />
                <Bar dataKey="qty" fill="#1B47DB" barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Right 2: Production Mix */}
        <div className="card mix-card">
          <div className="card-header">
            3. PRODUCTION MIX BY ITEM GROUP (BY RESOURCE VALUE)
          </div>
          <div className="mix-content">
            <div className="chart-container-donut">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 20 }}>
                  <Pie
                    data={productionMixData.data}
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {productionMixData.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) =>
                      value.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center">
                <span>
                  BY RESOURCE
                  <br />
                  VALUE
                  <br />
                  (PKR)
                </span>
              </div>
            </div>
            <div className="mix-legend-wrap">
              <div className="mix-legend">
                {productionMixData.data.map((item, index) => (
                  <div key={index} className="legend-item">
                    <svg className="legend-color" viewBox="0 0 12 12" aria-hidden="true">
                      <circle cx="6" cy="6" r="6" fill={item.color} />
                    </svg>
                    <span className="legend-name">{item.name}</span>
                    <span className="legend-value">
                      {item.value.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="legend-percent">{item.percentage.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
              <div className="legend-total-row">
                <span>TOTAL</span>
                <span>
                  {productionMixData.total.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card status-card">
          <div className="card-header">
            4. PRODUCTION STATUS (ALL ITEMS)
          </div>
          <div className="status-content">
            <div className="chart-container-donut">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={productionStatusData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {productionStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="status-legend">
              <div className="legend-item">
                <svg className="legend-color" viewBox="0 0 12 12" aria-hidden="true">
                  <circle cx="6" cy="6" r="6" fill={productionStatusData[0].color} />
                </svg>
                <span className="legend-name">Completed</span>
                <span className="legend-value">
                  {productionStatusData[0].value.toLocaleString()} (
                  {(
                    (productionStatusData[0].value / totalStatus) *
                    100
                  ).toFixed(1)}
                  %)
                </span>
              </div>
              <div className="legend-item">
                <svg className="legend-color" viewBox="0 0 12 12" aria-hidden="true">
                  <circle cx="6" cy="6" r="6" fill={productionStatusData[1].color} />
                </svg>
                <span className="legend-name">In Process</span>
                <span className="legend-value">
                  {productionStatusData[1].value.toLocaleString()} (
                  {(
                    (productionStatusData[1].value / totalStatus) *
                    100
                  ).toFixed(1)}
                  %)
                </span>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionOverview;
