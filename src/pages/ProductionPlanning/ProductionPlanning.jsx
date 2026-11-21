import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../context/permissioncheck';
import LineClearance from '../QC/LineClearance';
import Select from 'react-select';
import toast, { Toaster } from 'react-hot-toast';
import { axiosInstance } from '../../apis/axiosinstance';
import { API_ENDPOINTS } from '../../apis/endpoints';
import Table from '../../global-components/Table/Table';
import Button from '../../global-components/Button/Button';
import {
  IconPlus,
  IconEdit,
  IconSettings,
  IconSearch,
  IconRefresh,
  IconSend,
} from '@tabler/icons-react';
import './ProductionPlanning.css';
import '../ProductionOrders/ProductionOrders.css';
import '../ProductionOrders/SalesOrderModal.css';

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
  const { user } = useAuth();
  const { hasChildPermission } = usePermission();
  const qaPermission = hasChildPermission('Production', 'Production Plans', 'QA Permission Production');
  const isSuperAdmin = Boolean(user?.isSuperAdmin);
  const [seeAsQa, setSeeAsQa] = useState(false);
  const showQa = isSuperAdmin ? seeAsQa : qaPermission;

  const viewToggle = isSuperAdmin ? (
    <div className="po-filter-item">
      <label className="po-filter-label">&nbsp;</label>
      <label className="plan-view-toggle">
        <span>See as Production</span>
        <input type="checkbox" checked={seeAsQa} onChange={(event) => setSeeAsQa(event.target.checked)} />
        <span className="plan-view-switch" />
        <span>See as QA</span>
      </label>
    </div>
  ) : null;
  const [planData, setPlanData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupStaff, setGroupStaff] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [savingGroup, setSavingGroup] = useState(false);
  const [permissionPlan, setPermissionPlan] = useState(null);
  const [permissionForm, setPermissionForm] = useState({ type: '', area: '' });
  const [sendingPermission, setSendingPermission] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lineFilter, setLineFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

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

  const openGroupModal = async () => {
    setShowGroupModal(true);
    setGroupName('');
    setGroupStaff([]);
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.STAFF.GET_STAFF, { params: { limit: 1000 } });
      const active = (res.data?.data || []).filter((s) => s.Status === 1 || s.Status === true);
      setStaffOptions(active.map((s) => ({
        value: s.StaffID,
        label: s.Name,
        designation: s.Designation || '',
      })));
    } catch (err) {
      toast.error('Failed to load employees');
    }
  };

  const saveGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Group name is required');
      return;
    }
    if (!groupStaff.length) {
      toast.error('Select at least one employee');
      return;
    }
    setSavingGroup(true);
    try {
      const res = await axiosInstance.post(API_ENDPOINTS.PRODUCTION_PLANNING.STAFF_GROUPS, {
        groupName: groupName.trim(),
        staffIds: groupStaff.map((s) => s.value),
      });
      if (res.data?.success) {
        toast.success('Staff group created');
        setShowGroupModal(false);
      } else {
        toast.error(res.data?.message || 'Failed to create group');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create group');
    } finally {
      setSavingGroup(false);
    }
  };

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
      header: 'Status',
      key: 'ClearanceStatus',
      render: (r) => {
        const status = r.ClearanceStatus || 'Plan';
        return <span className={`plan-status plan-status--${status.toLowerCase().replace(/\s+/g, '-')}`}>{status}</span>;
      },
    },
    {
      header: 'Action', key: 'action', render: (r) => (
        <div className="plan-action-group">
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
          {String(r.ClearanceStatus || 'Plan').toLowerCase() === 'plan' && (
            <button
              type="button"
              className="plan-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                setPermissionPlan(r);
                setPermissionForm({ type: '', area: '' });
              }}
            >
              <IconSend size={16} />
              Send line clearance request
            </button>
          )}
        </div>
      )
    }
  ];

  const lineOptions = useMemo(() => {
    const lines = [...new Set(planData.map((plan) => plan.Line).filter(Boolean))];
    return lines.sort();
  }, [planData]);

  const filteredPlans = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return planData.filter((plan) => {
      const planDay = plan.PlanDate ? String(plan.PlanDate).slice(0, 10) : '';
      if (lineFilter && plan.Line !== lineFilter) return false;
      if (fromDate && planDay && planDay < fromDate) return false;
      if (toDate && planDay && planDay > toDate) return false;
      if (!term) return true;
      const haystack = [plan.Line, plan.PO, plan.Shift, plan.Supervisor, fmtDate(plan.PlanDate)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [planData, searchQuery, lineFilter, fromDate, toDate]);

  const paginatedPlanData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPlans.slice(start, start + pageSize);
  }, [filteredPlans, currentPage, pageSize]);

  const hasActiveFilters = Boolean(searchQuery || lineFilter || fromDate || toDate);

  if (showQa) {
    return (
      <div className="production-planning-page fade-in-up layout-page-padding">
        <LineClearance toolbarExtra={viewToggle} />
      </div>
    );
  }

  return (
    <div className="production-planning-page fade-in-up layout-page-padding">
      <div className="planning-content fade-in-up delay-100">
        <div className="planning-section">
          <div className="planning-section-header">
            <Button variant="outline" onClick={openGroupModal}>
              Create Staff Group
            </Button>
            <Button variant="primary" icon={<IconPlus size={16} />} onClick={() => navigate('/production-plan/add')}>
              Create New Plan
            </Button>
          </div>
          <div className="po-filter-toolbar-card">
            <div className="po-filter-toolbar-grid">
              <div className="po-filter-item po-filter-search-box">
                <label className="po-filter-label">Search</label>
                <div style={{ position: 'relative' }}>
                  <IconSearch size={18} className="po-filter-search-icon" />
                  <input
                    type="text"
                    placeholder="Search line, PO, shift..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="po-filter-search-input"
                  />
                </div>
              </div>
              <div className="po-filter-item">
                <label className="po-filter-label">Line</label>
                <select
                  className="po-filter-date-input"
                  value={lineFilter}
                  onChange={(e) => {
                    setLineFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All lines</option>
                  {lineOptions.map((line) => (
                    <option key={line} value={line}>{line}</option>
                  ))}
                </select>
              </div>
              <div className="po-filter-item">
                <label className="po-filter-label">From</label>
                <input
                  type="date"
                  className="po-filter-date-input"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="po-filter-item">
                <label className="po-filter-label">To</label>
                <input
                  type="date"
                  className="po-filter-date-input"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="po-filter-item">
                <label className="po-filter-label">&nbsp;</label>
                <button
                  type="button"
                  className="po-filter-reset-btn"
                  disabled={!hasActiveFilters}
                  onClick={() => {
                    setSearchQuery('');
                    setLineFilter('');
                    setFromDate('');
                    setToDate('');
                    setCurrentPage(1);
                  }}
                >
                  <IconRefresh size={16} />
                  Reset
                </button>
              </div>
              {viewToggle}
            </div>
          </div>
          <Toaster position="top-right" />
          {permissionPlan && createPortal(
            <div className="so-modal-overlay" onMouseDown={() => setPermissionPlan(null)}>
              <div className="permission-request-modal" onMouseDown={(e) => e.stopPropagation()}>
                <div className="permission-request-head">
                  <h3>Send Request for Permission</h3>
                  <button type="button" className="permission-request-close" onClick={() => setPermissionPlan(null)} aria-label="Close">×</button>
                </div>
                <div className="permission-request-summary">
                  <div>
                    <span>Plan ID</span>
                    <strong>{permissionPlan.Id ?? '—'}</strong>
                  </div>
                  <div>
                    <span>PO</span>
                    <strong>
                      {[permissionPlan.PO, permissionPlan.ProductName].filter(Boolean).join(' — ') || '—'}
                    </strong>
                  </div>
                </div>
                <div className="permission-request-fields">
                  <label>
                    Type
                    <select
                      value={permissionForm.type}
                      onChange={(e) => setPermissionForm((prev) => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="">Select type</option>
                      <option>Raw Material</option>
                      <option>Primary Packaging</option>
                      <option>Production</option>
                      <option>Final Packaging</option>
                    </select>
                  </label>
                  <label>
                    Area
                    <select
                      value={permissionForm.area}
                      onChange={(e) => setPermissionForm((prev) => ({ ...prev, area: e.target.value }))}
                    >
                      <option value="">Select area</option>
                      <option>Clean Room 1</option>
                      <option>Clean Room 2</option>
                      <option>Raw Material WH</option>
                      <option>Other</option>
                    </select>
                  </label>
                </div>
                <div className="permission-request-actions">
                  <Button type="button" variant="outline" onClick={() => setPermissionPlan(null)}>Cancel</Button>
                  <Button
                    type="button"
                    variant="primary"
                    disabled={!permissionForm.type || !permissionForm.area || sendingPermission}
                    isLoading={sendingPermission}
                    onClick={async () => {
                      try {
                        setSendingPermission(true);
                        const res = await axiosInstance.post(API_ENDPOINTS.PRODUCTION_PLANNING.LINE_CLEARANCE, {
                          planId: permissionPlan.Id,
                          requestType: permissionForm.type,
                          area: permissionForm.area,
                          createdBy: user?.empId || user?.EmpID || user?.id || null,
                        });
                        if (!res.data?.success) {
                          toast.error(res.data?.message || 'Failed to send request');
                          return;
                        }
                        toast.success('Line clearance requested');
                        setPermissionPlan(null);
                        fetchProductionPlans();
                      } catch (error) {
                        toast.error(error.response?.data?.message || 'Failed to send request');
                      } finally {
                        setSendingPermission(false);
                      }
                    }}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>,
            document.body,
          )}
          {showGroupModal && createPortal(
            <div className="so-modal-overlay" onMouseDown={() => setShowGroupModal(false)}>
              <div className="staff-group-modal" onMouseDown={(e) => e.stopPropagation()}>
                <h3>Create Staff Group</h3>
                <label>Group name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name"
                />
                <label>Employees</label>
                <Select
                  isMulti
                  closeMenuOnSelect={false}
                  hideSelectedOptions={false}
                  options={staffOptions}
                  value={groupStaff}
                  onChange={(selected) => setGroupStaff(selected || [])}
                  placeholder="Select employees"
                  menuPortalTarget={document.body}
                  filterOption={(option, rawInput) => {
                    if (!rawInput) return true;
                    const term = rawInput.toLowerCase();
                    return String(option.data.label || '').toLowerCase().includes(term)
                      || String(option.data.designation || '').toLowerCase().includes(term);
                  }}
                  formatOptionLabel={(option, { context }) => {
                    if (context === 'value') return option.label;
                    const checked = groupStaff.some((person) => person.value === option.value);
                    return (
                      <div className="staff-group-option">
                        <input type="checkbox" checked={checked} readOnly />
                        <span>
                          <span>{option.label}</span>
                          {option.designation && <small>{option.designation}</small>}
                        </span>
                      </div>
                    );
                  }}
                  styles={{ menuPortal: (base) => ({ ...base, zIndex: 10001 }) }}
                />
                <div className="staff-group-modal-actions">
                  <Button variant="outline" onClick={() => setShowGroupModal(false)}>Cancel</Button>
                  <Button variant="primary" onClick={saveGroup} disabled={savingGroup}>
                    {savingGroup ? 'Saving...' : 'Save Group'}
                  </Button>
                </div>
              </div>
            </div>,
            document.body
          )}
          <Table
            data={paginatedPlanData}
            columns={planColumns}
            totalEntries={filteredPlans.length}
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
