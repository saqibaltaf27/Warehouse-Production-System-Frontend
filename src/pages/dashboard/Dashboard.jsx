import React, { useState, useEffect } from "react";
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
    IconCalendar,
    IconCalendarEvent,
    IconTarget,
    IconActivity,
    IconGauge
} from "@tabler/icons-react";
import LineChart from "../../global-components/Charts/LineChart";
import PieChart from "../../global-components/Charts/PieChart";
import BarChart from "../../global-components/Charts/BarChart";
import { axiosInstance } from "../../apis/axiosinstance";
import { API_ENDPOINTS } from "../../apis/endpoints";
import Card from "../../global-components/Card/Card";
import Table from "../../global-components/Table/Table";
import "./Dashboard.css";

const formatCurrency = (val) => {
    if (val === undefined || val === null) return "0.00";
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatNumberCompact = (num) => {
    if (num === undefined || num === null) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
    return num.toLocaleString();
};

// 1. Top Alerts Component
const AlertsSection = ({ filters }) => {
    const [data, setData] = useState({ delayedOrders: 0, materialShortages: 0, ordersOverCost: 0, highDowntime: 0, qualityIssues: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAlerts = async () => {
            setLoading(true);
            try {
                const res = await axiosInstance.get(API_ENDPOINTS.DASHBOARD.ALERTS, { params: filters });
                if (res.data?.success) setData(res.data.data);
            } catch (err) { console.error(err); }
            setLoading(false);
        };
        fetchAlerts();
    }, [filters]);

    const alertItems = [
        {
            title: 'Orders Delayed',
            description: 'Require immediate action',
            icon: IconClock,
            color: '#ef4444',
            value: data.delayedOrders,
            valueLabel: 'Count',
            valueColor: '#ef4444'
        },
        {
            title: 'Materials Shortage',
            description: 'Affecting production',
            icon: IconPackage,
            color: '#ef4444',
            value: data.materialShortages,
            valueLabel: 'Count',
            valueColor: '#ef4444'
        },
        {
            title: 'Orders Over Standard Cost',
            description: 'Variance > 5%',
            icon: IconCurrencyDollar,
            color: '#ef4444',
            value: data.ordersOverCost,
            valueLabel: 'Count',
            valueColor: '#ef4444'
        },
        {
            title: 'High Downtime',
            description: 'Today',
            icon: IconAlertTriangle,
            color: '#f59e0b',
            value: data.highDowntime,
            valueLabel: 'Count',
            valueColor: '#f59e0b'
        },
        {
            title: 'Quality Issues',
            description: 'Rejection > 2%',
            icon: IconCheck,
            color: '#f59e0b',
            value: data.qualityIssues,
            valueLabel: 'Count',
            valueColor: '#f59e0b'
        }
    ];

    return (
        <div className="w-100 mb-4">
            <div className="d-flex align-center justify-between mb-2 alert-section-header">
                <span className="text-danger font-semibold text-uppercase alert-title">Attention Required</span>
                <span className="text-primary alert-link">View All Alerts →</span>
            </div>
            <div className="w-100 alert-container">
                {loading ? <div>Loading alerts...</div> : (
                    <Card items={alertItems} />
                )}
            </div>
        </div>
    );
};

// 2. KPI Cards Row
const KPIRow = ({ filters }) => {
    const [data, setData] = useState({ plan: 0, actual: 0, achievement: 0, dailyEfficiency: 0, oee: 0, capacityUtil: 0 });
    useEffect(() => {
        const fetchOverview = async () => {
            try {
                const res = await axiosInstance.get(API_ENDPOINTS.DASHBOARD.OVERVIEW, { params: filters });
                if (res.data?.success) setData(res.data.data);
            } catch (err) { console.error(err); }
        };
        fetchOverview();
    }, [filters]);

    const kpiItems = [
        {
            title: "Today's Plan",
            description: "Units",
            icon: IconCalendar,
            color: "#3b82f6",
            value: formatNumberCompact(data.plan),
            valueLabel: "Value",
        },
        {
            title: "Today's Actual",
            description: "Units",
            icon: IconCalendarEvent,
            color: "#10b981",
            value: formatNumberCompact(data.actual),
            valueLabel: "Value",
        },
        {
            title: "Achievement",
            description: "vs Plan",
            icon: IconTarget,
            color: "#8b5cf6",
            value: `${data.achievement}%`,
            valueLabel: "Value",
        },
        {
            title: "Daily Efficiency",
            description: "vs Target 90%",
            icon: IconActivity,
            color: "#06b6d4",
            value: `${data.dailyEfficiency || '0.00'}%`,
            valueLabel: "Value",
        },
        {
            title: "OEE",
            description: "vs Target 85%",
            icon: IconSettings,
            color: "#f97316",
            value: `${data.oee || '0.00'}%`,
            valueLabel: "Value",
        },
        {
            title: "Capacity Util",
            description: "vs Available Capacity",
            icon: IconGauge,
            color: "#3b82f6",
            value: `${data.capacityUtil || '0.00'}%`,
            valueLabel: "Value",
        }
    ];

    return (
        <div className="mb-4">
            <Card items={kpiItems} />
        </div>
    );
};

// 3. Plan vs Actual Chart
const PlanVsActualChart = ({ filters }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrend = async () => {
            setLoading(true);
            try {
                const res = await axiosInstance.get(API_ENDPOINTS.DASHBOARD.PLAN_VS_ACTUAL, { params: filters });
                if (res.data?.success) {
                    const formattedData = res.data.data.map(item => ({
                        ...item,
                        date: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                    }));
                    setData(formattedData);
                }
            } catch (err) { console.error(err); }
            setLoading(false);
        };
        fetchTrend();
    }, [filters]);

    return (
        <div className="dashboard-card chart-card-container dome-card-wrapper plan-actual-card">
            <div className="dashboard-card-header d-flex justify-between">
                <h3>Production Plan vs Actual</h3>
                <select className="select-filter-compact text-sm"><option>Daily</option></select>
            </div>
            <div className="dashboard-card-content plan-actual-content">
                {loading ? (
                    <div className="dashboard-state">
                        <IconRefresh className="spin" size={32} color="var(--primary)" />
                        <p>Loading chart...</p>
                    </div>
                ) : data.length > 0 ? (
                    <div className="chart-content plan-actual-chart">
                        <BarChart
                            data={data}
                            xAxisKey="date"
                            series={[
                                { key: "plannedQty", name: "Planned Qty", color: "#3b82f6" },
                                { key: "actualQty", name: "Actual Qty", color: "#10b981" }
                            ]}
                            showLegend={true}
                        />
                    </div>
                ) : (
                    <div className="table-empty-cell">No data for the selected period</div>
                )}
            </div>
        </div>
    );
};

// 4. Cost Summary
const CostSummary = ({ filters }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCost = async () => {
            setLoading(true);
            try {
                const res = await axiosInstance.get(API_ENDPOINTS.DASHBOARD.COST_SUMMARY, { params: filters });
                if (res.data?.success) setData(res.data.data);
            } catch (err) { console.error(err); }
            setLoading(false);
        };
        fetchCost();
    }, [filters]);

    const firstPassYield = Number(data?.firstPassYield || 0);
    const hasReworkPercent = data?.reworkPercent !== null && data?.reworkPercent !== undefined;
    const hasReworkedQty = data?.reworkedQty !== null && data?.reworkedQty !== undefined;

    return (
        <div className="dashboard-card chart-card-container dome-card-wrapper cost-summary-card">
            <div className="dashboard-card-header">
                <h3>Cost Summary (Today)</h3>
            </div>
            <div className="dashboard-card-content quality-summary-content">
                <div className="quality-summary-main">
                    <div className="quality-yield-panel">
                        <div className="quality-yield-heading">
                            <span>First Pass Yield</span>
                            <IconCheck size={18} stroke={2.2} />
                        </div>
                        <strong className="quality-yield-value">{firstPassYield.toFixed(2)}%</strong>
                        <progress className="quality-progress-native" value={Math.min(Math.max(firstPassYield, 0), 100)} max="100" aria-label={`First pass yield ${firstPassYield.toFixed(2)} percent`} />
                        <small>Good units produced without rework</small>
                    </div>
                    <div className="quality-rate-grid">
                        <div className="quality-rate-tile is-danger">
                            <span>Rejection</span>
                            <strong>{Number(data?.rejectionPercent || 0).toFixed(2)}%</strong>
                        </div>
                        <div className="quality-rate-tile is-warning">
                            <span>Rework</span>
                            <strong>{hasReworkPercent ? `${Number(data.reworkPercent).toFixed(2)}%` : '—'}</strong>
                        </div>
                    </div>
                </div>
                <div className="quality-quantity-strip">
                    <div><span>Rejected Qty</span><strong className="text-danger">{formatNumberCompact(data?.rejectedQty)}</strong></div>
                    <div><span>Reworked Qty</span><strong>{hasReworkedQty ? formatNumberCompact(data.reworkedQty) : '—'}</strong></div>
                    <div><span>Total Produced</span><strong>{formatNumberCompact(data?.totalProduced)}</strong></div>
                </div>
                <div className="cost-summary-redesign">
                    {loading || !data ? (
                        <div className="dashboard-state"><IconRefresh className="spin" size={32} color="var(--primary)" /></div>
                    ) : (
                        <>
                            <div className="cost-summary-hero">
                                <div className="cost-total-primary">
                                    <span>Actual Total Cost</span>
                                    <strong>{formatNumberCompact(data.total.actual)}</strong>
                                    <small>Standard: {formatNumberCompact(data.total.standard)}</small>
                                </div>
                                <div className={`cost-variance-highlight ${data.total.variance > 0 ? 'is-over' : 'is-under'}`}>
                                    <span>Total Variance</span>
                                    <strong>{formatNumberCompact(data.total.variance)}</strong>
                                    <small>{data.total.variancePercent}%</small>
                                </div>
                            </div>
                            <div className="cost-breakdown-panel">
                                <div className="cost-breakdown-header">
                                    <span>Cost Component</span><span>Standard</span><span>Actual</span><span>Variance</span><span>Variance %</span>
                                </div>
                                {[
                                    { label: 'Material Cost', values: data.material, complete: true },
                                    { label: 'Labor Cost', values: data.labor, complete: false },
                                    { label: 'Overhead Cost', values: data.overhead, complete: false }
                                ].map((item) => (
                                    <div className="cost-breakdown-row" key={item.label}>
                                        <strong>{item.label}</strong>
                                        <span>{item.complete ? formatNumberCompact(item.values.standard) : formatCurrency(item.values.standard)}</span>
                                        <span>{item.complete ? formatNumberCompact(item.values.actual) : formatCurrency(item.values.actual)}</span>
                                        <span className={item.complete ? (item.values.variance > 0 ? 'text-danger' : 'text-success') : 'text-muted'}>{item.complete ? formatNumberCompact(item.values.variance) : '—'}</span>
                                        <span className={item.complete ? (item.values.variancePercent > 0 ? 'text-danger' : 'text-success') : 'text-muted'}>{item.complete ? `${item.values.variancePercent}%` : '—'}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="cost-per-unit-grid">
                                <div><span>Standard / Unit</span><strong>{formatCurrency(data.perUnit.standard)}</strong></div>
                                <div><span>Actual / Unit</span><strong>{formatCurrency(data.perUnit.actual)}</strong></div>
                                <div className={data.perUnit.variance > 0 ? 'is-over' : 'is-under'}><span>Variance / Unit</span><strong>{formatCurrency(data.perUnit.variance)}</strong></div>
                            </div>
                        </>
                    )}
                </div>
                <div className="quality-summary-legacy">
                    {loading || !data ? (
                        <div className="dashboard-state"><IconRefresh className="spin" size={32} color="var(--primary)" /></div>
                    ) : (
                        <>
                            <div className="compact-table-wrapper flex-1">
                                <table className="compact-table">
                                    <thead>
                                        <tr>
                                            <th>Particulars</th>
                                            <th className="text-right">Standard</th>
                                            <th className="text-right">Actual</th>
                                            <th className="text-right">Variance</th>
                                            <th className="text-right">Variance %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Material Cost</td>
                                            <td className="text-right" title={data.material.standard}>{formatNumberCompact(data.material.standard)}</td>
                                            <td className="text-right" title={data.material.actual}>{formatNumberCompact(data.material.actual)}</td>
                                            <td className={`text-right ${data.material.variance > 0 ? 'text-danger' : 'text-success'}`}>{formatNumberCompact(data.material.variance)}</td>
                                            <td className={`text-right ${data.material.variancePercent > 0 ? 'text-danger' : 'text-success'}`}>{data.material.variancePercent}%</td>
                                        </tr>
                                        <tr>
                                            <td>Labor Cost</td>
                                            <td className="text-right">{formatCurrency(data.labor.standard)}</td>
                                            <td className="text-right">{formatCurrency(data.labor.actual)}</td>
                                            <td className="text-right text-muted">—</td>
                                            <td className="text-right text-muted">—</td>
                                        </tr>
                                        <tr>
                                            <td>Overhead Cost</td>
                                            <td className="text-right">{formatCurrency(data.overhead.standard)}</td>
                                            <td className="text-right">{formatCurrency(data.overhead.actual)}</td>
                                            <td className="text-right text-muted">—</td>
                                            <td className="text-right text-muted">—</td>
                                        </tr>
                                        <tr className="cost-total-row">
                                            <td>Total Cost</td>
                                            <td className="text-right" title={data.total.standard}>{formatNumberCompact(data.total.standard)}</td>
                                            <td className="text-right" title={data.total.actual}>{formatNumberCompact(data.total.actual)}</td>
                                            <td className={`text-right ${data.total.variance > 0 ? 'text-danger' : 'text-success'}`}>{formatNumberCompact(data.total.variance)}</td>
                                            <td className={`text-right ${data.total.variancePercent > 0 ? 'text-danger' : 'text-success'}`}>{data.total.variancePercent}%</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="d-flex gap-3 mt-4">
                                <div className="flex-1 text-center legacy-cost-unit-card">
                                    <p className="m-0 text-muted font-semibold mb-2 legacy-cost-unit-label">Cost per Unit (Standard)</p>
                                    <h4 className="m-0">{formatCurrency(data.perUnit.standard)}</h4>
                                </div>
                                <div className="flex-1 text-center legacy-cost-unit-card">
                                    <p className="m-0 text-muted font-semibold mb-2 legacy-cost-unit-label">Cost per Unit (Actual)</p>
                                    <h4 className="m-0">{formatCurrency(data.perUnit.actual)}</h4>
                                </div>
                                <div className={`flex-1 text-center legacy-cost-unit-card ${data.perUnit.variance > 0 ? 'bg-danger-light' : 'bg-success-light'}`}>
                                    <p className={`m-0 font-semibold mb-2 legacy-cost-unit-label ${data.perUnit.variance > 0 ? 'text-danger' : 'text-success'}`}>Variance per Unit</p>
                                    <h4 className={`m-0 ${data.perUnit.variance > 0 ? 'text-danger' : 'text-success'}`}>{formatCurrency(data.perUnit.variance)}</h4>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// 5. Top Orders by Cost Variance
const TopOrdersCostVariance = ({ filters }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVar = async () => {
            setLoading(true);
            try {
                const res = await axiosInstance.get(API_ENDPOINTS.DASHBOARD.COST_VARIANCE, { params: filters });
                if (res.data?.success) setData(res.data.data);
            } catch (err) { console.error(err); }
            setLoading(false);
        };
        fetchVar();
    }, [filters]);

    const varianceColumns = [
        { key: 'OrderNum', header: 'Order #', width: '14%', render: (row) => <strong>{row.OrderNum}</strong> },
        { key: 'Product', header: 'Product', width: '20%' },
        { key: 'ActualCost', header: 'Actual Cost / Unit', width: '18%', align: 'right', render: (row) => formatNumberCompact(row.ActualCost) },
        { key: 'StdCost', header: 'Std Cost / Unit', width: '18%', align: 'right', render: (row) => formatNumberCompact(row.StdCost) },
        {
            key: 'VariancePercent',
            header: 'Variance %',
            width: '16%',
            align: 'right',
            render: (row) => <strong className={row.VariancePercent > 0 ? 'text-danger' : 'text-success'}>{row.VariancePercent}%</strong>
        },
        {
            key: 'status',
            header: 'Status',
            width: '14%',
            align: 'center',
            render: (row) => row.VariancePercent > 5
                ? <span className="status-badge critical">Over Std</span>
                : row.VariancePercent < -5
                    ? <span className="status-badge success">Under Std</span>
                    : <span className="status-badge good">On Std</span>
        }
    ];

    const completionRate = data.totalOrders > 0 ? (data.completed / data.totalOrders) * 100 : 0;
    const orderStatuses = [
        { label: 'In Progress', value: data.inProgress, tone: 'blue' },
        { label: 'On Hold', value: data.onHold, tone: 'amber' },
        { label: 'Completed', value: data.completed, tone: 'green' },
        { label: 'Delayed', value: data.delayed, tone: 'red' },
        { label: 'At Risk', value: data.atRisk, tone: 'orange' }
    ];

    return (
        <div className="dashboard-card chart-card-container dome-card-wrapper cost-variance-card">
            <div className="dashboard-card-header">
                <h3>Top Orders by Cost Variance</h3>
            </div>
            <div className="dashboard-card-content orders-summary-content">
                <div className="orders-overview">
                    <div>
                        <span className="orders-overview-label">Total Orders</span>
                        <strong>{formatNumberCompact(data.totalOrders)}</strong>
                    </div>
                    <span className="orders-completion-badge">{completionRate.toFixed(0)}% completed</span>
                </div>
                <progress className="orders-progress-native" value={Math.min(Math.max(completionRate, 0), 100)} max="100" aria-label={`${completionRate.toFixed(0)} percent of orders completed`} />
                <div className="orders-status-grid">
                    {orderStatuses.map((status) => (
                        <div key={status.label} className={`orders-status-tile is-${status.tone}`}>
                            <span className="orders-status-dot" />
                            <span className="orders-status-label">{status.label}</span>
                            <strong>{formatNumberCompact(status.value)}</strong>
                        </div>
                    ))}
                </div>
                <div className="orders-summary-legacy">
                    {loading ? (
                        <div className="dashboard-state"><IconRefresh className="spin" size={32} color="var(--primary)" /></div>
                    ) : data.length > 0 ? (
                        <Table
                            data={data}
                            columns={varianceColumns}
                            totalEntries={data.length}
                            showActions={false}
                            showPagination={false}
                        />
                    ) : (
                        <div className="table-empty-cell">No data for the selected period</div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Reusable component for See More / See Less text
const ExpandableText = ({ text, maxLength = 15 }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    if (!text) return null;
    if (text.length <= maxLength) return <span>{text}</span>;

    return (
        <span>
            {isExpanded ? text : `${text.substring(0, maxLength)}...`}
            <span
                onClick={() => setIsExpanded(!isExpanded)}
                className="expandable-text-toggle text-primary font-semibold ms-1"
            >
                {isExpanded ? ' See Less' : ' See More'}
            </span>
        </span>
    );
};

// 6. Critical Material Shortages
const CriticalMaterialShortages = ({ filters }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchShortages = async () => {
            setLoading(true);
            try {
                const res = await axiosInstance.get(API_ENDPOINTS.DASHBOARD.MATERIAL_SHORTAGES, { params: filters });
                if (res.data?.success) setData(res.data.data);
            } catch (err) { console.error(err); }
            setLoading(false);
        };
        fetchShortages();
    }, [filters]);

    const shortageColumns = [
        { key: 'ItemCode', header: 'Material Code' },
        { key: 'ItemName', header: 'Material Description', width: '220px', render: (row) => <ExpandableText text={row.ItemName} maxLength={28} /> },
        { key: 'RequiredQty', header: 'Required Qty', align: 'right', render: (row) => row.RequiredQty?.toLocaleString() },
        { key: 'AvailableQty', header: 'Available Qty', align: 'right', render: (row) => row.AvailableQty?.toLocaleString() },
        { key: 'Shortage', header: 'Shortage', align: 'right', render: (row) => <strong className="text-danger">{row.Shortage?.toLocaleString()}</strong> }
    ];

    return (
        <div className="dashboard-card chart-card-container dome-card-wrapper shortage-summary-card">
            <div className="dashboard-card-header d-flex justify-between">
                <h3>Critical Material Shortages</h3>
                <div className="summary-header-actions">
                    {!loading && <span className="summary-count-badge is-danger">{data.length} items</span>}
                </div>
            </div>
            <div className="dashboard-card-content shortage-summary-content">
                {loading ? (
                    <div className="dashboard-state"><IconRefresh className="spin" size={32} color="var(--primary)" /></div>
                ) : data.length > 0 ? (
                    <>
                        <Table
                            data={data}
                            columns={shortageColumns}
                            totalEntries={data.length}
                            showActions={false}
                            showPagination={false}
                        />
                        <div className="compact-table-wrapper shortage-legacy-table">
                            <table className="compact-table">
                                <thead>
                                    <tr>
                                        <th>Material Code</th>
                                        <th>Material Description</th>
                                        <th className="text-right">Required Qty</th>
                                        <th className="text-right">Available Qty</th>
                                        <th className="text-right">Shortage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((item, idx) => (
                                        <tr key={idx}>
                                            <td><strong>{item.ItemCode}</strong></td>
                                            <td>
                                                <ExpandableText text={item.ItemName} maxLength={15} />
                                            </td>
                                            <td className="text-right">{item.RequiredQty?.toLocaleString()}</td>
                                            <td className="text-right">{item.AvailableQty?.toLocaleString()}</td>
                                            <td className="text-right text-danger"><strong>{item.Shortage?.toLocaleString()}</strong></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="table-empty-cell">No data for the selected period</div>
                )}
            </div>
        </div>
    );
};

// 7. Daily Efficiency Trend
const DailyEfficiencyTrend = ({ filters }) => {
    const [chartData, setChartData] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalEntries, setTotalEntries] = useState(0);

    const fetchEfficiency = async (page = 1, size = 10) => {
        setLoading(true);
        try {
            const params = { ...filters, page, pageSize: size };
            const res = await axiosInstance.get(API_ENDPOINTS.DASHBOARD.EFFICIENCY, { params });
            if (res.data?.success) {
                setChartData(res.data.data.chartData);
                setTableData(res.data.data.tableData);
                if (res.data.data.pagination) {
                    setTotalEntries(res.data.data.pagination.totalRecords);
                }
            }
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    useEffect(() => {
        setCurrentPage(1); // Reset page on filter change
        fetchEfficiency(1, pageSize);
    }, [filters]);

    useEffect(() => {
        if (currentPage !== 1 || !loading) {
            fetchEfficiency(currentPage, pageSize);
        }
    }, [currentPage, pageSize]);

    const columns = [
        { header: 'Date', key: 'date', width: '24%' },
        { header: 'Planned Qty', key: 'plannedQty', width: '25%', align: 'right', render: row => formatNumberCompact(row.plannedQty) },
        { header: 'Completed Qty', key: 'completedQty', width: '27%', align: 'right', render: row => formatNumberCompact(row.completedQty) },
        { header: 'Efficiency %', key: 'efficiency', width: '24%', align: 'right', render: row => `${row.efficiency?.toFixed(2) || '0.00'}%` }
    ];

    return (
        <div className="dashboard-card chart-card-container dome-card-wrapper efficiency-summary-card">
            <div className="dashboard-card-header d-flex justify-between">
                <h3>Daily Efficiency Trend (%)</h3>
                <select className="select-filter-compact text-sm"><option>Daily</option></select>
            </div>
            <div className="dashboard-card-content efficiency-summary-content">
                <div className="chart-content w-100 chart-fixed-height efficiency-chart-panel">
                    {loading && chartData.length === 0 ? (
                        <div className="dashboard-state w-100"><IconRefresh className="spin" size={32} color="var(--primary)" /></div>
                    ) : chartData.length > 0 ? (
                        <LineChart data={chartData} xAxisKey="date" series={[{ key: "efficiency", name: "Efficiency %", color: "#10b981" }]} showLegend={false} />
                    ) : (
                        <div className="d-flex align-center justify-center w-100 h-100 text-muted">No data available</div>
                    )}
                </div>

                <div className="w-100 efficiency-table-panel">
                    {tableData.length > 0 && (
                        <Table
                            data={tableData}
                            columns={columns}
                            showPagination={true}
                            currentPage={currentPage}
                            pageSize={pageSize}
                            totalEntries={totalEntries}
                            onPageChange={setCurrentPage}
                            onItemsPerPageChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                            showActions={false}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

// 8. Downtime Summary
const DowntimeSummary = ({ filters }) => {
    const [downtimeReasons, setDowntimeReasons] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDowntime = async () => {
            setLoading(true);
            try {
                const res = await axiosInstance.get(API_ENDPOINTS.DASHBOARD.DOWNTIME, { params: filters });
                if (res.data?.success) setDowntimeReasons(res.data.data.reasons || []);
            } catch (err) { console.error(err); }
            setLoading(false);
        };
        fetchDowntime();
    }, [filters]);

    const totalDowntime = downtimeReasons.reduce((sum, reason) => sum + (Number(reason.value) || 0), 0);

    return (
        <div className="dashboard-card chart-card-container dome-card-wrapper downtime-summary-card">
            <div className="dashboard-card-header d-flex justify-between">
                <h3>Downtime Summary (Today)</h3>
                <div className="summary-header-actions">
                    {!loading && <span className="summary-count-badge is-warning">{formatNumberCompact(totalDowntime)} hrs</span>}
                </div>
            </div>
            <div className="dashboard-card-content downtime-summary-content">
                {loading ? (
                    <div className="dashboard-state w-100"><IconRefresh className="spin" size={32} color="var(--primary)" /></div>
                ) : downtimeReasons.length > 0 ? (
                    <>
                        <div className="donut-fixed-height w-100 downtime-chart-panel">
                            <PieChart data={downtimeReasons} dataKey="value" nameKey="name" showLegend={false} innerRadius={50} outerRadius={70} />
                        </div>
                        <div className="downtime-list-panel">
                            <table className="downtime-legend-table w-100">
                                <tbody>
                                    {downtimeReasons.map((r, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <svg className="legend-dot-svg" viewBox="0 0 8 8" aria-hidden="true">
                                                    <circle cx="4" cy="4" r="4" fill={r.color} />
                                                </svg>
                                                {r.name}
                                            </td>
                                            <td className="text-right">{r.value} hrs</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="text-muted">No downtime data recorded</div>
                )}
            </div>
        </div>
    );
};

// 9. OEE Breakdown
const OEEBreakdown = ({ filters }) => {
    const [data, setData] = useState({ availability: 0, performance: 0, quality: 0, oee: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOEE = async () => {
            setLoading(true);
            try {
                const res = await axiosInstance.get(API_ENDPOINTS.DASHBOARD.OEE, { params: filters });
                if (res.data?.success) setData(res.data.data);
            } catch (err) { console.error(err); }
            setLoading(false);
        };
        fetchOEE();
    }, [filters]);

    const metrics = [
        { name: 'Availability', value: data.availability, color: '#10b981' },
        { name: 'Performance', value: data.performance, color: '#3b82f6' },
        { name: 'Quality', value: data.quality, color: '#8b5cf6' }
    ];

    return (
        <div className="dashboard-card chart-card-container dome-card-wrapper">
            <div className="dashboard-card-header">
                <h3>OEE Breakdown (Today)</h3>
            </div>
            <div className="dashboard-card-content p-4 d-flex flex-column justify-center align-center">
                {loading ? (
                    <div className="dashboard-state w-100"><IconRefresh className="spin" size={32} color="var(--primary)" /></div>
                ) : (
                    <div className="oee-pie-chart w-100">
                        <PieChart
                            data={metrics}
                            dataKey="value"
                            nameKey="name"
                            showLegend={true}
                            innerRadius={58}
                            outerRadius={84}
                            totalLabel="OEE"
                            totalValue={`${Number(data.oee || 0).toFixed(2)}%`}
                            formatValue={(value) => `${Number(value || 0).toFixed(2)}%`}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

// 10. Quality Summary
const QualitySummary = ({ filters }) => {
    const [data, setData] = useState({ rejectionPercent: 0, reworkPercent: 0, firstPassYield: 0, rejectedQty: 0, reworkedQty: 0, totalProduced: 0 });
    useEffect(() => {
        const fetchQuality = async () => {
            try {
                const res = await axiosInstance.get(API_ENDPOINTS.DASHBOARD.QUALITY, { params: filters });
                if (res.data?.success) setData(res.data.data);
            } catch (err) { console.error(err); }
        };
        fetchQuality();
    }, [filters]);

    const firstPassYield = Number(data.firstPassYield || 0);
    const hasReworkPercent = data.reworkPercent !== null && data.reworkPercent !== undefined;
    const hasReworkedQty = data.reworkedQty !== null && data.reworkedQty !== undefined;

    return (
        <div className="dashboard-card chart-card-container dome-card-wrapper summary-card quality-summary-card">
            <div className="dashboard-card-header d-flex justify-between">
                <h3>Quality Summary (Today)</h3>
            </div>
            <div className="dashboard-card-content quality-summary-content">
                <div className="quality-summary-main">
                    <div className="quality-yield-panel">
                        <div className="quality-yield-heading"><span>First Pass Yield</span><IconCheck size={18} stroke={2.2} /></div>
                        <strong className="quality-yield-value">{firstPassYield.toFixed(2)}%</strong>
                        <progress className="quality-progress-native" value={Math.min(Math.max(firstPassYield, 0), 100)} max="100" aria-label={`First pass yield ${firstPassYield.toFixed(2)} percent`} />
                        <small>Good units produced without rework</small>
                    </div>
                    <div className="quality-rate-grid">
                        <div className="quality-rate-tile is-danger"><span>Rejection</span><strong>{Number(data.rejectionPercent || 0).toFixed(2)}%</strong></div>
                        <div className="quality-rate-tile is-warning"><span>Rework</span><strong>{hasReworkPercent ? `${Number(data.reworkPercent).toFixed(2)}%` : '—'}</strong></div>
                    </div>
                </div>
                <div className="quality-quantity-strip">
                    <div><span>Rejected Qty</span><strong className="text-danger">{formatNumberCompact(data.rejectedQty)}</strong></div>
                    <div><span>Reworked Qty</span><strong>{hasReworkedQty ? formatNumberCompact(data.reworkedQty) : '—'}</strong></div>
                    <div><span>Total Produced</span><strong>{formatNumberCompact(data.totalProduced)}</strong></div>
                </div>
                <div className="quality-summary-legacy">
                    <div className="d-flex justify-between text-center gap-4 mb-4 legacy-quality-rates">
                        <div className="flex-1 bg-light p-3 legacy-quality-tile">
                            <p className="m-0 text-muted legacy-quality-label">Rejection %</p>
                            <h3 className="text-danger m-0 mt-1">{data.rejectionPercent}%</h3>
                        </div>
                        <div className="flex-1 bg-light p-3 legacy-quality-tile is-muted">
                            <p className="m-0 text-muted legacy-quality-label">Rework %</p>
                            <h3 className="text-warning m-0 mt-1">—</h3>
                        </div>
                        <div className="flex-1 bg-light p-3 legacy-quality-tile">
                            <p className="m-0 text-muted legacy-quality-label">First Pass Yield %</p>
                            <h3 className="text-success m-0 mt-1">{data.firstPassYield}%</h3>
                        </div>
                    </div>
                    <div className="d-flex justify-between text-center gap-4">
                        <div className="flex-1">
                            <p className="m-0 text-muted legacy-quality-label">Rejected Qty</p>
                            <h4 className="m-0 text-danger">{formatNumberCompact(data.rejectedQty)}</h4>
                        </div>
                        <div className="flex-1 is-muted">
                            <p className="m-0 text-muted legacy-quality-label">Reworked Qty</p>
                            <h4 className="m-0 text-warning">—</h4>
                        </div>
                        <div className="flex-1">
                            <p className="m-0 text-muted legacy-quality-label">Total Produced</p>
                            <h4 className="m-0">{formatNumberCompact(data.totalProduced)}</h4>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 11. Production Orders Summary
const OrdersSummary = ({ filters }) => {
    const [data, setData] = useState({ totalOrders: 0, inProgress: 0, onHold: 0, completed: 0, delayed: 0, atRisk: 0 });
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await axiosInstance.get(API_ENDPOINTS.DASHBOARD.ORDER_SUMMARY, { params: filters });
                if (res.data?.success) setData(res.data.data);
            } catch (err) { console.error(err); }
        };
        fetchOrders();
    }, [filters]);

    const completionRate = data.totalOrders > 0 ? (data.completed / data.totalOrders) * 100 : 0;
    const orderStatuses = [
        { label: 'In Progress', value: data.inProgress, tone: 'blue' },
        { label: 'On Hold', value: data.onHold, tone: 'amber' },
        { label: 'Completed', value: data.completed, tone: 'green' },
        { label: 'Delayed', value: data.delayed, tone: 'red' },
        { label: 'At Risk', value: data.atRisk, tone: 'orange' }
    ];

    return (
        <div className="dashboard-card chart-card-container dome-card-wrapper summary-card orders-summary-card">
            <div className="dashboard-card-header">
                <h3>Production Orders Summary</h3>
            </div>
            <div className="dashboard-card-content orders-summary-content">
                <div className="orders-overview">
                    <div><span className="orders-overview-label">Total Orders</span><strong>{formatNumberCompact(data.totalOrders)}</strong></div>
                    <span className="orders-completion-badge">{completionRate.toFixed(0)}% completed</span>
                </div>
                <progress className="orders-progress-native" value={Math.min(Math.max(completionRate, 0), 100)} max="100" aria-label={`${completionRate.toFixed(0)} percent of orders completed`} />
                <div className="orders-status-grid">
                    {orderStatuses.map((status) => (
                        <div key={status.label} className={`orders-status-tile is-${status.tone}`}>
                            <span className="orders-status-dot" />
                            <span className="orders-status-label">{status.label}</span>
                            <strong>{formatNumberCompact(status.value)}</strong>
                        </div>
                    ))}
                </div>
                <div className="orders-summary-legacy">
                    <div className="order-summary-grid">
                        <div className="text-center order-card order-total">
                            <p className="m-0 text-muted font-semibold mb-2 order-label">Total Orders</p>
                            <h3 className="m-0 order-value">{data.totalOrders}</h3>
                        </div>
                        <div className="text-center order-card order-progress">
                            <p className="m-0 text-primary font-semibold mb-2 order-label">In Progress</p>
                            <h3 className="m-0 text-primary order-value">{data.inProgress}</h3>
                        </div>
                        <div className="text-center order-card order-hold">
                            <p className="m-0 text-warning font-semibold mb-2 order-label">On Hold</p>
                            <h3 className="m-0 text-warning order-value">{data.onHold}</h3>
                        </div>
                        <div className="text-center order-card order-completed">
                            <p className="m-0 text-success font-semibold mb-2 order-label">Completed</p>
                            <h3 className="m-0 text-success order-value">{data.completed}</h3>
                        </div>
                        <div className="text-center order-card order-delayed">
                            <p className="m-0 text-danger font-semibold mb-2 order-label">Delayed</p>
                            <h3 className="m-0 text-danger order-value">{data.delayed}</h3>
                        </div>
                        <div className="text-center order-card order-risk">
                            <p className="m-0 font-semibold mb-2 order-label text-risk">At Risk</p>
                            <h3 className="m-0 order-value text-risk">{data.atRisk}</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default function Dashboard() {
    const defaultDate = new Date().toISOString().split('T')[0];
    const [filters, setFilters] = useState({ startDate: defaultDate, endDate: defaultDate, warehouse: "All" });
    const [warehouses, setWarehouses] = useState([]);

    useEffect(() => {
        const fetchWarehouses = async () => {
            try {
                const res = await axiosInstance.get(API_ENDPOINTS.DASHBOARD.WAREHOUSES);
                if (res.data?.success) setWarehouses(res.data.data || []);
            } catch (err) { console.error(err); }
        };
        fetchWarehouses();
    }, []);

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="executive-dashboard bg-light">
            {/* Filters */}
            <div className="dashboard-filters-bar mb-4">
                <div className="d-flex flex-column">
                    <label>Start Date</label>
                    <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
                </div>
                <div className="d-flex flex-column">
                    <label>End Date</label>
                    <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
                </div>
                <div className="d-flex flex-column">
                    <label>Warehouse</label>
                    <select name="warehouse" value={filters.warehouse} onChange={handleFilterChange}>
                        <option value="All">All Warehouses</option>
                        {warehouses.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Section 1: Alerts */}
            <AlertsSection filters={filters} />

            <div className="mb-4"></div>

            {/* Section 2: KPIs */}
            <KPIRow filters={filters} />

            {/* ROW 1: Plan vs Actual | Cost Summary | Top Orders Cost Variance */}
            <div className="dashboard-row-multi row-dense">
                <div className="dashboard-col-flex-1">
                    <PlanVsActualChart filters={filters} />
                </div>
                <div className="dashboard-col-flex-1">
                    <CostSummary filters={filters} />
                </div>
                <div className="dashboard-col-flex-1">
                    <TopOrdersCostVariance filters={filters} />
                </div>
            </div>

            {/* ROW 2: Material Shortages | Efficiency Trend | Downtime Summary */}
            <div className="dashboard-row-multi row-dense">
                <div className="dashboard-col-flex-1">
                    <CriticalMaterialShortages filters={filters} />
                </div>
                <div className="dashboard-col-flex-1">
                    <DailyEfficiencyTrend filters={filters} />
                </div>
                <div className="dashboard-col-flex-1">
                    <DowntimeSummary filters={filters} />
                </div>
            </div>

            {/* ROW 3: OEE Breakdown | Quality Summary | Orders Summary */}
            <div className="dashboard-row-multi row-dense">
                <div className="dashboard-col-flex-1">
                    <OEEBreakdown filters={filters} />
                </div>
                <div className="dashboard-col-flex-1">
                    <QualitySummary filters={filters} />
                </div>
                <div className="dashboard-col-flex-1">
                    <OrdersSummary filters={filters} />
                </div>
            </div>

        </div>
    );
}
