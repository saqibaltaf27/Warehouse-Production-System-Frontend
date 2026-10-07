import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../../apis/axiosinstance';
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
} from 'recharts';
import './ProductionOverview.css';

const ProductionOverview = () => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [productionSummaryData, setProductionSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get('/dashboard/qc-overview', {
          params: { month: selectedMonth, year: selectedYear }
        });
        if (response.data && response.data.success) {
          const fetchedData = response.data.data.map((item, index) => ({
            id: index + 1,
            group: item.ItemGroup,
            name: item.ProductName,
            planned: item.PlannedQty,
            completed: item.CompletedQty,
            inProcess: item.InProcessQty,
            resourceValue: item.ResourceValue || 0,
            prodCost: item.ResourceValue || 0, // Using same for now
            costBox: item.CostPerBox || 0,
            costTest: item.CostPerBox ? item.CostPerBox / 50 : 0 // Assuming 50 per box for rapid test as per dummy data
          }));
          setProductionSummaryData(fetchedData);
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
      .map(item => ({ name: item.name.substring(0, 15) + '...', qty: item.completed }));
  }, [productionSummaryData]);

  const productionMixData = React.useMemo(() => {
    const groups = {};
    let total = 0;
    productionSummaryData.forEach(item => {
      groups[item.group] = (groups[item.group] || 0) + (item.resourceValue || 0);
      total += (item.resourceValue || 0);
    });
    const colors = ['#1a3673', '#c92a2a', '#f59f00', '#868e96', '#2f9e44', '#7950f2'];
    
    // Create an "Others" group if needed or just show all. Sorting them makes it nicer.
    const data = Object.keys(groups).map((key, i) => ({
      name: key,
      value: groups[key],
      color: colors[i % colors.length],
      percentage: total > 0 ? (groups[key] / total) * 100 : 0
    })).filter(g => g.value > 0).sort((a, b) => b.value - a.value);

    // Ensure colors stay consistent after sort
    data.forEach((d, i) => d.color = colors[i % colors.length]);

    return { total, data };
  }, [productionSummaryData]);

  const productionStatusData = React.useMemo(() => {
    const totalCompleted = productionSummaryData.reduce((acc, curr) => acc + curr.completed, 0);
    const totalInProcess = productionSummaryData.reduce((acc, curr) => acc + curr.inProcess, 0);
    return [
      { name: 'Completed', value: totalCompleted, color: '#2f9e44' },
      { name: 'In Process', value: totalInProcess, color: '#f59f00' },
    ];
  }, [productionSummaryData]);

  const syphilisCostTrendData = [
    { po: '2595', cost: 24.26 },
    { po: '2592', cost: 24.20 },
    { po: '2587', cost: 24.19 },
    { po: '2593', cost: 24.12 },
    { po: '2589', cost: 24.11 },
    { po: '3385', cost: 24.11 },
  ];

  const hcvCostTrendData = [
    { po: '2597', cost: 23.45 },
    { po: '2612', cost: 22.69 },
  ];

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  const totalStatus = productionStatusData.reduce((acc, curr) => acc + curr.value, 0) || 1; // avoid div by 0

  return (
    <div className="production-overview">
      <div className="overview-header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div className="overview-header" style={{ marginBottom: 0, flex: 1 }}>
          <h2 style={{ marginBottom: 0 }}>PRODUCTION SUMMARY (ALL ITEMS) & COST COMPARISON (SYPHILIS & HCV) - {months.find(m => m.value === selectedMonth)?.label?.toUpperCase()} {selectedYear}</h2>
        </div>
        <div className="overview-filters" style={{ display: 'flex', gap: '10px', marginLeft: '20px' }}>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem', fontWeight: 500 }}>
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem', fontWeight: 500 }}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="overview-grid">
        {/* Top Left: Production Summary Table */}
        <div className="card summary-table-card">
          <div className="card-header">1. PRODUCTION SUMMARY (ALL ITEMS)</div>
          <div className="table-responsive">
            <table className="summary-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ITEM GROUP</th>
                  <th>PRODUCT NAME</th>
                  <th>PLANNED QTY<br />(Boxes / Kits / Units)</th>
                  <th>IN PROCESS<br />QTY</th>
                  <th>COMPLETED<br />QTY</th>
                  <th>RESOURCE VALUE<br />(PKR)</th>
                  <th>PRODUCTION<br />COST</th>
                  <th>COST PER BOX<br />(PKR)</th>
                  <th>COST PER TEST*<br />(PKR)</th>
                </tr>
              </thead>
              <tbody>
                {productionSummaryData.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.group}</td>
                    <td>{row.name}</td>
                    <td>{row.planned}</td>
                    <td>{row.inProcess || '-'}</td>
                    <td>{row.completed || '-'}</td>
                    <td>{row.resourceValue ? row.resourceValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                    <td>{row.prodCost ? row.prodCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                    <td>{row.costBox ? row.costBox.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                    <td>{row.costTest ? row.costTest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}>
                <tr>
                  <td colSpan="3" style={{ textAlign: 'right', paddingRight: '10px' }}>TOTAL</td>
                  <td>{productionSummaryData.reduce((acc, row) => acc + (row.planned || 0), 0).toLocaleString()}</td>
                  <td>{productionSummaryData.reduce((acc, row) => acc + (row.inProcess || 0), 0).toLocaleString()}</td>
                  <td>{productionSummaryData.reduce((acc, row) => acc + (row.completed || 0), 0).toLocaleString()}</td>
                  <td>{productionSummaryData.reduce((acc, row) => acc + (row.resourceValue || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>{productionSummaryData.reduce((acc, row) => acc + (row.prodCost || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>-</td>
                  <td>-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Top Right 1: Top 5 Items */}
        <div className="card top5-card">
          <div className="card-header">2. TOP 5 ITEMS BY COMPLETED QTY</div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={top5Data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="qty" fill="#1a3673" barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Right 2: Production Mix */}
        <div className="card mix-card">
          <div className="card-header">3. PRODUCTION MIX BY ITEM GROUP (BY RESOURCE VALUE)</div>
          <div className="mix-content">
            <div className="chart-container-donut" style={{ position: 'relative' }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 20 }}>
                  <Pie
                    data={productionMixData.data}
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                      const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                      if (percent < 0.05) return null; // don't show label for very small slices
                      return (
                        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
                          {`${(percent * 100).toFixed(2)}%`}
                        </text>
                      );
                    }}
                  >
                    {productionMixData.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#1a3673', textAlign: 'center' }}>BY RESOURCE<br/>VALUE<br/>(PKR)</span>
              </div>
            </div>
            <div className="mix-legend-wrap">
              <div className="mix-legend">
                {productionMixData.data.map((item, index) => (
                  <div key={index} className="legend-item" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: '10px', alignItems: 'center' }}>
                    <span className="legend-color" style={{ backgroundColor: item.color, width: '12px', height: '12px', borderRadius: '50%', display: 'inline-block' }}></span>
                    <span className="legend-name" style={{ fontSize: '0.75rem', fontWeight: '600', color: '#1a3673', textTransform: 'uppercase' }}>{item.name}</span>
                    <span className="legend-value" style={{ fontSize: '0.8rem', fontWeight: '500', textAlign: 'right' }}>{item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span className="legend-percent" style={{ fontSize: '0.8rem', fontWeight: 'bold', width: '50px', textAlign: 'right', color: '#333' }}>{item.percentage.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
              <div className="legend-total-row" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '10px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #ddd', paddingLeft: '22px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1a3673' }}>TOTAL</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'right' }}>{productionMixData.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', width: '50px', textAlign: 'right' }}>100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overview-bottom-grid">
        {/* Bottom Left: Production Status */}
        <div className="card status-card">
          <div className="card-header green-header">4. PRODUCTION STATUS (ALL ITEMS)</div>
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
                  <span className="legend-color" style={{ backgroundColor: '#2f9e44' }}></span>
                  <span className="legend-name">Completed</span>
                  <span className="legend-value">{productionStatusData[0].value.toLocaleString()} ({((productionStatusData[0].value / totalStatus) * 100).toFixed(1)}%)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#f59f00' }}></span>
                  <span className="legend-name">In Process</span>
                  <span className="legend-value">{productionStatusData[1].value.toLocaleString()} ({((productionStatusData[1].value / totalStatus) * 100).toFixed(1)}%)</span>
                </div>
            </div>
          </div>
        </div>

        {/* Bottom Right: Additional Cost Comparison */}
        <div className="card cost-comp-card">
          <div className="card-header purple-header">5. ADDITIONAL COST COMPARISON (R-TEST SYPHILIS & R-TEST HCV ONLY)</div>
          <div className="cost-comp-content">
            
            <div className="cost-comp-section">
               <div className="sub-header">A. R-TEST SYPHILIS (PACK OF 50) - COST PER TEST COMPARISON</div>
               <div className="cost-comp-row">
                  <div className="cost-table-wrap">
                    <table className="cost-table">
                      <thead>
                        <tr>
                          <th>Doc Num</th>
                          <th>Completed Qty</th>
                          <th>Cost per Test</th>
                        </tr>
                      </thead>
                      <tbody>
                        {syphilisCostTrendData.map((row) => (
                          <tr key={row.po}>
                            <td>{row.po}</td>
                            <td>1,000</td>
                            <td>{row.cost.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="cost-chart-wrap">
                    <ResponsiveContainer width="100%" height={150}>
                      <LineChart data={syphilisCostTrendData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <XAxis dataKey="po" tick={{ fontSize: 10 }} />
                        <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="cost" stroke="#3b2b73" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
               </div>
            </div>

            <div className="cost-comp-section">
               <div className="sub-header green">B. R-TEST HCV (PACK OF 50) - COST PER TEST COMPARISON</div>
               <div className="cost-comp-row">
                  <div className="cost-table-wrap">
                    <table className="cost-table">
                      <thead>
                        <tr>
                          <th>Doc Num</th>
                          <th>Completed Qty</th>
                          <th>Cost per Test</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hcvCostTrendData.map((row) => (
                          <tr key={row.po}>
                            <td>{row.po}</td>
                            <td>{row.po === '2597' ? 974 : 500}</td>
                            <td>{row.cost.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="cost-chart-wrap">
                    <ResponsiveContainer width="100%" height={150}>
                      <LineChart data={hcvCostTrendData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <XAxis dataKey="po" tick={{ fontSize: 10 }} />
                        <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="cost" stroke="#2f9e44" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
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
