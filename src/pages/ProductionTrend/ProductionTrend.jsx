import React, { useState, useEffect } from 'react';
import { productionTrendApi } from '../../apis/auth/production-trend';
import ProductionTrendFilters from '../../components/ProductionTrend/ProductionTrendFilters';
import ProductionTrendCharts from '../../components/ProductionTrend/ProductionTrendCharts';
import ProductionTrendTable from '../../components/ProductionTrend/ProductionTrendTable';
import { 
  IconBox, 
  IconClipboardList,
  IconClock,
  IconCheck,
  IconX
} from '@tabler/icons-react';
import Card from '../../global-components/Card/Card';
import '../../components/ProductionTrend/ProductionTrend.css';

const ProductionTrend = () => {
  const [summary, setSummary] = useState({
    totalProduction: '0.00',
    totalOrders: 0,
    totalProducts: 0,
    totalRejected: '0.00',
    growthPercent: '0.00'
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [yearlyData, setYearlyData] = useState([]);
  const [productShare, setProductShare] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [filterOptions, setFilterOptions] = useState({});

  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchDashboardMetrics();
  }, [filters]);

  useEffect(() => {
    fetchTableData();
  }, [filters, page, pageSize, search]);

  const fetchFilterOptions = async () => {
    try {
      const res = await productionTrendApi.getFilterOptions();
      if (res.data.success) {
        setFilterOptions(res.data.data);
      }
    } catch (err) {
      console.error("Error loading filter options:", err);
    }
  };

  const fetchDashboardMetrics = async () => {
    try {
      setLoading(true);
      const [sumRes, monthRes, yearRes, shareRes, compRes] = await Promise.all([
        productionTrendApi.getSummary(filters),
        productionTrendApi.getMonthlyTrend(filters),
        productionTrendApi.getYearlyTrend(filters),
        productionTrendApi.getProductShare(filters),
        productionTrendApi.getYearComparison(filters)
      ]);

      if (sumRes.data.success) setSummary(sumRes.data.data);
      if (monthRes.data.success) setMonthlyData(monthRes.data.data);
      if (yearRes.data.success) setYearlyData(yearRes.data.data);
      if (shareRes.data.success) setProductShare(shareRes.data.data);
      if (compRes.data.success) setComparisonData(compRes.data.data);
    } catch (err) {
      console.error("Error fetching dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async () => {
    try {
      setTableLoading(true);
      const res = await productionTrendApi.getTableData(filters, page, pageSize, search);
      if (res.data.success) {
        setTableData(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
        setTotalItems(res.data.pagination.totalItems);
      }
    } catch (err) {
      console.error("Error fetching table data:", err);
    } finally {
      setTableLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({});
    setSearch('');
    setPage(1);
  };

  const formatNumber = (num) => {
    const val = parseFloat(num);
    if (isNaN(val)) return '0';
    return val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  return (
    <div className="production-trend-container">



      {/* Filters */}
      <ProductionTrendFilters
        options={filterOptions}
        filters={filters}
        onFilterChange={setFilters}
        onReset={handleResetFilters}
      />

      {/* KPI Cards */}
      <div className="fade-in-up delay-100 mb-6">
        <Card items={[
          {
            title: "Production Orders",
            value: summary.totalOrders,
            trendText: "Unique Work Orders",
            icon: IconClipboardList
          },
          {
            title: "Pending Orders",
            value: summary.pendingOrders,
            trendText: "Planned & In Progress",
            icon: IconClock
          },
          {
            title: "Complete Orders",
            value: summary.completeOrders,
            trendText: "Finished Orders",
            icon: IconCheck
          },
          {
            title: "Cancelled Orders",
            value: summary.cancelledOrders,
            trendText: "Cancelled Work Orders",
            icon: IconX
          },
          {
            title: "Total Production",
            value: formatNumber(summary.totalProduction),
            trendText: "Total Quantity Received",
            icon: IconBox
          }
        ]} />
      </div>

      {/* Charts */}
      <div className="fade-in-up delay-200">
        <ProductionTrendCharts
          productShare={productShare}
          monthlyData={monthlyData}
          comparisonData={comparisonData}
          loading={loading}
        />
      </div>

      {/* Detailed Table */}
      <div className="fade-in-up delay-300">
        <ProductionTrendTable
          data={tableData}
          loading={tableLoading}
          pagination={{ page, pageSize, totalPages, totalItems }}
          search={search}
          onSearchChange={setSearch}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

    </div>
  );
};

export default ProductionTrend;
