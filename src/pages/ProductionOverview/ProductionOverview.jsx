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

const kpiIcon = (name) => {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "cal") return <svg {...common}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></svg>;
  if (name === "box") return <svg {...common}><path d="M3 8l9-4 9 4-9 4-9-4z" /><path d="M3 8v8l9 4 9-4V8" /><path d="M12 12v8" /></svg>;
  if (name === "x") return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M9 9l6 6M15 9l-6 6" /></svg>;
  if (name === "trend") return <svg {...common}><path d="M4 16l5-5 3 3 7-7" /><path d="M14 7h5v5" /></svg>;
  if (name === "search") return <svg {...common}><circle cx="11" cy="11" r="6" /><path d="M16 16l4 4" /></svg>;
  if (name === "check") return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M8 12l2.5 2.5L16 9" /></svg>;
  if (name === "flask") return <svg {...common}><path d="M9 3h6M10 3v6L5 19a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-10V3" /></svg>;
  return <svg {...common}><path d="M7 3h8l2 4v14H5V7l2-4z" /><path d="M8 11h8" /></svg>;
};

const formatDisplayDate = (value) => {
  if (!value) return "";
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return String(value).replace(/T.*$/, "");
  return `${Number(match[3])} ${DISPLAY_MONTHS[Number(match[2]) - 1]} ${match[1]}`;
};

const ProductionAnalytics = ({ analytics, error }) => {
  if (error) {
    return <p className="overview-analytics-note">{error}</p>;
  }
  if (!analytics) return null;

  return (
    <div className="overview-analytics">
      <h3 className="overview-analytics-title">Production analytics</h3>
      <div className="card summary-table-card">
        <div className="card-header">Monthly Production Performance Trend</div>
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
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState(10);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderTotal, setOrderTotal] = useState(0);
  const [samplePage, setSamplePage] = useState(1);
  const [samplePageSize, setSamplePageSize] = useState(10);
  const [sampleSearch, setSampleSearch] = useState("");
  const [sampleTotal, setSampleTotal] = useState(0);
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
  const [costSlots, setCostSlots] = useState([]);
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
          const products = trendResponse.data.data || [];
          setCostTrendData(products);
          setCostSlots(products.slice(0, 2).map((item) => item.itemCode));
        }
      } catch (error) {
        console.error("Error fetching QC Overview data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    setOrderPage(1);
    setSamplePage(1);
  }, [selectedMonth, selectedYear, orderSearch, sampleSearch]);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const achievementResponse = await axiosInstance.get("/dashboard/monthly-production-achievement", {
          params: {
            month: selectedMonth,
            year: selectedYear,
            page: orderPage,
            limit: orderPageSize,
            search: orderSearch,
          },
        });
        if (achievementResponse.data?.success) {
          setMonthAchievement(achievementResponse.data.data);
          setOrderTotal(achievementResponse.data.pagination?.total || 0);
        }
      } catch (error) {
        console.error("Error fetching due production orders:", error);
      }
    };
    loadOrders();
  }, [selectedMonth, selectedYear, orderPage, orderPageSize, orderSearch]);

  useEffect(() => {
    const loadSamples = async () => {
      try {
        const sampleResponse = await axiosInstance.get("/dashboard/monthly-sample-status", {
          params: {
            month: selectedMonth,
            year: selectedYear,
            page: samplePage,
            limit: samplePageSize,
            search: sampleSearch,
          },
        });
        if (sampleResponse.data?.success) {
          setSampleStatus(sampleResponse.data.data?.cards || []);
          setSampleRows(sampleResponse.data.data?.samples || []);
          setSampleTotal(sampleResponse.data.pagination?.total || 0);
        }
      } catch (error) {
        console.error("Error fetching monthly samples:", error);
      }
    };
    loadSamples();
  }, [selectedMonth, selectedYear, samplePage, samplePageSize, sampleSearch]);

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

  if (loading) {
    return (
      <div className="overview-loading">Loading...</div>
    );
  }

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
    /* {
      header: "Resource Value (PKR)",
      key: "resourceValue",
      align: "right",
      render: (row) => (row.isTotal ? <strong>{fmtMoney(row.resourceValue)}</strong> : fmtMoney(row.resourceValue)),
    }, */
    {
      header: "Production Cost",
      key: "prodCost",
      align: "right",
      render: (row) => (row.isTotal ? <strong>{fmtMoney(row.prodCost)}</strong> : fmtMoney(row.prodCost)),
    },
    /* {
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
    }, */
  ];

  const achievementPct = Math.max(0, Math.min(100, Number(monthAchievement.achievement || 0)));
  const sampleTones = {
    S: "tone-amber",
    UI: "tone-violet",
    A: "tone-green",
    R: "tone-rose",
    P: "tone-blue",
    CA: "tone-green",
    CR: "tone-rose",
    C: "tone-slate",
  };

  return (
    <div className="layout-page-padding production-overview">
      <div className="overview-status-grid">
        {[
          { label: "All Orders", value: statusSummary.total, tone: "tone-blue", icon: "doc" },
          { label: "Planned", value: statusSummary.Planned, tone: "tone-green", icon: "cal" },
          { label: "Released", value: statusSummary.Released, tone: "tone-violet", icon: "box" },
          { label: "Closed", value: statusSummary.Closed, tone: "tone-peach", icon: "box" },
          { label: "Cancelled", value: statusSummary.Cancelled, tone: "tone-rose", icon: "x" },
        ].map((card) => (
          <div className={`overview-status-card ${card.tone}`} key={card.label}>
            <span className="overview-kpi-icon">{kpiIcon(card.icon)}</span>
            <span className="overview-status-label">{card.label}</span>
            <span className="overview-status-value">{Number(card.value || 0).toLocaleString()}</span>
          </div>
        ))}
      </div>
      <div className="overview-header-container">
        <div className="overview-header">
          <div className="overview-report-top">
            <div>
              <h2>
                Monthly Report -{" "}
                {months.find((m) => m.value === selectedMonth)?.label}{" "}
                {selectedYear}
              </h2>
              <p className="overview-report-sub">Overview of production orders for the selected month</p>
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
          <div className="overview-status-grid overview-month-grid">
            <div className="overview-status-card tone-blue">
              <span className="overview-kpi-icon">{kpiIcon("doc")}</span>
              <span className="overview-status-label">Due in month</span>
              <span className="overview-status-value">{Number(monthAchievement.dueInMonth || 0).toLocaleString()}</span>
              <span className="overview-status-note">Production orders due this month</span>
            </div>
            <div className="overview-status-card tone-rose">
              <span className="overview-kpi-icon">{kpiIcon("box")}</span>
              <span className="overview-status-label">Closed in month</span>
              <span className="overview-status-value">{Number(monthAchievement.closedInMonth || 0).toLocaleString()}</span>
              <span className="overview-status-note">Production orders closed this month</span>
            </div>
            <div className="overview-status-card tone-mint overview-achieve-card">
              <div>
                <span className="overview-kpi-icon">{kpiIcon("trend")}</span>
                <span className="overview-status-label">Production Achievement</span>
                <span className="overview-status-value">{Number(monthAchievement.achievement || 0).toLocaleString()}%</span>
                <span className="overview-status-note">Closed POs due this month and closed this month</span>
              </div>
              <svg className="overview-ring" viewBox="0 0 44 44" aria-hidden="true">
                <circle cx="22" cy="22" r="16" className="overview-ring-track" />
                <circle
                  cx="22"
                  cy="22"
                  r="16"
                  className="overview-ring-value"
                  strokeDasharray={`${(achievementPct / 100) * 100.5} 100.5`}
                />
                <text x="22" y="25" textAnchor="middle">{achievementPct.toFixed(1)}%</text>
              </svg>
            </div>
          </div>
          <div className="overview-status-grid overview-sample-grid">
            {sampleStatus.map((card) => (
              <div className={`overview-status-card ${sampleTones[card.code] || "tone-slate"}`} key={card.code}>
                <span className="overview-kpi-icon">{kpiIcon(card.code === "UI" ? "search" : card.code === "A" || card.code === "CA" ? "check" : card.code === "R" || card.code === "CR" || card.code === "C" ? "x" : "flask")}</span>
                <span className="overview-status-label">{card.label}</span>
                <span className="overview-status-value">{Number(card.count || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
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
        </div>

        <div className="card cost-comp-card overview-cost-full">
          <div className="card-header">
            5. COST COMPARISON TREND (TOP PRODUCED ITEMS)
          </div>
          <div className="cost-comp-toolbar">
            <button
              type="button"
              className="cost-comp-add"
              disabled={costSlots.length >= 4 || costSlots.length >= costTrendData.length}
              onClick={() => {
                const next = costTrendData.find((item) => !costSlots.includes(item.itemCode));
                if (next) setCostSlots((current) => [...current, next.itemCode]);
              }}
            >
              Add product
            </button>
          </div>
          <div
            className="cost-comp-content"
            style={{ gridTemplateColumns: `repeat(${Math.max(costSlots.length, 1)}, minmax(0, 1fr))` }}
          >
            {costTrendData.length === 0 ? (
              <div className="overview-empty">
                No trend data available for this period.
              </div>
            ) : (
              costSlots.map((itemCode, index) => {
                const item = costTrendData.find((product) => product.itemCode === itemCode);
                if (!item) return null;
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
                  <div className="cost-comp-section" key={item.itemCode}>
                    <div className="cost-comp-section-head">
                      <span>{String.fromCharCode(65 + index)}.</span>
                      <select
                        value={item.itemCode}
                        onChange={(e) => {
                          const value = e.target.value;
                          setCostSlots((current) => current.map((code, slotIndex) => (slotIndex === index ? value : code)));
                        }}
                      >
                        {costTrendData.map((product) => (
                          <option
                            key={product.itemCode}
                            value={product.itemCode}
                            disabled={costSlots.includes(product.itemCode) && product.itemCode !== item.itemCode}
                          >
                            {product.itemName}
                          </option>
                        ))}
                      </select>
                      {index >= 2 && (
                        <button
                          type="button"
                          className="cost-comp-remove"
                          onClick={() => setCostSlots((current) => current.filter((_, slotIndex) => slotIndex !== index))}
                        >
                          Remove
                        </button>
                      )}
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

        </div>
      </div>

      <div className="card summary-table-card overview-due-orders">
        <div className="card-header overview-table-header">
          <span>
            Production orders due in {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
          </span>
          <input
            className="overview-table-search"
            type="search"
            placeholder="Search"
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
          />
        </div>
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
          totalEntries={orderTotal}
          showActions={false}
          showPagination={true}
          currentPage={orderPage}
          pageSize={orderPageSize}
          onPageChange={setOrderPage}
          onItemsPerPageChange={(size) => {
            setOrderPageSize(size);
            setOrderPage(1);
          }}
        />
      </div>

      <div className="card summary-table-card overview-due-orders">
        <div className="card-header overview-table-header">
          <span>
            Samples in {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
          </span>
          <input
            className="overview-table-search"
            type="search"
            placeholder="Search"
            value={sampleSearch}
            onChange={(e) => setSampleSearch(e.target.value)}
          />
        </div>
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
          totalEntries={sampleTotal}
          showActions={false}
          showPagination={true}
          currentPage={samplePage}
          pageSize={samplePageSize}
          onPageChange={setSamplePage}
          onItemsPerPageChange={(size) => {
            setSamplePageSize(size);
            setSamplePage(1);
          }}
        />
      </div>
    </div>
  );
};

export default ProductionOverview;
