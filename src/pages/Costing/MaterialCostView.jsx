import React, { useState, useMemo } from 'react';
import {
  IconPackage,
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
  IconCash,
  IconScale,
  IconBarcode,
  IconBuildingWarehouse,
  IconFileSpreadsheet
} from '@tabler/icons-react';
import { costingService, MATERIAL_CATEGORIES, formatCurrency } from './costingStorage';

export default function MaterialCostView() {
  const [materialData, setMaterialData] = useState(() => costingService.getMaterialCosts());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State
  const [formState, setFormState] = useState({
    materialName: '',
    materialCode: '',
    category: 'Raw Material',
    batchNumber: '',
    quantity: '',
    uom: 'kg',
    unitRate: '',
    supplier: '',
    date: new Date().toISOString().slice(0, 10),
    remarks: ''
  });

  // Filtered dataset
  const filteredData = useMemo(() => {
    return materialData.filter(item => {
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchSearch =
        !searchTerm ||
        item.materialName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.materialCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [materialData, selectedCategory, searchTerm]);

  // Aggregate stats
  const stats = useMemo(() => {
    const subset = selectedCategory === 'all' ? materialData : materialData.filter(i => i.category === selectedCategory);
    const totalCost = subset.reduce((acc, curr) => acc + (Number(curr.totalCost) || 0), 0);
    const totalQty = subset.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
    const batchCount = new Set(subset.map(i => i.batchNumber).filter(Boolean)).size;
    const itemsCount = subset.length;
    return { totalCost, totalQty, batchCount, itemsCount };
  }, [materialData, selectedCategory]);

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormState({
        materialName: item.materialName || '',
        materialCode: item.materialCode || '',
        category: item.category || 'Raw Material',
        batchNumber: item.batchNumber || '',
        quantity: item.quantity ?? '',
        uom: item.uom || 'kg',
        unitRate: item.unitRate ?? '',
        supplier: item.supplier || '',
        date: item.date || new Date().toISOString().slice(0, 10),
        remarks: item.remarks || ''
      });
    } else {
      setEditingItem(null);
      setFormState({
        materialName: '',
        materialCode: '',
        category: selectedCategory === 'all' ? 'Raw Material' : selectedCategory,
        batchNumber: '',
        quantity: '',
        uom: 'kg',
        unitRate: '',
        supplier: '',
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

  const computedModalTotal = useMemo(() => {
    const qty = parseFloat(formState.quantity) || 0;
    const rate = parseFloat(formState.unitRate) || 0;
    return qty * rate;
  }, [formState.quantity, formState.unitRate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formState.materialName.trim()) {
      alert('Please specify the material name');
      return;
    }

    const payload = {
      ...(editingItem ? { id: editingItem.id } : {}),
      materialName: formState.materialName.trim(),
      materialCode: formState.materialCode.trim(),
      category: formState.category,
      batchNumber: formState.batchNumber.trim(),
      quantity: Number(formState.quantity) || 0,
      uom: formState.uom,
      unitRate: Number(formState.unitRate) || 0,
      totalCost: computedModalTotal,
      supplier: formState.supplier.trim(),
      date: formState.date,
      remarks: formState.remarks
    };

    const updated = costingService.saveMaterialCost(payload);
    setMaterialData([...updated]);
    closeModal();
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to remove material cost entry for "${name}"?`)) {
      const updated = costingService.deleteMaterialCost(id);
      setMaterialData([...updated]);
    }
  };

  return (
    <div className="costing-view-container">
      {/* Category selector row */}
      <div className="costing-subnav-row">
        <div className="costing-subnav-tabs">
          <button
            type="button"
            className={`subnav-tab-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Categories
          </button>
          {MATERIAL_CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              className={`subnav-tab-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="costing-primary-btn"
          onClick={() => openModal()}
        >
          <IconPlus size={18} />
          <span>Add Material Cost</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="costing-kpi-grid">
        <div className="costing-stat-card">
          <div className="stat-card-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <IconCash size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-label">Total Material Cost</span>
            <h3 className="stat-value">{formatCurrency(stats.totalCost)}</h3>
            <span className="stat-hint">{selectedCategory === 'all' ? 'All active inventories' : selectedCategory}</span>
          </div>
        </div>

        <div className="costing-stat-card">
          <div className="stat-card-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <IconScale size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-label">Total Dispatched / Used</span>
            <h3 className="stat-value">{stats.totalQty.toLocaleString()} units</h3>
            <span className="stat-hint">Aggregated across materials</span>
          </div>
        </div>

        <div className="costing-stat-card">
          <div className="stat-card-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <IconBarcode size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-label">Production Batches Tracked</span>
            <h3 className="stat-value">{stats.batchCount}</h3>
            <span className="stat-hint">Active batch runs</span>
          </div>
        </div>

        <div className="costing-stat-card">
          <div className="stat-card-icon" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
            <IconBuildingWarehouse size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-label">Material Line Items</span>
            <h3 className="stat-value">{stats.itemsCount}</h3>
            <span className="stat-hint">SKUs / Reagents listed</span>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="costing-table-card">
        <div className="table-card-header">
          <div className="table-header-left">
            <h3 className="table-title">
              {selectedCategory === 'all'
                ? 'All Material Consumption & Invoicing Records'
                : `${selectedCategory} Records`}
            </h3>
            <span className="table-subtitle">
              {filteredData.length} entries registered • Automatic unit rate computation
            </span>
          </div>

          <div className="table-header-right">
            <div className="search-box">
              <IconSearch size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search material, code, batch, supplier..."
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
                <th>Item ID</th>
                <th>Material Description</th>
                <th>Category</th>
                <th>Batch / Lot #</th>
                <th>Quantity</th>
                <th>Unit Rate</th>
                <th>Total Cost</th>
                <th>Supplier / Vendor</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="empty-table-cell">
                    <div className="empty-state-box">
                      <IconFileSpreadsheet size={36} />
                      <p>No material cost records found for the filter criteria.</p>
                      <button
                        type="button"
                        className="costing-outline-btn"
                        onClick={() => openModal()}
                      >
                        Add First Material Record
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.id}>
                    <td><span className="badge-code">{row.materialCode || row.id}</span></td>
                    <td className="fw-500">
                      <div>{row.materialName}</div>
                      {row.remarks && <small className="text-muted">{row.remarks}</small>}
                    </td>
                    <td>
                      <span className={`pill-category pill-material-${row.category?.toLowerCase().replace(/\s+/g, '-')}`}>
                        {row.category}
                      </span>
                    </td>
                    <td><span className="batch-badge">{row.batchNumber || 'N/A'}</span></td>
                    <td className="font-tabular">
                      {row.quantity?.toLocaleString()} <span className="text-muted">{row.uom}</span>
                    </td>
                    <td className="font-tabular">{formatCurrency(row.unitRate)}/{row.uom}</td>
                    <td className="fw-600 font-tabular text-primary">
                      {formatCurrency(row.totalCost)}
                    </td>
                    <td><span className="text-muted">{row.supplier || 'In-House'}</span></td>
                    <td>{row.date}</td>
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
                          onClick={() => handleDelete(row.id, row.materialName)}
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

      {/* Material Cost Modal */}
      {isModalOpen && (
        <div className="costing-modal-overlay">
          <div className="costing-modal-container">
            <div className="costing-modal-header">
              <div className="modal-title-box">
                <div className="modal-title-icon">
                  <IconPackage size={20} />
                </div>
                <div>
                  <h3 className="modal-title">
                    {editingItem ? 'Edit Material Cost Entry' : 'Record New Material Cost'}
                  </h3>
                  <span className="modal-subtitle">
                    Enter consumption rate, batch lot, and supplier valuation
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
                <div className="form-field">
                  <label>Material Name / Description <span className="req">*</span></label>
                  <input
                    type="text"
                    name="materialName"
                    required
                    placeholder="e.g. Paracetamol Micronized BP / Printed Alu Foil"
                    value={formState.materialName}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field">
                  <label>Material Code / SKU</label>
                  <input
                    type="text"
                    name="materialCode"
                    placeholder="e.g. RM-PAR-01 or PM-BLS-09"
                    value={formState.materialCode}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field">
                  <label>Category</label>
                  <select
                    name="category"
                    value={formState.category}
                    onChange={handleFormChange}
                  >
                    {MATERIAL_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Production Batch / Lot #</label>
                  <input
                    type="text"
                    name="batchNumber"
                    placeholder="e.g. B-2026-104"
                    value={formState.batchNumber}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field">
                  <label>Quantity</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="quantity"
                    placeholder="0.00"
                    value={formState.quantity}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field">
                  <label>Unit of Measure (UOM)</label>
                  <select
                    name="uom"
                    value={formState.uom}
                    onChange={handleFormChange}
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="g">g (Grams)</option>
                    <option value="L">L (Liters)</option>
                    <option value="mL">mL (Milliliters)</option>
                    <option value="rolls">rolls</option>
                    <option value="cartons">cartons</option>
                    <option value="pieces">pieces</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Unit Rate (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="unitRate"
                    placeholder="Rate per unit"
                    value={formState.unitRate}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field">
                  <label>Supplier / Vendor</label>
                  <input
                    type="text"
                    name="supplier"
                    placeholder="e.g. Abbott Chem / LDS Internal"
                    value={formState.supplier}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field">
                  <label>Consumption / Invoice Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formState.date}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field full-width">
                  <label>Remarks</label>
                  <textarea
                    rows={2}
                    name="remarks"
                    placeholder="Notes regarding batch yield, purity certificate, or price escalation..."
                    value={formState.remarks}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              {/* Total Calculation Preview */}
              <div className="modal-calculation-banner">
                <span className="calc-banner-label">Calculated Material Cost (Qty × Rate):</span>
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
                  <span>{editingItem ? 'Update Material' : 'Save Material Entry'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
