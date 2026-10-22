import React, { useState, useMemo } from 'react';
import {
  IconFlask,
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
  IconCash,
  IconTestPipe,
  IconShieldCheck,
  IconBuildingArch,
  IconFileSpreadsheet
} from '@tabler/icons-react';
import { costingService, QUALITY_TEST_TYPES, formatCurrency } from './costingStorage';

export default function QualityTestingCostView() {
  const [testData, setTestData] = useState(() => costingService.getQualityCosts());
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form state
  const [formState, setFormState] = useState({
    sampleId: '',
    batchNumber: '',
    testName: '',
    testType: 'Assay & Dissolution (HPLC)',
    labType: 'In-House QC Lab',
    reagentCost: '',
    labFee: '',
    compliance: 'Pass',
    testDate: new Date().toISOString().slice(0, 10),
    remarks: ''
  });

  // Filtered dataset
  const filteredData = useMemo(() => {
    return testData.filter(item => {
      const matchType = selectedType === 'all' || item.testType === selectedType;
      const matchSearch =
        !searchTerm ||
        item.testName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sampleId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.labType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchType && matchSearch;
    });
  }, [testData, selectedType, searchTerm]);

  // Aggregate statistics
  const stats = useMemo(() => {
    const subset = selectedType === 'all' ? testData : testData.filter(i => i.testType === selectedType);
    const totalCost = subset.reduce((acc, curr) => acc + (Number(curr.totalCost) || 0), 0);
    const inHouseCost = subset.filter(i => i.labType?.includes('In-House')).reduce((acc, curr) => acc + (Number(curr.totalCost) || 0), 0);
    const externalCost = totalCost - inHouseCost;
    const passedCount = subset.filter(i => i.compliance === 'Pass').length;
    const testCount = subset.length;
    return { totalCost, inHouseCost, externalCost, passedCount, testCount };
  }, [testData, selectedType]);

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormState({
        sampleId: item.sampleId || '',
        batchNumber: item.batchNumber || '',
        testName: item.testName || '',
        testType: item.testType || 'Assay & Dissolution (HPLC)',
        labType: item.labType || 'In-House QC Lab',
        reagentCost: item.reagentCost ?? '',
        labFee: item.labFee ?? '',
        compliance: item.compliance || 'Pass',
        testDate: item.testDate || new Date().toISOString().slice(0, 10),
        remarks: item.remarks || ''
      });
    } else {
      setEditingItem(null);
      setFormState({
        sampleId: `SMP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        batchNumber: '',
        testName: '',
        testType: selectedType === 'all' ? 'Assay & Dissolution (HPLC)' : selectedType,
        labType: 'In-House QC Lab',
        reagentCost: '',
        labFee: '',
        compliance: 'Pass',
        testDate: new Date().toISOString().slice(0, 10),
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
    const reagents = parseFloat(formState.reagentCost) || 0;
    const fees = parseFloat(formState.labFee) || 0;
    return reagents + fees;
  }, [formState.reagentCost, formState.labFee]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formState.testName.trim()) {
      alert('Please specify the test name or parameter');
      return;
    }

    const payload = {
      ...(editingItem ? { id: editingItem.id } : {}),
      sampleId: formState.sampleId.trim(),
      batchNumber: formState.batchNumber.trim(),
      testName: formState.testName.trim(),
      testType: formState.testType,
      labType: formState.labType,
      reagentCost: Number(formState.reagentCost) || 0,
      labFee: Number(formState.labFee) || 0,
      totalCost: computedModalTotal,
      compliance: formState.compliance,
      testDate: formState.testDate,
      remarks: formState.remarks
    };

    const updated = costingService.saveQualityCost(payload);
    setTestData([...updated]);
    closeModal();
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete quality test record "${name}"?`)) {
      const updated = costingService.deleteQualityCost(id);
      setTestData([...updated]);
    }
  };

  return (
    <div className="costing-view-container">
      {/* Test type tabs */}
      <div className="costing-subnav-row">
        <div className="costing-subnav-tabs">
          <button
            type="button"
            className={`subnav-tab-btn ${selectedType === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedType('all')}
          >
            All Quality Tests
          </button>
          {QUALITY_TEST_TYPES.map(type => (
            <button
              key={type}
              type="button"
              className={`subnav-tab-btn ${selectedType === type ? 'active' : ''}`}
              onClick={() => setSelectedType(type)}
            >
              {type}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="costing-primary-btn"
          onClick={() => openModal()}
        >
          <IconPlus size={18} />
          <span>Add Quality Test Entry</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="costing-kpi-grid">
        <div className="costing-stat-card">
          <div className="stat-card-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <IconCash size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-label">Total QC Cost</span>
            <h3 className="stat-value">{formatCurrency(stats.totalCost)}</h3>
            <span className="stat-hint">{selectedType === 'all' ? 'In-house + External labs' : selectedType}</span>
          </div>
        </div>

        <div className="costing-stat-card">
          <div className="stat-card-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <IconTestPipe size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-label">Total Tests Executed</span>
            <h3 className="stat-value">{stats.testCount} Tests</h3>
            <span className="stat-hint">Active validation records</span>
          </div>
        </div>

        <div className="costing-stat-card">
          <div className="stat-card-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <IconBuildingArch size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-label">External Lab Testing</span>
            <h3 className="stat-value">{formatCurrency(stats.externalCost)}</h3>
            <span className="stat-hint">Third-party accredited tests</span>
          </div>
        </div>

        <div className="costing-stat-card">
          <div className="stat-card-icon" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
            <IconShieldCheck size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-label">Compliance Clearance</span>
            <h3 className="stat-value">{stats.testCount > 0 ? Math.round((stats.passedCount / stats.testCount) * 100) : 0}%</h3>
            <span className="stat-hint">{stats.passedCount} tests passed specs</span>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="costing-table-card">
        <div className="table-card-header">
          <div className="table-header-left">
            <h3 className="table-title">
              {selectedType === 'all'
                ? 'All Analytical & Quality Control Invoices'
                : `${selectedType} Testing Records`}
            </h3>
            <span className="table-subtitle">
              {filteredData.length} laboratory records • Reagents and facility charges
            </span>
          </div>

          <div className="table-header-right">
            <div className="search-box">
              <IconSearch size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search test, sample ID, batch, lab..."
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
                <th>Test Code</th>
                <th>Sample ID</th>
                <th>Batch #</th>
                <th>Test Parameter</th>
                <th>Test Type</th>
                <th>Testing Facility</th>
                <th>Reagents</th>
                <th>Lab Fee</th>
                <th>Total Cost</th>
                <th>Compliance</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={12} className="empty-table-cell">
                    <div className="empty-state-box">
                      <IconFileSpreadsheet size={36} />
                      <p>No quality testing records found matching filter criteria.</p>
                      <button
                        type="button"
                        className="costing-outline-btn"
                        onClick={() => openModal()}
                      >
                        Add Quality Test Record
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.id}>
                    <td><span className="badge-code">{row.id}</span></td>
                    <td className="fw-500">{row.sampleId}</td>
                    <td><span className="batch-badge">{row.batchNumber || 'N/A'}</span></td>
                    <td>
                      <div>{row.testName}</div>
                      {row.remarks && <small className="text-muted">{row.remarks}</small>}
                    </td>
                    <td>
                      <span className="pill-category pill-quality">
                        {row.testType}
                      </span>
                    </td>
                    <td>
                      <span className={`pill-lab ${row.labType?.includes('External') ? 'pill-lab-external' : 'pill-lab-internal'}`}>
                        {row.labType}
                      </span>
                    </td>
                    <td className="font-tabular">{formatCurrency(row.reagentCost)}</td>
                    <td className="font-tabular">{formatCurrency(row.labFee)}</td>
                    <td className="fw-600 font-tabular text-primary">
                      {formatCurrency(row.totalCost)}
                    </td>
                    <td>
                      <span className={`status-badge status-${row.compliance?.toLowerCase().replace(/\s+/g, '-')}`}>
                        {row.compliance}
                      </span>
                    </td>
                    <td>{row.testDate}</td>
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
                          onClick={() => handleDelete(row.id, row.testName)}
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

      {/* Quality Test Modal */}
      {isModalOpen && (
        <div className="costing-modal-overlay">
          <div className="costing-modal-container">
            <div className="costing-modal-header">
              <div className="modal-title-box">
                <div className="modal-title-icon">
                  <IconFlask size={20} />
                </div>
                <div>
                  <h3 className="modal-title">
                    {editingItem ? 'Edit Quality Test Entry' : 'Log Analytical Test Cost'}
                  </h3>
                  <span className="modal-subtitle">
                    Record reagents, certified lab fees, and compliance status
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
                  <label>Sample ID / Tag <span className="req">*</span></label>
                  <input
                    type="text"
                    name="sampleId"
                    required
                    placeholder="e.g. SMP-2026-901"
                    value={formState.sampleId}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field">
                  <label>Production Batch #</label>
                  <input
                    type="text"
                    name="batchNumber"
                    placeholder="e.g. B-2026-104"
                    value={formState.batchNumber}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field full-width">
                  <label>Test Name / Analytical Parameter <span className="req">*</span></label>
                  <input
                    type="text"
                    name="testName"
                    required
                    placeholder="e.g. Finished Product HPLC Assay & Dissolution Profile (USP/BP)"
                    value={formState.testName}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field">
                  <label>Test Category</label>
                  <select
                    name="testType"
                    value={formState.testType}
                    onChange={handleFormChange}
                  >
                    {QUALITY_TEST_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Testing Facility / Laboratory</label>
                  <select
                    name="labType"
                    value={formState.labType}
                    onChange={handleFormChange}
                  >
                    <option value="In-House QC Lab">In-House QC Lab</option>
                    <option value="In-House Microbiology Lab">In-House Microbiology Lab</option>
                    <option value="External Certified Lab (SGS / PCSIR)">External Certified Lab (SGS / PCSIR)</option>
                    <option value="Government Drug Testing Lab (DTL)">Government Drug Testing Lab (DTL)</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Reagents & Consumables Cost (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    name="reagentCost"
                    placeholder="0"
                    value={formState.reagentCost}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field">
                  <label>Testing / Analyst Lab Fee (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    name="labFee"
                    placeholder="0"
                    value={formState.labFee}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field">
                  <label>Compliance / Spec Status</label>
                  <select
                    name="compliance"
                    value={formState.compliance}
                    onChange={handleFormChange}
                  >
                    <option value="Pass">Pass (Within Specs)</option>
                    <option value="Pending">Pending Results</option>
                    <option value="Out of Spec">Out of Spec (OOS)</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Testing Date</label>
                  <input
                    type="date"
                    name="testDate"
                    value={formState.testDate}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field full-width">
                  <label>Remarks</label>
                  <textarea
                    rows={2}
                    name="remarks"
                    placeholder="Certificate of Analysis (COA) number or method validation references..."
                    value={formState.remarks}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              {/* Total Calculation Preview */}
              <div className="modal-calculation-banner">
                <span className="calc-banner-label">Total Quality Test Expense (Reagents + Lab Fee):</span>
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
                  <span>{editingItem ? 'Update Test' : 'Save Test Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
