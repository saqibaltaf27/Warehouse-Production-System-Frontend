import React, { useState, useEffect, useCallback } from "react";
import {
  IconRefresh,
  IconAlertTriangle,
  IconAlertCircle,
  IconCheck,
  IconTrendingUp,
  IconTrendingDown,
  IconPackage,
  IconSettings,
  IconCurrencyDollar,
  IconClipboardList,
  IconClock,
} from "@tabler/icons-react";
import LineChart from "../../global-components/Charts/LineChart";
import PieChart from "../../global-components/Charts/PieChart";
import BarChart from "../../global-components/Charts/BarChart";
import Card from "../../global-components/Card/Card";
import { axiosInstance } from "../../apis/axiosinstance";
import { API_ENDPOINTS } from "../../apis/endpoints";
import Pagination from "../../global-components/Pagination/Pagination";
import "./Dashboard.css";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

const formatCompactCurrency = (value) => {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // History Pagination State
  const [history, setHistory] = useState([]);
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    pageSize: 5,
    totalRecords: 0,
    totalPages: 0,
  });
  const [historyLoading, setHistoryLoading] = useState(false);

  // Filtered Orders State
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [orderVolume, setOrderVolume] = useState({ ReleasedCount: 0, ClosedCount: 0, CancelledCount: 0, PlannedCount: 0, DelayedCount: 0 });
  const [filteredOrdersLoading, setFilteredOrdersLoading] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [tableDateFilter, setTableDateFilter] = useState('today');
  const [volumeDateFilter, setVolumeDateFilter] = useState('yearly');

  // Filters and Warehouses
  const [warehouses, setWarehouses] = useState([]);
  const [filters, setFilters] = useState({
    warehouse: "",
    dateFrom: "",
    dateTo: "",
  });

  const fetchHistory = useCallback(
    async (page = 1, pageSize = 5) => {
      setHistoryLoading(true);
      try {
        const params = { page, pageSize, months: 1 };
        if (filters.warehouse) params.warehouse = filters.warehouse;
        if (filters.dateFrom) params.dateFrom = filters.dateFrom;
        if (filters.dateTo) params.dateTo = filters.dateTo;

        const res = await axiosInstance.get(
          API_ENDPOINTS.PRODUCTION_PLANNING.HISTORY,
          { params },
        );
        if (res.data?.success) {
          setHistory(res.data.data);
          setHistoryPagination({
            page: res.data.pagination.currentPage,
            pageSize: res.data.pagination.pageSize,
            totalRecords: res.data.pagination.totalRecords,
            totalPages: res.data.pagination.totalPages,
          });
        }
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setHistoryLoading(false);
      }
    },
    [filters],
  );

  const fetchOverviewData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query string
      const params = {};
      if (filters.warehouse) params.warehouse = filters.warehouse;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;

      const [overviewRes, shortagesRes] = await Promise.all([
        axiosInstance.get(API_ENDPOINTS.DASHBOARD.OVERVIEW, { params }),
        axiosInstance.get(API_ENDPOINTS.PRODUCTION_PLANNING.SHORTAGES, {
          params: { pageSize: 5, ...params },
        }),
      ]);

      if (overviewRes.data && overviewRes.data.success) {
        setData({
          ...overviewRes.data.data,
          shortages: shortagesRes.data?.data || [],
        });
      } else {
        throw new Error(
          overviewRes.data?.message || "Failed to fetch dashboard data",
        );
      }
    } catch (err) {
      console.error("Error fetching dashboard overview:", err);
      setError(err.message || "An error occurred while fetching data");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchFilteredOrders = useCallback(async () => {
    setFilteredOrdersLoading(true);
    try {
      const params = {
        status: orderStatusFilter,
        tableDateFilter: tableDateFilter,
        volumeDateFilter: volumeDateFilter
      };
      if (filters.warehouse) params.warehouse = filters.warehouse;

      const res = await axiosInstance.get(API_ENDPOINTS.DASHBOARD.OVERVIEW + '/filtered-orders', { params });
      if (res.data?.success) {
        setFilteredOrders(res.data.data.orders || []);
        setOrderVolume(res.data.data.volume || { ReleasedCount: 0, ClosedCount: 0, CancelledCount: 0, PlannedCount: 0, DelayedCount: 0 });
      }
    } catch (err) {
      console.error("Error fetching filtered orders:", err);
    } finally {
      setFilteredOrdersLoading(false);
    }
  }, [orderStatusFilter, tableDateFilter, volumeDateFilter, filters.warehouse]);

  useEffect(() => {
    // Fetch warehouses for dropdown
    const fetchWarehouses = async () => {
      try {
        const res = await axiosInstance.get(API_ENDPOINTS.INVENTORY.WAREHOUSES);
        if (res.data?.success) {
          setWarehouses(res.data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch warehouses:", err);
      }
    };
    fetchWarehouses();
  }, []);

  useEffect(() => {
    fetchOverviewData();
    fetchHistory(1, historyPagination.pageSize);
  }, [fetchOverviewData, fetchHistory]);

  useEffect(() => {
    fetchFilteredOrders();
  }, [fetchFilteredOrders]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleRefresh = () => {
    fetchOverviewData();
    fetchFilteredOrders();
  };

  if (loading && !data) {
    return (
      <div className="executive-dashboard">
        <div className="dashboard-state">
          <IconRefresh className="spin" size={48} color="var(--primary)" />
          <p>Loading Executive Overview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="executive-dashboard">
        <div className="dashboard-state">
          <IconAlertTriangle size={48} color="#ef4444" />
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button className="btn-refresh" onClick={handleRefresh}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const {
    executiveKPIs,
    productionPerformance,
    inventoryHealth,
    recentOrders,
    openOrdersDetails,
    alerts,
    shortages,
  } = data;

  return (
    <div className="executive-dashboard">

      {/* Row 1: KPIs */}
      <div className="fade-in-up delay-100 mb-6">
        <Card items={[
          {
            title: "Total Orders",
            value: executiveKPIs.totalOrders,
            trendText: "Total created orders",
            icon: IconClipboardList
          },
          {
            title: "In Progress Orders",
            value: executiveKPIs.activeOrders,
            trendText: "Orders in production",
            icon: IconCheck
          },
          {
            title: "Cancelled Orders",
            value: executiveKPIs.cancelledOrders || 0,
            trendText: "Cancelled production orders",
            icon: IconAlertCircle
          },
          {
            title: "Delayed Orders",
            value: executiveKPIs.delayedOrders || 0,
            trendText: "Orders behind schedule",
            icon: IconAlertTriangle
          },
          {
            title: "Completed Orders",
            value: executiveKPIs.closedOrders || 0,
            trendText: "Completed orders",
            icon: IconCheck
          }
        ]} />
      </div>

      {/* Row 2: Production Trend */}
      <div className="dashboard-row fade-in-up delay-200">
        <div className="dashboard-col-2-3">
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3>
                <IconTrendingUp size={20} /> Production Output Trend (Last 6
                Months)
              </h3>
            </div>
            <div className="dashboard-card-content">
              <div className="chart-container">
                  <BarChart
                    data={productionPerformance?.map((item) => {
                      const months = [
                        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
                      ];
                      return {
                        ...item,
                        MonthName: months[item.Month - 1] || item.Month
                      };
                    })}
                    xAxisKey="MonthName"
                    series={[
                      { key: "PlannedQty", name: "Planned Qty", color: "#3b82f6", yAxisId: "left" },
                      { key: "OrderCount", name: "Orders Count", color: "#10b981", yAxisId: "right" }
                    ]}
                    showLegend={true}
                    secondaryYAxis={true}
                  />
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-col-1-3">
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3>
                <IconAlertCircle size={20} /> Operational Alerts
              </h3>
            </div>
            <div className="dashboard-card-content no-padding">
              {alerts && alerts.length > 0 ? (
                <div className="alert-list alert-list-padding">
                  {alerts.map((alert) => (
                    <div key={alert.id} className={`alert-item ${alert.type}`}>
                      <div className={`alert-icon ${alert.type}`}>
                        {alert.type === "critical" ? (
                          <IconAlertTriangle />
                        ) : (
                          <IconAlertCircle />
                        )}
                      </div>
                      <div className="alert-content">
                        <div className="alert-title">{alert.title}</div>
                        <div className="alert-desc">{alert.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dashboard-state">
                  <IconCheck size={48} color="#10b981" />
                  <p>All operations are normal</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Inventory & Mix */}
      <div className="dashboard-row fade-in-up delay-300">
        <div className="dashboard-col-1-2">
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3>
                <IconPackage size={20} /> Critical Material Shortages
              </h3>
            </div>
            <div className="dashboard-card-content no-padding">
              <div className="compact-table-wrapper">
                <table className="compact-table">
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th className="text-right">Required</th>
                      <th className="text-right">Available</th>
                      <th className="text-right">Shortage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shortages && shortages.length > 0 ? (
                      shortages.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong>{item.ComponentCode}</strong>
                            <div
                              className="alert-time"
                            >
                              {item.ComponentName}
                            </div>
                          </td>
                          <td className="text-right">
                            {item.RemainingRequired?.toLocaleString()}
                          </td>
                          <td className="text-right">
                            {item.TotalAvailable?.toLocaleString()}
                          </td>
                          <td className="text-right">
                            <span className="status-badge critical">
                              {item.ShortageQty?.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="table-empty-cell"
                        >
                          No critical shortages
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-col-1-2">
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3>
                <IconClipboardList size={20} /> Open Orders
              </h3>
            </div>
            <div className="dashboard-card-content no-padding">
              <div
                className="compact-table-wrapper alert-scroll-container"
              >
                <table className="compact-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Product</th>
                      <th>Status</th>
                      <th className="text-right">Qty (Actual / Plan)</th>
                      <th className="text-right">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openOrdersDetails && openOrdersDetails.length > 0 ? (
                      openOrdersDetails.map((order, idx) => {
                        const progress =
                          order.PlannedQty > 0
                            ? (order.ActualQty / order.PlannedQty) * 100
                            : 0;
                        return (
                          <tr key={idx}>
                            <td>
                              <strong>{order.DocNum}</strong>
                            </td>
                            <td>
                              {(order.ProductName || "").substring(0, 20)}
                            </td>
                            <td>
                              <span
                                className={`status-badge ${order.Status === "L"
                                  ? "success"
                                  : order.Status === "R"
                                    ? "warning"
                                    : order.Status === "C"
                                      ? "critical"
                                      : "default"
                                }`}
                              >
                                {order.Status === "L"
                                  ? "Completed"
                                  : order.Status === "R"
                                    ? "Work In Progress"
                                    : order.Status === "C"
                                      ? "Cancelled"
                                      : "Planned"}
                              </span>
                            </td>
                            <td className="text-right">
                              <strong>
                                {order.ActualQty?.toLocaleString()}
                              </strong>{" "}
                              / {order.PlannedQty?.toLocaleString()}
                            </td>
                            <td className="text-right">
                              <div className="progress-bar-cell-container">
                                <span className="progress-bar-text">
                                  {progress.toFixed(0)}%
                                </span>
                                <div className="progress-bar-track">
                                  <div
                                    className={`progress-bar-fill ${progress < 100 ? "incomplete" : "complete"}`}
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="table-empty-cell"
                        >
                          No open orders
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Filtered Orders & Volume summary */}
      <div className="dashboard-row fade-in-up delay-300">
        <div className="dashboard-col-2-3">
          <div className="dashboard-card">
            <div className="dashboard-card-header header-spaced">
              <h3 className="no-margin">
                <IconClipboardList size={20} /> Production Orders
              </h3>
              <div className="flex-gap-8">
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="select-filter-compact"
                >
                  <option value="All">All Statuses</option>
                  <option value="R">Work In Progress</option>
                  <option value="L">Completed</option>
                  <option value="C">Cancelled</option>
                  <option value="Delayed">Delayed</option>
                </select>
                <select
                  value={tableDateFilter}
                  onChange={(e) => setTableDateFilter(e.target.value)}
                  className="select-filter-compact"
                >
                  <option value="today">Today</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
            <div className="dashboard-card-content no-padding">
              <div className="compact-table-wrapper scrollable-table-350">
                <table className="compact-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Product</th>
                      <th>Status</th>
                      <th className="text-right">Planned Qty</th>
                      <th className="text-right">Actual Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrdersLoading ? (
                      <tr>
                        <td colSpan="5" className="table-empty-cell">
                          Loading orders...
                        </td>
                      </tr>
                    ) : filteredOrders && filteredOrders.length > 0 ? (
                      filteredOrders.map((order, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong>{order.DocNum}</strong>
                          </td>
                          <td>
                            {(order.ProductName || "").substring(0, 25)}
                          </td>
                          <td>
                            <span
                              className={`status-badge ${order.Status === "L"
                                  ? "success"
                                  : order.Status === "R"
                                    ? "warning"
                                    : order.Status === "C"
                                      ? "critical"
                                      : "default"
                                }`}
                            >
                              {order.Status === "L"
                                ? "Completed"
                                : order.Status === "R"
                                  ? "Work In Progress"
                                  : order.Status === "C"
                                    ? "Cancelled"
                                    : "Planned"}
                            </span>
                          </td>
                          <td className="text-right">{order.PlannedQty?.toLocaleString()}</td>
                          <td className="text-right">{order.ActualQty?.toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="table-empty-cell">
                          No orders found for the selected filters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-col-1-3">
          <div className="dashboard-card full-height">
            <div className="dashboard-card-header header-flex-between">
              <h3 className="no-margin">
                <IconTrendingUp size={20} /> Order Volume (Created)
              </h3>
              <select
                value={volumeDateFilter}
                onChange={(e) => setVolumeDateFilter(e.target.value)}
                className="select-filter-compact"
              >
                <option value="today">Today</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="dashboard-card-content donut-card-content">
              <PieChart
                data={[
                  { name: 'Work In Progress', value: orderVolume.ReleasedCount || 0, color: '#10b981' },
                  { name: 'Completed', value: orderVolume.ClosedCount || 0, color: '#3b82f6' },
                  { name: 'Cancelled', value: orderVolume.CancelledCount || 0, color: '#ef4444' },
                  { name: 'Planned', value: orderVolume.PlannedCount || 0, color: '#f59e0b' }
                ]}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={80}
                showLegend={true}
                showCenterLabel={true}
                totalLabel="Total"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
