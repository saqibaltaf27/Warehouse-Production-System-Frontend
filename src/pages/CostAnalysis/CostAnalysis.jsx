import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Card from '../../global-components/Card/Card';
import Table from '../../global-components/Table/Table';
import GlobalPopup from '../../global-components/GlobalPopup/GlobalPopup';
import EmptyState from '../../global-components/EmptyState/EmptyState';
import GlobalLoading from '../../global-components/GlobalLoading/GlobalLoading';
import GlobalLineChart from '../../global-components/Charts/LineChart';
import GlobalPieChart from '../../global-components/Charts/PieChart';
import {
  IconClipboardList,
  IconCurrencyDollar,
  IconPercentage,
  IconCalculator,
  IconChartLine
} from '@tabler/icons-react';
import './CostAnalysis.css';

const CostAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Drill-down Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);

  const costContributionData = React.useMemo(() => {
    if (!orders || orders.length === 0) return [];

    let rm = 0, labour = 0, machine = 0, foh = 0;
    orders.forEach(o => {
      rm += (o.ActualMaterialCost || 0);
      labour += (o.ActualLabourCost || 0);
      machine += (o.ActualMachineCost || 0);
      foh += (o.ActualFOHCost || 0);
    });

    return [
      { name: 'Raw Material', value: rm, color: '#0088FE' },
      { name: 'Labour', value: labour, color: '#00C49F' },
      { name: 'Machine', value: machine, color: '#FFBB28' },
      { name: 'Overhead (FOH)', value: foh, color: '#FF8042' }
    ].filter(item => item.value > 0);
  }, [orders]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [summaryRes, trendRes, ordersRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/cost-analysis/summary`),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/cost-analysis/trend`),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/cost-analysis/orders`)
      ]);

      if (summaryRes.data?.success) setSummary(summaryRes.data.data);
      if (trendRes.data?.success) setTrendData(trendRes.data.data);
      if (ordersRes.data?.success) setOrders(ordersRes.data.data);
    } catch (error) {
      console.error("Error fetching cost analysis data", error);
    }
    setLoading(false);
  };

  const handleOrderClick = async (record) => {
    setSelectedOrder(record);
    setIsModalVisible(true);
    setMaterialsLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/cost-analysis/orders/${record.DocEntry}/materials`);
      if (res.data?.success) {
        setMaterials(res.data.data);
      }
    } catch (error) {
      console.error("Failed to load materials for order", error);
    }
    setMaterialsLoading(false);
  };

  const columns = [
    { key: 'DocNum', header: 'PO No', render: (row) => row.DocNum },
    { key: 'FGItemCode', header: 'Product', render: (row) => row.FGItemCode },
    {
      key: 'Status', header: 'Status', render: (row) => (
        <span className={`status-badge status-${row.Status?.toLowerCase() || 'unknown'}`}>{row.Status}</span>
      )
    },
    {
      key: 'PlannedFGQty',
      header: 'Planned Qty',
      render: (row) => Number(row.PlannedFGQty || 0).toLocaleString()
    },
    {
      key: 'ActualFGQty',
      header: 'Actual Qty',
      render: (row) => Number(row.ActualFGQty || 0).toLocaleString()
    },
    {
      key: 'YieldPercent',
      header: 'Yield %',
      render: (row) => {
        const val = row.YieldPercent || 0;
        const colorClass = val < 90 ? 'yield-red' : (val > 105 ? 'yield-orange' : 'yield-green');
        return <span className={`yield-badge ${colorClass}`}>{val.toFixed(2)}%</span>;
      }
    },
    {
      key: 'PlannedCost',
      header: 'Planned Cost',
      render: (row) => `${Number(row.PlannedCost || 0).toFixed(2)}`
    },
    {
      key: 'ActualCost',
      header: 'Actual Cost',
      render: (row) => `${Number(row.ActualCost || 0).toFixed(2)}`
    },
    {
      key: 'TotalVariance',
      header: 'Variance',
      render: (row) => {
        const variance = row.TotalVariance || 0;
        const colorClass = variance > 0 ? 'variance-positive' : 'variance-negative';
        return <span className={`variance-text ${colorClass}`}>{variance.toFixed(2)}</span>;
      }
    }
  ];

  const materialColumns = [
    { key: 'ItemCode', header: 'Item/Resource', render: (row) => row.ItemCode },
    {
      key: 'Type',
      header: 'Type',
      render: (row) => {
        if (row.ItemType === 290) {
          if (row.ResType === 'L') return 'Labour';
          if (row.ResType === 'M') return 'Machine';
          if (row.ResType === 'O') return 'FOH';
          return 'Resource';
        }
        return 'Material';
      }
    },
    { key: 'PlannedQty', header: 'Planned Qty', render: (row) => Number(row.PlannedQty || 0).toFixed(2) },
    { key: 'ActualQty', header: 'Actual Qty', render: (row) => Number(row.ActualQty || 0).toFixed(2) },
    {
      key: 'PlannedCost',
      header: 'Planned Cost',
      render: (row) => `${Number(row.PlannedCost || 0).toFixed(2)}`
    },
    {
      key: 'ActualCost',
      header: 'Actual Cost',
      render: (row) => `${Number(row.ActualCost || 0).toFixed(2)}`
    },
    {
      key: 'UsageVariance',
      header: 'Usage Variance',
      render: (row) => {
        const val = row.UsageVariance || 0;
        const colorClass = val > 0 ? 'variance-positive' : 'variance-negative';
        return <span className={`variance-text ${colorClass}`}>{Number(val).toFixed(2)}</span>;
      }
    },
    {
      key: 'PriceVariance',
      header: 'Price Variance',
      render: (row) => {
        const val = row.PriceVariance || 0;
        const colorClass = val > 0 ? 'variance-positive' : 'variance-negative';
        return <span className={`variance-text ${colorClass}`}>{Number(val).toFixed(2)}</span>;
      }
    },
    {
      key: 'TotalVariance',
      header: 'Total Variance',
      render: (row) => {
        const val = row.TotalVariance || 0;
        const colorClass = val > 0 ? 'variance-positive' : 'variance-negative';
        return <span className={`variance-text variance-bold ${colorClass}`}>{Number(val).toFixed(2)}</span>;
      }
    }
  ];

  // Pagination for table
  const paginatedOrders = orders.slice((page - 1) * limit, page * limit);

  return (
    <div className="cost-analysis-dashboard">

      {loading ? (
        <GlobalLoading />
      ) : (
        <>
          {/* KPI Cards Layer 1 */}
          <div className="fade-in-up delay-100 mb-6">
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
          </div>

          {/* Charts Row */}
          <div className="cost-charts-row">
            {/* Monthly Trend Chart */}
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

            {/* Cost Contribution Donut */}
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
          </div>

          {/* Orders Table */}
          <div className="efficiency-table-wrapper dome-card-wrapper fade-in-up delay-300">
            <h3 className="section-title">Recent Production Orders</h3>
            <Table
              data={paginatedOrders}
              columns={columns}
              totalEntries={orders.length}
              currentPage={page}
              pageSize={limit}
              onPageChange={setPage}
              onItemsPerPageChange={setLimit}
              showActions={false}
              onRowClick={(row) => handleOrderClick(row)}
            />
          </div>
        </>
      )}

      {/* Drill-down Modal */}
      {isModalVisible && selectedOrder && (
        <GlobalPopup
          title={`Cost Details - Order #${selectedOrder.DocNum} (${selectedOrder.FGItemCode})`}
          onClose={() => setIsModalVisible(false)}
        >
          <div className="modal-content modal-table-scroll">
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
              />
            )}
          </div>
        </GlobalPopup>
      )}
    </div>
  );
};

export default CostAnalysis;
