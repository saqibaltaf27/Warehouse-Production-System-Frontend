import React, { useState, useEffect } from 'react';
import {
  IconRefresh,
  IconSearch,
  IconFileSpreadsheet,
} from '@tabler/icons-react';
import { axiosInstance } from '../../apis/axiosinstance';
import { API_ENDPOINTS } from '../../apis/endpoints';
import BarChart from '../../global-components/Charts/BarChart';
import PieChart from '../../global-components/Charts/PieChart';
import Table from '../../global-components/Table/Table';
import Button from '../../global-components/Button/Button';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import '../ProductionOrders/ProductionOrders.css';
import './DashboardTab.css';

const formatDisplayDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Past Scheduled': return '#ef4444'; // Red
    case 'Due Today': return '#f59e0b'; // Amber
    case 'Due Soon': return '#eab308'; // Yellow
    case 'Upcoming': return '#10b981'; // Green
    default: return '#6b7280';
  }
};

const DashboardTab = () => {
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    type: '',
    family: '',
    instrumentId: ''
  });

  const [filterOptions, setFilterOptions] = useState({
    years: [],
    types: [],
    families: [],
    instruments: []
  });

  const [summary, setSummary] = useState(null);
  const [chartsData, setChartsData] = useState(null);
  const [yearlySchedule, setYearlySchedule] = useState([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(tableSearch);
      setCurrentPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [tableSearch]);

  // Fetch Filters on Mount
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await axiosInstance.get(API_ENDPOINTS.PREVENTIVE_MAINTENANCE.FILTERS);
        if (res.data?.success) {
          setFilterOptions(res.data.data);
          if (!res.data.data.years.includes(filters.year) && res.data.data.years.length > 0) {
            setFilters(prev => ({ ...prev, year: res.data.data.years[0] }));
          }
        }
      } catch (err) {
        console.error('Error fetching filters', err);
      }
    };
    fetchFilters();
  }, []);

  // Fetch Dashboard Data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const queryParams = {
          year: filters.year,
          type: filters.type || '',
          family: filters.family || '',
          instrumentId: filters.instrumentId || ''
        };

        const tableParams = {
          ...queryParams,
          page: currentPage,
          limit: pageSize,
          search: debouncedSearch
        };

        const [summaryRes, chartsRes, yearlyRes] = await Promise.all([
          axiosInstance.get(API_ENDPOINTS.PREVENTIVE_MAINTENANCE.SUMMARY, { params: queryParams }),
          axiosInstance.get(API_ENDPOINTS.PREVENTIVE_MAINTENANCE.CHARTS, { params: queryParams }),
          axiosInstance.get(API_ENDPOINTS.PREVENTIVE_MAINTENANCE.YEARLY_SCHEDULE, { params: tableParams })
        ]);

        if (summaryRes.data?.success) setSummary(summaryRes.data.data);
        if (chartsRes.data?.success) setChartsData(chartsRes.data.data);
        if (yearlyRes.data?.success) {
          setYearlySchedule(yearlyRes.data.data);
          setTotalEntries(yearlyRes.data.total || 0);
        }
      } catch (err) {
        console.error('Error fetching dashboard data', err);
      }
      setLoading(false);
    };

    fetchDashboardData();
  }, [filters, currentPage, pageSize, debouncedSearch]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    tableSearch.trim() ||
    filters.type ||
    filters.family ||
    filters.instrumentId ||
    filters.year !== new Date().getFullYear()
  );

  const handleResetFilters = () => {
    setFilters({
      year: new Date().getFullYear(),
      type: '',
      family: '',
      instrumentId: '',
    });
    setTableSearch('');
    setDebouncedSearch('');
    setCurrentPage(1);
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const res = await axiosInstance.get(API_ENDPOINTS.PREVENTIVE_MAINTENANCE.YEARLY_SCHEDULE, {
        params: {
          year: filters.year,
          type: filters.type || '',
          family: filters.family || '',
          instrumentId: filters.instrumentId || '',
          page: 1,
          limit: Math.max(totalEntries || 0, 1000),
          search: debouncedSearch,
        },
      });
      if (!res.data?.success) {
        toast.error(res.data?.message || 'Failed to export schedule');
        return;
      }
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const rows = (res.data.data || []).map((row) => {
        const mapped = {
          'Instrument Name': row.instrument_name ?? '',
          'Instrument S/N': row.instrument_sn ?? '',
          Type: row.type ?? '',
          Family: row.family ?? '',
          'Date of Installation': formatDisplayDate(row.date_of_installation),
        };
        months.forEach((month) => {
          const entries = row.schedule?.[month] || [];
          mapped[month] = entries.map((m) => formatDisplayDate(m.date)).join(', ');
        });
        return mapped;
      });
      if (!rows.length) {
        toast.error('No records to export');
        return;
      }
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `PM ${filters.year}`);
      XLSX.writeFile(workbook, `Engineering_Dashboard_PM_${filters.year}.xlsx`);
      toast.success(`Exported ${rows.length} record(s)`);
    } catch (err) {
      console.error('Export Excel failed:', err);
      toast.error(err?.response?.data?.message || err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const matrixColumns = [
    { header: 'Instrument Name', key: 'instrument_name', className: 'sticky-col font-medium' },
    { header: 'Instrument S/N', key: 'instrument_sn' },
    { header: 'Type', key: 'type' },
    { header: 'Family', key: 'family' },
    { header: 'Date of Installation', key: 'date_of_installation', render: (row) => formatDisplayDate(row.date_of_installation) },
    ...["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(month => ({
      header: month,
      key: month,
      className: 'month-cell',
      render: (row) => {
        const hasSchedule = row.schedule && row.schedule[month] && row.schedule[month].length > 0;
        return hasSchedule ? (
          <div className="date-badges">
            {row.schedule[month].map((maint, i) => (
              <span key={i} className="date-badge" title={maint.status}>
                {formatDisplayDate(maint.date)}
              </span>
            ))}
          </div>
        ) : (
          <span className="empty-dash">-</span>
        );
      }
    }))
  ];

  return (
    <div className="pm-dashboard">
      <div className="po-filter-toolbar-card">
        <div className="po-filter-toolbar-grid">
          <div className="po-filter-item po-filter-search-box">
            <label className="po-filter-label">Search</label>
            <div style={{ position: 'relative' }}>
              <IconSearch size={18} className="po-filter-search-icon" />
              <input
                type="text"
                placeholder="Search Instrument or S/N..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="po-filter-search-input"
              />
            </div>
          </div>

          <div className="po-filter-item">
            <label className="po-filter-label">Year</label>
            <select
              className="po-filter-date-input"
              value={filters.year}
              onChange={(e) => handleFilterChange('year', parseInt(e.target.value, 10))}
            >
              {(filterOptions.years.length ? filterOptions.years : [filters.year]).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="po-filter-item" style={{ minWidth: '160px' }}>
            <label className="po-filter-label">Type</label>
            <select
              className="po-filter-date-input"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">All Types</option>
              {filterOptions.types.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="po-filter-item" style={{ minWidth: '160px' }}>
            <label className="po-filter-label">Family</label>
            <select
              className="po-filter-date-input"
              value={filters.family}
              onChange={(e) => handleFilterChange('family', e.target.value)}
            >
              <option value="">All Families</option>
              {filterOptions.families.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div className="po-filter-item" style={{ minWidth: '220px' }}>
            <label className="po-filter-label">Instrument</label>
            <select
              className="po-filter-date-input"
              value={filters.instrumentId}
              onChange={(e) => handleFilterChange('instrumentId', e.target.value)}
            >
              <option value="">All Instruments</option>
              {filterOptions.instruments.map((i) => (
                <option key={i.id} value={i.id}>{`${i.instrument_name} (${i.instrument_sn})`}</option>
              ))}
            </select>
          </div>

          <div className="po-filter-item">
            <label className="po-filter-label">&nbsp;</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button
                type="button"
                variant="success"
                className="po-export-btn"
                onClick={handleExportExcel}
                disabled={exporting || loading}
                title="Export Excel"
                icon={<IconFileSpreadsheet size={16} />}
              >
                {exporting ? 'Exporting...' : 'Export Excel'}
              </Button>
              <button
                type="button"
                className="po-filter-reset-btn"
                onClick={handleResetFilters}
                disabled={!hasActiveFilters}
                title={hasActiveFilters ? 'Reset all filters' : 'No filters applied'}
              >
                <IconRefresh size={16} />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && <div className="loading-state"><IconRefresh className="spin" size={32} /> Loading data...</div>}

      {!loading && (
        <>
          <div className="pm-charts-row">
            <div className="dashboard-card pm-chart-container">
              <h3>Monthly Preventive Maintenance ({filters.year})</h3>
              {chartsData?.monthly && chartsData.monthly.length > 0 ? (
                <BarChart data={chartsData.monthly} xAxisKey="month" series={[{ key: 'count', color: '#023e25', name: 'Scheduled' }]} xAxisInterval={0} />
              ) : (
                <div className="empty-state">No data available</div>
              )}
            </div>
            <div className="dashboard-card pm-chart-container">
              <h3>Maintenance Status</h3>
              {summary && (summary.PastScheduled > 0 || summary.DueToday > 0 || summary.DueSoon > 0 || summary.Upcoming > 0) ? (
                <PieChart data={[
                  { name: 'Past Scheduled', value: summary.PastScheduled, color: '#ef4444' },
                  { name: 'Due Today', value: summary.DueToday, color: '#f59e0b' },
                  { name: 'Due Soon', value: summary.DueSoon, color: '#eab308' },
                  { name: 'Upcoming', value: summary.Upcoming, color: '#10b981' }
                ].filter(d => d.value > 0)} />
              ) : (
                <div className="empty-state">No data available</div>
              )}
            </div>
          </div>

          <div className="pm-charts-row">
            <div className="dashboard-card pm-chart-container">
              <h3>Maintenance by Type</h3>
              {chartsData?.byType && chartsData.byType.length > 0 ? (
                <BarChart data={chartsData.byType} xAxisKey="type" series={[{ key: 'Count', color: '#3b82f6', name: 'Count' }]} xAxisInterval={0} xAxisAngle={-25} bottomMargin={40} />
              ) : (
                <div className="empty-state">No data available</div>
              )}
            </div>
            <div className="dashboard-card pm-chart-container">
              <h3>Maintenance by Family</h3>
              {chartsData?.byFamily && chartsData.byFamily.length > 0 ? (
                <BarChart data={chartsData.byFamily} xAxisKey="family" series={[{ key: 'Count', color: '#8b5cf6', name: 'Count' }]} xAxisInterval={0} xAxisAngle={-25} bottomMargin={40} />
              ) : (
                <div className="empty-state">No data available</div>
              )}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="matrix-header">
              <h3>Annual Preventive Maintenance Schedule ({filters.year})</h3>
            </div>
            <div className="pm-matrix-wrapper">
              <Table 
                data={yearlySchedule} 
                columns={matrixColumns} 
                showActions={false} 
                showPagination={true} 
                totalEntries={totalEntries} 
                pageSize={pageSize}
                currentPage={currentPage}
                onPageChange={(page) => setCurrentPage(page)}
                onItemsPerPageChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardTab;
