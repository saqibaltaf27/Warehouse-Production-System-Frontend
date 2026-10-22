import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../../apis/axiosinstance';
import { API_ENDPOINTS } from '../../apis/endpoints';
import Table from '../../global-components/Table/Table';
import Button from '../../global-components/Button/Button';
import {
  IconPlus,
  IconEdit,
  IconSettings
} from '@tabler/icons-react';
import './ProductionPlanning.css';

const ExpandableMachineCell = ({ machineStr }) => {
  const [expanded, setExpanded] = useState(false);

  if (!machineStr) return <span>-</span>;

  let machines = [];
  try {
    const parsed = JSON.parse(machineStr);
    if (Array.isArray(parsed)) {
      machines = parsed.map(m => {
        if (typeof m === 'string') return { name: m };
        return { name: m.name || 'Unknown', qty: m.qty, hours: m.hours };
      });
    }
  } catch (e) {
    machines = machineStr.split(', ').map(m => ({ name: m }));
  }

  if (machines.length === 0) return <span>-</span>;

  const renderItem = (m) => {
    let text = m.name;
    if (m.qty || m.hours) {
      const parts = [];
      if (m.qty) parts.push(`Qty: ${m.qty}`);
      if (m.hours) parts.push(`Hrs: ${m.hours}`);
      text += ` (${parts.join(', ')})`;
    }
    return text;
  };

  if (machines.length === 1) {
    return <span>{renderItem(machines[0])}</span>;
  }

  return (
    <div>
      <div onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="expandable-cell-trigger">
        <IconSettings size={16} />
        {machines[0].name}
        {machines.length > 1 && (
          <span className="badge">+{machines.length - 1}</span>
        )}
      </div>
      {expanded && machines.length > 1 && (
        <div className="plan-employee-list expandable-cell-list">
          {machines.map((m, idx) => (
            <div key={idx} className="plan-employee-item">
              {renderItem(m)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Formatters ── */
const fmt = (n) => {
  if (n == null || isNaN(n)) return '0';
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
};

const fmtDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); // e.g., 1 Jan 2026
};

const ProductionPlanning = () => {
  const navigate = useNavigate();
  const [planData, setPlanData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const fetchProductionPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.PRODUCTION_PLANNING.GET_PLANS);
      if (res.data?.success) {
        setPlanData(res.data.data || []);
      }
    } catch (err) {
      console.error('Fetch Production Plans error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProductionPlans();
  }, [fetchProductionPlans]);

  const handleEditPlan = (plan) => {
    navigate('/production-plan/edit', { state: { plan } });
  };

  const handleViewPlan = (plan) => {
    navigate('/production-plan/view', { state: { plan, readOnly: true } });
  };

  const planColumns = [
    { header: 'Date', key: 'PlanDate', render: (r) => fmtDate(r.PlanDate) },
    { header: 'Line', key: 'Line' },
    { header: 'PO', key: 'PO' },
    { header: 'Planned Qty', key: 'PlannedQty', render: (r) => fmt(r.PlannedQty) },
    { header: 'Completed Qty', key: 'CmpltQty', render: (r) => fmt(r.CmpltQty) },
    { header: 'Produced Qty', key: 'ProductionQty', render: (r) => fmt(r.ProductionQty) },
    { header: 'Shift', key: 'Shift' },
    { header: 'Act. Manpower', key: 'ActualManpower' },
    { header: 'Prd %', key: 'PrdPercentage', render: (r) => r.PrdPercentage ? `${Number(r.PrdPercentage).toFixed(2)}%` : '-' },
    { header: 'Machine', key: 'Machine', render: (r) => <ExpandableMachineCell machineStr={r.Machine} /> },
    { header: 'Supervisor', key: 'Supervisor' },
    {
      header: 'Assign Employee',
      key: 'employees',
      render: (r) => {
        let count = 0;
        if (Array.isArray(r.jdItems)) {
          count = r.jdItems.length;
        } else if (r.Persons) {
          try {
            const parsed = JSON.parse(r.Persons);
            if (Array.isArray(parsed)) count = parsed.length;
          } catch (e) {}
        }
        return <span className="tabular-nums">{count}</span>;
      }
    },
    {
      header: 'Action', key: 'action', render: (r) => (
        <button
          type="button"
          className="plan-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleEditPlan(r);
          }}
        >
          <IconEdit size={16} />
          Edit
        </button>
      )
    }
  ];

  const paginatedPlanData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return planData.slice(start, start + pageSize);
  }, [planData, currentPage, pageSize]);

  return (
    <div className="production-planning-page fade-in-up layout-page-padding">
      <div className="planning-content fade-in-up delay-100">
        <div className="planning-section">
          <div className="planning-section-header">
            <Button variant="primary" icon={<IconPlus size={16} />} onClick={() => navigate('/production-plan/add')}>
              Create New Plan
            </Button>
          </div>
          <Table
            data={paginatedPlanData}
            columns={planColumns}
            totalEntries={planData.length}
            showActions={false}
            showPagination={true}
            isLoading={loading}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            onRowClick={handleViewPlan}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductionPlanning;
