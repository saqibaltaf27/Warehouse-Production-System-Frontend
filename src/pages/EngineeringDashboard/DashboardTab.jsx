import React, { useState, useEffect } from 'react';
import {
  IconRefresh,
  IconTool,
  IconCalendarEvent,
  IconCalendarStats,
  IconCalendarTime,
  IconAlertCircle,
  IconChecklist
} from '@tabler/icons-react';
import { axiosInstance } from '../../apis/axiosinstance';
import { API_ENDPOINTS } from '../../apis/endpoints';
import BarChart from '../../global-components/Charts/BarChart';
import PieChart from '../../global-components/Charts/PieChart';
import Table from '../../global-components/Table/Table';
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
    type: null,
    family: null,
    instrumentId: null
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
          type: filters.type?.value || '',
          family: filters.family?.value || '',
          instrumentId: filters.instrumentId?.value || ''
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

  const handleFilterChange = (key, selectedOption) => {
    setFilters(prev => ({ ...prev, [key]: selectedOption }));
    setCurrentPage(1); // Reset page on filter change
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
      {/* Filters Section */}
      <div className="inventory-filters pm-filters dashboard-card">
        <select value={filters.year} onChange={(e) => handleFilterChange('year', parseInt(e.target.value))}>
          {filterOptions.years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <select value={filters.type || ''} onChange={(e) => handleFilterChange('type', e.target.value || null)}>
          <option value="">All Types</option>
          {filterOptions.types.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select value={filters.family || ''} onChange={(e) => handleFilterChange('family', e.target.value || null)}>
          <option value="">All Families</option>
          {filterOptions.families.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        <select value={filters.instrumentId || ''} onChange={(e) => handleFilterChange('instrumentId', e.target.value ? parseInt(e.target.value) : null)}>
          <option value="">All Instruments</option>
          {filterOptions.instruments.map(i => (
            <option key={i.id} value={i.id}>{`${i.instrument_name} (${i.instrument_sn})`}</option>
          ))}
        </select>

        <button className="reset-btn" onClick={() => setFilters({ year: new Date().getFullYear(), type: null, family: null, instrumentId: null })}>
          Reset
        </button>
      </div>

      {loading && <div className="loading-state"><IconRefresh className="spin" size={32} /> Loading data...</div>}

      {!loading && (
        <>
          {/* Charts Row 1 */}
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

          {/* Charts Row 2 */}
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

          {/* Annual PM Schedule Matrix */}
          <div className="dashboard-card">
            <div className="matrix-header">
              <h3>Annual Preventive Maintenance Schedule ({filters.year})</h3>
              <input 
                type="text" 
                placeholder="Search Instrument or S/N..." 
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="pm-search-input"
              />
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
