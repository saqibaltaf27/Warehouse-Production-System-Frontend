import React, { useState, useMemo } from 'react';
import {
  IconTool,
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
  IconCash,
  IconEngine,
  IconBolt,
  IconShieldCheck,
  IconFileSpreadsheet
} from '@tabler/icons-react';
import { costingService, OVERHEAD_SUBCATEGORIES, formatCurrency } from './costingStorage';

export default function FactoryOverheadView({ initialSub = 'repair-maintenance', onSubChange }) {
  const [activeSub, setActiveSub] = useState(initialSub || 'all');
  const [overheadData, setOverheadData] = useState(() => costingService.getOverheads());
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State
  const [formState, setFormState] = useState({
    title: '',
    subCategory: initialSub && initialSub !== 'all' ? initialSub : 'repair-maintenance',
    department: 'Plant Engineering',
    referenceNumber: '',
    vendor: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    remarks: ''
  });

  const handleSubSwitch = (subId) => {
    setActiveSub(subId);
    if (onSubChange) onSubChange(subId);
  };

  // Filtered dataset
  const filteredData = useMemo(() => {
    return overheadData.filter(item => {
      const matchCategory = activeSub === 'all' || item.subCategory === activeSub;
      const matchSearch =
        !searchTerm ||
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [overheadData, activeSub, searchTerm]);

  // Aggregate statistics
  const stats = useMemo(() => {
    const totalAll = overheadData.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const subset = activeSub === 'all' ? overheadData : overheadData.filter(i => i.subCategory === activeSub);
    const categoryTotal = subset.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const categoryEntries = subset.length;
    const utilitiesCost = overheadData.filter(i => i.subCategory === 'utilities').reduce((acc, c) => acc + Number(c.amount || 0), 0);
    const generatorCost = overheadData.filter(i => i.subCategory === 'generator-diesel').reduce((acc, c) => acc + Number(c.amount || 0), 0);
    return { totalAll, categoryTotal, categoryEntries, utilitiesCost, generatorCost };
  }, [overheadData, activeSub]);

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormState({
        title: item.title || '',
        subCategory: item.subCategory || 'repair-maintenance',
        department: item.department || '',
        referenceNumber: item.referenceNumber || '',
        vendor: item.vendor || '',
        amount: item.amount ?? '',
        date: item.date || new Date().toISOString().slice(0, 10),
        remarks: item.remarks || ''
      });
    } else {
      setEditingItem(null);
      setFormState({
        title: '',
        subCategory: activeSub === 'all' ? 'repair-maintenance' : activeSub,
        department: 'Plant Operations',
        referenceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        vendor: '',
        amount: '',
        date: new Date().toISOString().slice(0, 10),
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formState.title.trim()) {
      alert('Please enter expense title or description');
      return;
    }

    const payload = {
      ...(editingItem ? { id: editingItem.id } : {}),
      title: formState.title.trim(),
      subCategory: formState.subCategory,
      department: formState.department,
      referenceNumber: formState.referenceNumber.trim(),
      vendor: formState.vendor.trim(),
      amount: Number(formState.amount) || 0,
      date: formState.date,
      remarks: formState.remarks
    };

    const updated = costingService.saveOverhead(payload);
    setOverheadData([...updated]);
    closeModal();
  };

  const handleDelete = (id, title) => {
    if (window.confirm(`Are you sure you want to remove overhead record "${title}"?`)) {
      const updated = costingService.deleteOverhead(id);
      setOverheadData([...updated]);
    }
  };

  return (
    <div className="costing-view-container">
      {/* Subcategory Navigation Row (8 subcategories) */}
      <div className="costing-subnav-row overhead-tabs-row">
        <div className="costing-subnav-tabs horizontal-scroll-tabs">
          <button
            type="button"
            className={`subnav-tab-btn ${activeSub === 'all' ? 'active' : ''}`}
            onClick={() => handleSubSwitch('all')}
          >
            All Factory Overheads
          </button>
          {OVERHEAD_SUBCATEGORIES.map(cat => (
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
          <span>Add Overhead Entry</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="costing-kpi-grid">
        <div className="costing-stat-card">
          <div className="stat-card-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <IconCash size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-label">
              {activeSub === 'all' ? 'Total Factory Overheads' : OVERHEAD_SUBCATEGORIES.find(c => c.id === activeSub)?.label}
            </span>
            <h3 className="stat-value">{formatCurrency(stats.categoryTotal)}</h3>
            <span className="stat-hint">{stats.categoryEntries} active ledger entries</span>
          </div>
        </div>

        <div className="costing-stat-card">
          <div className="stat-card-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <IconBolt size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-label">Power & Utilities</span>
            <h3 className="stat-value">{formatCurrency(stats.utilitiesCost)}</h3>
            <span className="stat-hint">Grid electricity & gas bills</span>
          </div>
        </div>

        <div className="costing-stat-card">
          <div className="stat-card-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <IconEngine size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-label">Generator Fuel & Diesel</span>
            <h3 className="stat-value">{formatCurrency(stats.generatorCost)}</h3>
            <span className="stat-hint">Backup power consumption</span>
          </div>
        </div>

        <div className="costing-stat-card">
          <div className="stat-card-icon" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
            <IconShieldCheck size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-label">Total Overheads Pool</span>
            <h3 className="stat-value">{formatCurrency(stats.totalAll)}</h3>
            <span className="stat-hint">Monthly cumulative plant opex</span>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="costing-table-card">
        <div className="table-card-header">
          <div className="table-header-left">
            <h3 className="table-title">
              {activeSub === 'all'
                ? 'All Factory Overheads (8 Categories)'
                : `${OVERHEAD_SUBCATEGORIES.find(c => c.id === activeSub)?.label} Expenses`}
            </h3>
            <span className="table-subtitle">
              {filteredData.length} records • Routine plant operating expenditures
            </span>
          </div>

          <div className="table-header-right">
            <div className="search-box">
              <IconSearch size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search expense, invoice, vendor, area..."
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
                <th>Voucher #</th>
                <th>Expense Description</th>
                <th>Category</th>
                <th>Plant Section / Dept</th>
                <th>Vendor / Payee</th>
                <th>Amount (PKR)</th>
                <th>Date</th>
                <th>Notes / Specs</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-table-cell">
                    <div className="empty-state-box">
                      <IconFileSpreadsheet size={36} />
                      <p>No factory overhead records found for this category.</p>
                      <button
                        type="button"
                        className="costing-outline-btn"
                        onClick={() => openModal()}
                      >
                        Add New Overhead Entry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.id}>
                    <td><span className="badge-code">{row.referenceNumber || row.id}</span></td>
                    <td className="fw-500">{row.title}</td>
                    <td>
                      <span className={`pill-category pill-overhead-${row.subCategory}`}>
                        {OVERHEAD_SUBCATEGORIES.find(c => c.id === row.subCategory)?.label || row.subCategory}
                      </span>
                    </td>
                    <td><span className="text-muted">{row.department}</span></td>
                    <td>{row.vendor || 'Direct / Bank'}</td>
                    <td className="fw-600 font-tabular text-primary">
                      {formatCurrency(row.amount)}
                    </td>
                    <td>{row.date}</td>
                    <td><small className="text-muted">{row.remarks || '—'}</small></td>
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
                          onClick={() => handleDelete(row.id, row.title)}
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

      {/* Overhead Modal */}
      {isModalOpen && (
        <div className="costing-modal-overlay">
          <div className="costing-modal-container">
            <div className="costing-modal-header">
              <div className="modal-title-box">
                <div className="modal-title-icon">
                  <IconTool size={20} />
                </div>
                <div>
                  <h3 className="modal-title">
                    {editingItem ? 'Edit Overhead Expense' : 'Log Factory Overhead Expense'}
                  </h3>
                  <span className="modal-subtitle">
                    Record plant maintenance, utilities, fuel, regulatory fees, or depreciation
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
                  <label>Expense Title / Description <span className="req">*</span></label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder="e.g. Monthly HVAC Filter Replacement / Diesel Purchase (2,000L)"
                    value={formState.title}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field">
                  <label>Overhead Sub-Category</label>
                  <select
                    name="subCategory"
                    value={formState.subCategory}
                    onChange={handleFormChange}
                  >
                    {OVERHEAD_SUBCATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Plant Section / Department</label>
                  <input
                    type="text"
                    name="department"
                    placeholder="e.g. Cleanroom HVAC / Generator Room / Admin Office"
                    value={formState.department}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field">
                  <label>Voucher / Invoice / Ref #</label>
                  <input
                    type="text"
                    name="referenceNumber"
                    placeholder="e.g. INV-2026-881"
                    value={formState.referenceNumber}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field">
                  <label>Vendor / Service Provider / Authority</label>
                  <input
                    type="text"
                    name="vendor"
                    placeholder="e.g. Shell Pakistan / LESCO / DRAP Islamabad"
                    value={formState.vendor}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field">
                  <label>Expense Amount (PKR) <span className="req">*</span></label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    placeholder="0"
                    name="amount"
                    value={formState.amount}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field">
                  <label>Expense Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formState.date}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field full-width">
                  <label>Remarks & Specifications</label>
                  <textarea
                    rows={2}
                    name="remarks"
                    placeholder="Consumption units (kWh, Liters), depreciation asset code, DRAP registration details..."
                    value={formState.remarks}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              {/* Total Calculation Preview */}
              <div className="modal-calculation-banner">
                <span className="calc-banner-label">Payable Amount:</span>
                <span className="calc-banner-value">{formatCurrency(formState.amount || 0)}</span>
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
                  <span>{editingItem ? 'Update Expense' : 'Save Overhead Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
