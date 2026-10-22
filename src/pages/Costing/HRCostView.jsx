import React, { useState, useMemo } from 'react';
import {
  IconUsers,
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
  IconCash,
  IconTrendingUp,
  IconBuildingSkyscraper,
  IconFileSpreadsheet
} from '@tabler/icons-react';
import { costingService, HR_SUBCATEGORIES, formatCurrency } from './costingStorage';

export default function HRCostView({ initialSub = 'management', onSubChange }) {
  const [activeSub, setActiveSub] = useState(initialSub || 'management');
  const [hrData, setHrData] = useState(() => costingService.getHRCosts());
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form state
  const [formState, setFormState] = useState({
    role: '',
    subCategory: initialSub || 'management',
    department: 'Management',
    monthYear: new Date().toISOString().slice(0, 7),
    baseSalary: '',
    allowances: '',
    overtimeBonuses: '',
    headcount: 1,
    status: 'Approved',
    remarks: ''
  });

  const handleSubSwitch = (subId) => {
    setActiveSub(subId);
    if (onSubChange) onSubChange(subId);
  };

  // Filtered list
  const filteredData = useMemo(() => {
    return hrData.filter(item => {
      const matchCategory = activeSub === 'all' || item.subCategory === activeSub;
      const matchSearch =
        !searchTerm ||
        item.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [hrData, activeSub, searchTerm]);

  // Aggregate statistics for active subcategory
  const stats = useMemo(() => {
    const subset = activeSub === 'all' ? hrData : hrData.filter(i => i.subCategory === activeSub);
    const total = subset.reduce((acc, curr) => acc + (Number(curr.totalCost) || 0), 0);
    const headcount = subset.reduce((acc, curr) => acc + (Number(curr.headcount) || 0), 0);
    const base = subset.reduce((acc, curr) => acc + (Number(curr.baseSalary) || 0), 0);
    const other = subset.reduce((acc, curr) => acc + (Number(curr.allowances || 0) + Number(curr.overtimeBonuses || 0)), 0);
    return { total, headcount, base, other };
  }, [hrData, activeSub]);

  // Open modal for Create / Edit
  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormState({
        role: item.role || '',
        subCategory: item.subCategory || activeSub,
        department: item.department || '',
        monthYear: item.monthYear || new Date().toISOString().slice(0, 7),
        baseSalary: item.baseSalary ?? '',
        allowances: item.allowances ?? '',
        overtimeBonuses: item.overtimeBonuses ?? '',
        headcount: item.headcount ?? 1,
        status: item.status || 'Approved',
        remarks: item.remarks || ''
      });
    } else {
      setEditingItem(null);
      setFormState({
        role: '',
        subCategory: activeSub === 'all' ? 'management' : activeSub,
        department: activeSub === 'direct-hr' ? 'Human Resources' : activeSub === 'quality' ? 'Quality Assurance' : 'Production Management',
        monthYear: new Date().toISOString().slice(0, 7),
        baseSalary: '',
        allowances: '',
        overtimeBonuses: '',
        headcount: 1,
        status: 'Approved',
        remarks: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Auto-calculated total cost in modal
  const computedModalTotal = useMemo(() => {
    const base = parseFloat(formState.baseSalary) || 0;
    const allow = parseFloat(formState.allowances) || 0;
    const ot = parseFloat(formState.overtimeBonuses) || 0;
    return base + allow + ot;
  }, [formState.baseSalary, formState.allowances, formState.overtimeBonuses]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formState.role.trim()) {
      alert('Please specify the role / designation');
      return;
    }

    const payload = {
      ...(editingItem ? { id: editingItem.id } : {}),
      role: formState.role.trim(),
      subCategory: formState.subCategory,
      department: formState.department,
      monthYear: formState.monthYear,
      baseSalary: Number(formState.baseSalary) || 0,
      allowances: Number(formState.allowances) || 0,
      overtimeBonuses: Number(formState.overtimeBonuses) || 0,
      headcount: Number(formState.headcount) || 1,
      totalCost: computedModalTotal,
      status: formState.status,
      remarks: formState.remarks,
      createdAt: editingItem?.createdAt || new Date().toISOString().slice(0, 10)
    };

    const updated = costingService.saveHRCost(payload);
    setHrData([...updated]);
    closeModal();
  };

  const handleDelete = (id, role) => {
    if (window.confirm(`Are you sure you want to remove HR record for "${role}"?`)) {
      const updated = costingService.deleteHRCost(id);
      setHrData([...updated]);
    }
  };

  return (
    <div className="costing-view-container">
      {/* Header and Subcategory Switcher */}
      <div className="costing-subnav-row">
        <div className="costing-subnav-tabs">
          <button
            type="button"
            className={`subnav-tab-btn ${activeSub === 'all' ? 'active' : ''}`}
            onClick={() => handleSubSwitch('all')}
          >
            All HR Categories
          </button>
          {HR_SUBCATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              className={`subnav-tab-btn ${activeSub === cat.id ? 'active' : ''}`}
              onClick={() => handleSubSwitch(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="costing-primary-btn"
          onClick={() => openModal()}
        >
          <IconPlus size={18} />
          <span>Add HR Cost Entry</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="costing-kpi-grid">
        <div className="costing-stat-card">
          <div className="stat-card-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <IconCash size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-label">Total Allocated Cost</span>
            <h3 className="stat-value">{formatCurrency(stats.total)}</h3>
            <span className="stat-hint">{activeSub === 'all' ? 'All HR streams' : HR_SUBCATEGORIES.find(c => c.id === activeSub)?.label}</span>
          </div>
        </div>

        <div className="costing-stat-card">
          <div className="stat-card-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <IconUsers size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-label">Active Headcount</span>
            <h3 className="stat-value">{stats.headcount}</h3>
            <span className="stat-hint">Approved Personnel</span>
          </div>
        </div>

        <div className="costing-stat-card">
          <div className="stat-card-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <IconBuildingSkyscraper size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-label">Base Salaries Total</span>
            <h3 className="stat-value">{formatCurrency(stats.base)}</h3>
            <span className="stat-hint">Excluding perks/bonuses</span>
          </div>
        </div>

        <div className="costing-stat-card">
          <div className="stat-card-icon" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
            <IconTrendingUp size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-label">Allowances & Overtime</span>
            <h3 className="stat-value">{formatCurrency(stats.other)}</h3>
            <span className="stat-hint">Variable payroll items</span>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="costing-table-card">
        <div className="table-card-header">
          <div className="table-header-left">
            <h3 className="table-title">
              {activeSub === 'all'
                ? 'All HR Personnel & Payroll Breakdown'
                : `${HR_SUBCATEGORIES.find(c => c.id === activeSub)?.label} Records`}
            </h3>
            <span className="table-subtitle">
              {filteredData.length} records found • Local simulated storage
            </span>
          </div>

          <div className="table-header-right">
            <div className="search-box">
              <IconSearch size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search role, dept, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchTerm('')}
                >
                  <IconX size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="costing-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Role / Designation</th>
                <th>Department</th>
                <th>Sub-Category</th>
                <th>Month</th>
                <th>Headcount</th>
                <th>Base Salary</th>
                <th>Allowances / OT</th>
                <th>Total Cost</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="empty-table-cell">
                    <div className="empty-state-box">
                      <IconFileSpreadsheet size={36} />
                      <p>No HR cost records found for the selected filter.</p>
                      <button
                        type="button"
                        className="costing-outline-btn"
                        onClick={() => openModal()}
                      >
                        Add First Entry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.id}>
                    <td><span className="badge-code">{row.id}</span></td>
                    <td className="fw-500">{row.role}</td>
                    <td><span className="text-muted">{row.department}</span></td>
                    <td>
                      <span className={`pill-category pill-${row.subCategory}`}>
                        {HR_SUBCATEGORIES.find(c => c.id === row.subCategory)?.label || row.subCategory}
                      </span>
                    </td>
                    <td>{row.monthYear}</td>
                    <td><span className="headcount-badge">{row.headcount}</span></td>
                    <td>{formatCurrency(row.baseSalary)}</td>
                    <td>{formatCurrency((row.allowances || 0) + (row.overtimeBonuses || 0))}</td>
                    <td className="fw-600 font-tabular text-primary">
                      {formatCurrency(row.totalCost)}
                    </td>
                    <td>
                      <span className={`status-badge status-${row.status?.toLowerCase()}`}>
                        {row.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-buttons-group">
                        <button
                          type="button"
                          className="table-action-icon edit-icon"
                          title="Edit"
                          onClick={() => openModal(row)}
                        >
                          <IconEdit size={16} />
                        </button>
                        <button
                          type="button"
                          className="table-action-icon delete-icon"
                          title="Delete"
                          onClick={() => handleDelete(row.id, row.role)}
                        >
                          <IconTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Entry / Edit Modal */}
      {isModalOpen && (
        <div className="costing-modal-overlay">
          <div className="costing-modal-container">
            <div className="costing-modal-header">
              <div className="modal-title-box">
                <div className="modal-title-icon">
                  <IconUsers size={20} />
                </div>
                <div>
                  <h3 className="modal-title">
                    {editingItem ? 'Edit HR Cost Record' : 'New HR Cost Entry'}
                  </h3>
                  <span className="modal-subtitle">
                    Record payroll, department allocation, and perks
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={closeModal}
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="costing-modal-form">
              <div className="form-grid-2">
                <div className="form-field full-width">
                  <label>Role / Position Title <span className="req">*</span></label>
                  <input
                    type="text"
                    name="role"
                    required
                    placeholder="e.g. Senior Formulation Scientist / Shift Incharge"
                    value={formState.role}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field">
                  <label>HR Sub-Category</label>
                  <select
                    name="subCategory"
                    value={formState.subCategory}
                    onChange={handleFormChange}
                  >
                    {HR_SUBCATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Department / Section</label>
                  <input
                    type="text"
                    name="department"
                    placeholder="e.g. Production / QA / Executive"
                    value={formState.department}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field">
                  <label>Allocation Month</label>
                  <input
                    type="month"
                    name="monthYear"
                    value={formState.monthYear}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field">
                  <label>Headcount (Persons)</label>
                  <input
                    type="number"
                    min="1"
                    name="headcount"
                    value={formState.headcount}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field">
                  <label>Base Salary (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="0"
                    name="baseSalary"
                    value={formState.baseSalary}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field">
                  <label>Allowances & Perks (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    placeholder="0"
                    name="allowances"
                    value={formState.allowances}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field">
                  <label>Overtime & Bonuses (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    placeholder="0"
                    name="overtimeBonuses"
                    value={formState.overtimeBonuses}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formState.status}
                    onChange={handleFormChange}
                  >
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending Review</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>

                <div className="form-field full-width">
                  <label>Remarks / Notes</label>
                  <textarea
                    rows={2}
                    name="remarks"
                    placeholder="Provide any context on payroll cost center, grade level or overtime rationale..."
                    value={formState.remarks}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              {/* Total Calculation Preview */}
              <div className="modal-calculation-banner">
                <span className="calc-banner-label">Computed Total HR Cost:</span>
                <span className="calc-banner-value">{formatCurrency(computedModalTotal)}</span>
              </div>

              <div className="costing-modal-footer">
                <button
                  type="button"
                  className="costing-cancel-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="costing-primary-btn"
                >
                  <IconCheck size={18} />
                  <span>{editingItem ? 'Update HR Record' : 'Save HR Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
