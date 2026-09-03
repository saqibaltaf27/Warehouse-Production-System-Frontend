import React, { useState, useEffect } from 'react';
import { machineEfficiencyApi } from '../../apis/auth/machine-efficiency';
import DashboardFilters from '../../components/MachineEfficiency/DashboardFilters';
import DashboardCharts from '../../components/MachineEfficiency/DashboardCharts';
import DrilldownModal from '../../components/MachineEfficiency/DrilldownModal';
import Card from '../../global-components/Card/Card';
import Table from '../../global-components/Table/Table';
import EmptyState from '../../global-components/EmptyState/EmptyState';
import {
  IconClock, IconPercentage, IconBox, IconActivity, IconClipboardList,
  IconFilterX
} from '@tabler/icons-react';
import '../../components/MachineEfficiency/MachineEfficiency.css';

const MachineEfficiency = () => {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({});
  const [chartData, setChartData] = useState([]);
  const [filterOptions, setFilterOptions] = useState({});
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedMachine, setSelectedMachine] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchEfficiencyData();
  }, [filters, page, limit]);

  const fetchOptions = async () => {
    try {
      const res = await machineEfficiencyApi.getFilterOptions();
      if (res.data.success) {
        setFilterOptions(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEfficiencyData = async () => {
    try {
      setLoading(true);
      const response = await machineEfficiencyApi.getMachineEfficiencyData(filters, page, limit);
      if (response.data.success) {
        setData(response.data.data);
        if (response.data.chartData) {
          setChartData(response.data.chartData);
        }
        if (response.data.summary) {
          setSummary(response.data.summary);
        }
        if (response.data.pagination) {
          setTotalItems(response.data.pagination.totalItems);
        }
      } else {
        setError('Failed to load machine efficiency data.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while fetching efficiency data.');
    } finally {
      setLoading(false);
    }
  };

  // Use global KPIs from backend summary
  const totalAvailable = summary.totalAvailable || 0;
  const totalConsumed = summary.totalConsumed || 0;
  const globalUtilization = summary.globalUtilization || 0;
  const totalPlannedOutput = summary.totalPlannedOutput || 0;
  const totalOutput = summary.totalOutput || 0;
  const globalEfficiency = summary.globalEfficiency || 0;
  const globalQtyPerHour = summary.globalQtyPerHour || 0;

  if (error) return <div className="machine-efficiency-error">{error}</div>;

  const tableColumns = [
    {
      key: 'machineCode',
      header: 'Machine',
      render: (row) => <span className="machine-name" title={row.machineCode}>{row.machineCode}</span>
    },
    { key: 'availableHrs', header: 'Available hrs' },
    { key: 'consumedHrs', header: 'Used hrs' },
    {
      key: 'utilization',
      header: 'Util %',
      render: (row) => (
        <span className={`status-badge ${row.utilization >= 80 ? 'good' : row.utilization >= 50 ? 'warning' : 'danger'}`}>
          {row.utilization}%
        </span>
      )
    },
    { key: 'plannedOutputQty', header: 'Planned Output' },
    { key: 'outputQty', header: 'Actual Output' },
    { key: 'qtyPerHour', header: 'Qty/Hr' },
    {
      key: 'efficiency',
      header: 'Efficiency',
      render: (row) => (
        <span className={`status-badge ${row.efficiency >= 90 ? 'good' : row.efficiency >= 70 ? 'warning' : 'danger'}`}>
          {row.efficiency}%
        </span>
      )
    }
  ];

  return (
    <div className="machine-efficiency-container">


      <section className="machine-efficiency-filter-card" aria-label="Machine efficiency filters">
        <div className="machine-efficiency-section-heading">
          <div>
            <h2>Performance filters</h2>
            <p>Refine the live SAP B1 data by machine, product, status, or warehouse.</p>
          </div>
        </div>
        <DashboardFilters
          options={filterOptions}
          filters={filters}
          onFilterChange={setFilters}
        />
      </section>

      {loading && data.length === 0 ? (
        <div className="machine-efficiency-loading">Loading SAP B1 Live Data...</div>
      ) : (
        <>
          {data.length === 0 ? (
            <EmptyState
              title="No Machine Data Found"
              message="There is no machine efficiency data matching the selected filters. Try adjusting your date range or clearing filters."
              icon={IconFilterX}
              action={
                <button className="btn btn-outline" onClick={() => setFilters({})}>
                  Clear Filters
                </button>
              }
            />
          ) : (
            <>
              {/* KPI Cards & Charts */}
              <div className="fade-in-up delay-100">
                <div className="mb-6">
                  <Card items={[
                    {
                      title: "Actual Consumed / Available",
                      value: `${totalConsumed.toFixed(0)} / ${totalAvailable.toFixed(0)}`,
                      trendText: `Utilization: ${globalUtilization.toFixed(2)}%`,
                      icon: IconClock
                    },
                    {
                      title: "Production Efficiency",
                      value: `${globalEfficiency.toFixed(2)}%`,
                      trendText: `Actual: ${totalOutput.toFixed(0)} | Planned: ${totalPlannedOutput.toFixed(0)}`,
                      icon: IconPercentage
                    },
                    {
                      title: "Production Output",
                      value: totalOutput.toFixed(0),
                      trendText: `Planned: ${totalPlannedOutput.toFixed(0)} | Var: ${(totalOutput - totalPlannedOutput).toFixed(0)}`,
                      icon: IconBox
                    },
                    {
                      title: "Production / Machine Hr",
                      value: globalQtyPerHour.toFixed(2),
                      trendText: "Average Qty per Hour",
                      icon: IconActivity
                    },
                    {
                      title: "Active Orders",
                      value: summary.totalOrders || 0,
                      trendText: `Active: ${summary.activeOrders || 0} | Done: ${summary.closedOrders || 0}`,
                      icon: IconClipboardList
                    }
                  ]} />
                </div>

                <DashboardCharts data={chartData} />
              </div>

              {/* Data Table */}
              <div className="fade-in-up delay-200">
                <div className="efficiency-table-wrapper">
                  <Table
                    data={data}
                    columns={tableColumns}
                    totalEntries={totalItems}
                    currentPage={page}
                    pageSize={limit}
                    onPageChange={setPage}
                    onItemsPerPageChange={setLimit}
                    showActions={false}
                    onRowClick={(row) => setSelectedMachine(row)}
                  />
                </div>
              </div>
            </>
          )}
        </>
      )}

      {selectedMachine && (
        <DrilldownModal
          machine={selectedMachine}
          onClose={() => setSelectedMachine(null)}
        />
      )}

    </div>
  );
};

export default MachineEfficiency;
