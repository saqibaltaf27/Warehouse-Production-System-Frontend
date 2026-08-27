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
    const [data, setData] = useState({ plan: 0, actual: 0, achievement: 0 });
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
            value: "0.00%",
            valueLabel: "Value",
        },
        {
            title: "OEE",
            description: "vs Target 85%",
            icon: IconSettings,
            color: "#f97316",
            value: "0.00%",
            valueLabel: "Value",
        },
        {
            title: "Capacity Util",
            description: "vs Available Capacity",
            icon: IconGauge,
            color: "#3b82f6",
            value: "0.00%",
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
        <div className="dashboard-card chart-card-container dome-card-wrapper card-no-border">
            <div className="dashboard-card-header d-flex justify-between">
                <h3>Production Plan vs Actual</h3>
                <select className="select-filter-compact text-sm"><option>Daily</option></select>
            </div>
            <div className="dashboard-card-content p-4">
                {loading ? (
                    <div className="dashboard-state">
                        <IconRefresh className="spin" size={32} color="var(--primary)" />
                        <p>Loading chart...</p>
                    </div>
                ) : data.length > 0 ? (
                    <div className="chart-content">
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

    return (
        <div className="dashboard-card chart-card-container dome-card-wrapper">
            <div className="dashboard-card-header">
                <h3>Cost Summary (Today)</h3>
                <span className="text-primary text-sm" style={{ cursor: 'pointer' }}>View Details</span>
            </div>
            <div className="dashboard-card-content p-4">
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
                                <tr style={{fontWeight: 'bold', borderTop: '2px solid #e2e8f0'}}>
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
                            <div className="flex-1 text-center" style={{padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                                <p className="m-0 text-muted font-semibold mb-2" style={{fontSize: '0.8rem'}}>Cost per Unit (Standard)</p>
                                <h4 className="m-0">{formatCurrency(data.perUnit.standard)}</h4>
                            </div>
                            <div className="flex-1 text-center" style={{padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                                <p className="m-0 text-muted font-semibold mb-2" style={{fontSize: '0.8rem'}}>Cost per Unit (Actual)</p>
                                <h4 className="m-0">{formatCurrency(data.perUnit.actual)}</h4>
                            </div>
                            <div className={`flex-1 text-center ${data.perUnit.variance > 0 ? 'bg-danger-light' : 'bg-success-light'}`} style={{padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                                <p className={`m-0 font-semibold mb-2 ${data.perUnit.variance > 0 ? 'text-danger' : 'text-success'}`} style={{fontSize: '0.8rem'}}>Variance per Unit</p>
                                <h4 className={`m-0 ${data.perUnit.variance > 0 ? 'text-danger' : 'text-success'}`}>{formatCurrency(data.perUnit.variance)}</h4>
                            </div>
                        </div>
                    </>
                )}
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

    return (
        <div className="dashboard-card chart-card-container dome-card-wrapper">
            <div className="dashboard-card-header">
                <h3>Top Orders by Cost Variance</h3>
                <span className="text-primary text-sm" style={{ cursor: 'pointer' }}>View All</span>
            </div>
            <div className="dashboard-card-content p-4">
                {loading ? (
                    <div className="dashboard-state"><IconRefresh className="spin" size={32} color="var(--primary)" /></div>
                ) : data.length > 0 ? (
                    <div className="compact-table-wrapper">
                        <table className="compact-table">
                            <thead>
                                <tr>
                                    <th>Order #</th>
                                    <th>Product</th>
                                    <th className="text-right">Actual Cost / Unit</th>
                                    <th className="text-right">Std Cost / Unit</th>
                                    <th className="text-right">Variance %</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item, idx) => (
                                    <tr key={idx}>
                                        <td><strong>{item.OrderNum}</strong></td>
                                        <td title={item.Product} style={{maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{item.Product}</td>
                                        <td className="text-right" title={item.ActualCost}>{formatNumberCompact(item.ActualCost)}</td>
                                        <td className="text-right" title={item.StdCost}>{formatNumberCompact(item.StdCost)}</td>
                                        <td className={`text-right ${item.VariancePercent > 0 ? 'text-danger' : 'text-success'}`}><strong>{item.VariancePercent}%</strong></td>
                                        <td>
                                            {item.VariancePercent > 5 ? <span className="status-badge critical">Over Std</span> :
                                             item.VariancePercent < -5 ? <span className="status-badge success">Under Std</span> :
                                             <span className="status-badge good">On Std</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                     <div className="table-empty-cell">No data for the selected period</div>
                )}
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
                className="text-primary font-semibold ms-1" 
                style={{cursor: 'pointer', fontSize: '0.75rem', whiteSpace: 'nowrap'}}
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

    return (
        <div className="dashboard-card chart-card-container dome-card-wrapper">
            <div className="dashboard-card-header d-flex justify-between">
                <h3>Critical Material Shortages</h3>
                <span className="text-primary text-sm" style={{ cursor: 'pointer' }}>View All</span>
            </div>
            <div className="dashboard-card-content p-4">
                {loading ? (
                    <div className="dashboard-state"><IconRefresh className="spin" size={32} color="var(--primary)" /></div>
                ) : data.length > 0 ? (
                    <div className="compact-table-wrapper">
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
                ) : (
                     <div className="table-empty-cell">No data for the selected period</div>
                )}
            </div>
        </div>
    );
};

// 7. Daily Efficiency Trend
const DailyEfficiencyTrend = ({ filters }) => {
    const data = []; // No hardcoded data

    return (
        <div className="dashboard-card chart-card-container dome-card-wrapper">
            <div className="dashboard-card-header d-flex justify-between">
                <h3>Daily Efficiency Trend (%)</h3>
                <select className="select-filter-compact text-sm"><option>Daily</option></select>
            </div>
            <div className="dashboard-card-content p-4 d-flex">
                <div className="chart-content flex-2 w-100 chart-fixed-height">
                    {data.length > 0 ? (
                        <LineChart data={data} xAxisKey="date" series={[{ key: "efficiency", name: "Efficiency %", color: "#10b981" }]} showLegend={false} />
                    ) : (
                        <div className="d-flex align-center justify-center w-100 h-100 text-muted">No data available</div>
                    )}
                </div>
            </div>
        </div>
    );
};

// 8. Downtime Summary
const DowntimeSummary = ({ filters }) => {
    const downtimeReasons = []; // No hardcoded data

    return (
        <div className="dashboard-card chart-card-container dome-card-wrapper">
            <div className="dashboard-card-header d-flex justify-between">
                <h3>Downtime Summary (Today)</h3>
                <span className="text-primary text-sm" style={{ cursor: 'pointer' }}>View All</span>
            </div>
            <div className="dashboard-card-content p-3 d-flex align-center justify-center">
                 {downtimeReasons.length > 0 ? (
                     <>
                         <div className="flex-1 donut-fixed-height">
                             <PieChart data={downtimeReasons} dataKey="value" nameKey="name" showLegend={false} innerRadius={50} outerRadius={70} />
                         </div>
                         <div className="flex-1">
                             <table className="downtime-legend-table w-100">
                                 <tbody>
                                     {downtimeReasons.map(r => (
                                         <tr key={r.name}>
                                             <td><span className="legend-dot" style={{ backgroundColor: r.color }}></span>{r.name}</td>
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
    // Zeroed out metrics to avoid hardcoding
    const metrics = [
        { name: 'Availability', value: 0, color: '#10b981' },
        { name: 'Performance', value: 0, color: '#3b82f6' },
        { name: 'Quality', value: 0, color: '#8b5cf6' },
        { name: 'OEE', value: 0, color: '#f97316' }
    ];

    return (
        <div className="dashboard-card chart-card-container dome-card-wrapper">
            <div className="dashboard-card-header">
                <h3>OEE Breakdown (Today)</h3>
            </div>
            <div className="dashboard-card-content p-4 d-flex justify-between align-center flex-row oee-breakdown-container">
                 {metrics.map(m => (
                     <div key={m.name} className="d-flex flex-column align-center flex-1">
                          <p className="font-semibold text-muted mb-3 text-center oee-label">{m.name}</p>
                          <div className="oee-arc-container">
                              <div className="oee-arc-wrapper">
                                 <div className="oee-arc-border" style={{ borderColor: m.color }}></div>
                              </div>
                              <div className="oee-arc-value">
                                  <h3 className="m-0 text-bold text-dark">{m.value.toFixed(2)}%</h3>
                              </div>
                          </div>
                     </div>
                 ))}
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

    return (
        <div className="dashboard-card chart-card-container dome-card-wrapper">
            <div className="dashboard-card-header d-flex justify-between">
                <h3>Quality Summary (Today)</h3>
                <span className="text-primary text-sm" style={{ cursor: 'pointer' }}>View All</span>
            </div>
            <div className="dashboard-card-content p-4">
                <div className="d-flex justify-between text-center gap-4 mb-4" style={{borderBottom: '1px solid #eee', paddingBottom: '15px'}}>
                    <div className="flex-1 bg-light p-3" style={{borderRadius: '8px'}}>
                        <p className="m-0 text-muted" style={{fontSize: '0.85rem'}}>Rejection %</p>
                        <h3 className="text-danger m-0 mt-1">{data.rejectionPercent}%</h3>
                    </div>
                    <div className="flex-1 bg-light p-3" style={{borderRadius: '8px', opacity: 0.6}}>
                        <p className="m-0 text-muted" style={{fontSize: '0.85rem'}}>Rework %</p>
                        <h3 className="text-warning m-0 mt-1">—</h3>
                    </div>
                    <div className="flex-1 bg-light p-3" style={{borderRadius: '8px'}}>
                        <p className="m-0 text-muted" style={{fontSize: '0.85rem'}}>First Pass Yield %</p>
                        <h3 className="text-success m-0 mt-1">{data.firstPassYield}%</h3>
                    </div>
                </div>
                <div className="d-flex justify-between text-center gap-4">
                    <div className="flex-1">
                        <p className="m-0 text-muted" style={{fontSize: '0.85rem'}}>Rejected Qty</p>
                        <h4 className="m-0 text-danger">{formatNumberCompact(data.rejectedQty)}</h4>
                    </div>
                    <div className="flex-1" style={{ opacity: 0.6 }}>
                        <p className="m-0 text-muted" style={{fontSize: '0.85rem'}}>Reworked Qty</p>
                        <h4 className="m-0 text-warning">—</h4>
                    </div>
                    <div className="flex-1">
                        <p className="m-0 text-muted" style={{fontSize: '0.85rem'}}>Total Produced</p>
                        <h4 className="m-0">{formatNumberCompact(data.totalProduced)}</h4>
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

    return (
        <div className="dashboard-card chart-card-container dome-card-wrapper">
            <div className="dashboard-card-header">
                <h3>Production Orders Summary</h3>
            </div>
            <div className="dashboard-card-content p-4">
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
