import React, { useState, useEffect } from 'react';
import AsyncSelect from 'react-select/async';
import { API_ENDPOINTS } from '../../apis/endpoints';
import { axiosInstance } from '../../apis/axiosinstance';
import { useAuth } from '../../context/AuthContext';
import Button from '../../global-components/Button/Button';
import Table from '../../global-components/Table/Table';
import GlobalPopup from '../../global-components/GlobalPopup/GlobalPopup';
import toast, { Toaster } from 'react-hot-toast';
import { IconEdit, IconPlus } from '@tabler/icons-react';
import './COA.css';
import '../Sampling/Sampling.css';
import '../ProductionOrders/ProductionOrders.css';

const COATemplates = () => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Table and Modal states
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [isFetchingTemplates, setIsFetchingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [formData, setFormData] = useState({
    products: [],
    tests: [
      { id: 1, test: '', specification: '', result: '' }
    ]
  });
  const [isEditing, setIsEditing] = useState(false);

  const fetchSavedTemplates = async () => {
    try {
      setIsFetchingTemplates(true);
      const res = await axiosInstance.get(API_ENDPOINTS.QC.GET_ALL_TEMPLATES);
      if (res.data.success) {
        setSavedTemplates(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setIsFetchingTemplates(false);
    }
  };

  useEffect(() => {
    fetchSavedTemplates();
  }, []);

  const fetchProducts = async (inputValue) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${API_ENDPOINTS.COMPLAINTS.LOOKUP_ITEMS}?search=${inputValue}&limit=100&type=FG`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        return data.data.map(item => ({
          value: item.ItemCode,
          label: `${item.ItemCode} - ${item.ItemName}`
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  };

  const handleTestChange = (index, field, value) => {
    const newTests = [...formData.tests];
    newTests[index][field] = value;
    setFormData({ ...formData, tests: newTests });
  };

  const addTestRow = () => {
    setFormData(prev => ({
      ...prev,
      tests: [...prev.tests, { id: prev.tests.length + 1, test: '', specification: '', result: '' }]
    }));
  };

  const removeTestRow = (index) => {
    const newTests = formData.tests.filter((_, i) => i !== index);
    setFormData({ ...formData, tests: newTests });
  };

  const handleAutoResize = (el) => {
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  };

  const customSelectStyles = {
    container: (base) => ({
      ...base,
      width: '100%',
    }),
    control: (base, state) => ({
      ...base,
      width: '100%',
      background: '#fff',
      border: state.isFocused ? '1px solid #1b47db' : '1px solid #ccc',
      borderRadius: '2px',
      boxShadow: 'none',
      minHeight: '32px',
      fontSize: '12px',
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '2px 8px',
      gap: '4px',
    }),
    multiValue: (base) => ({
      ...base,
      background: '#e8eefc',
      borderRadius: '2px',
    }),
    multiValueLabel: (base) => ({
      ...base,
      fontSize: '12px',
      color: '#1e293b',
    }),
    indicatorsContainer: (base) => ({
      ...base,
      alignSelf: 'stretch',
    }),
    menuPortal: base => ({ ...base, zIndex: 9999 })
  };

  const resetForm = () => {
    setFormData({
      products: [],
      tests: [{ id: 1, test: '', specification: '', result: '' }]
    });
    setIsEditing(false);
    setShowError(false);
  };

  const handleSave = async () => {
    const selectedProducts = Array.isArray(formData.products) ? formData.products : [];
    if (!selectedProducts.length) {
      setShowError(true);
      toast.error('Please select at least one product.');
      return;
    }
    setShowError(false);
    const validTests = formData.tests.filter(t => t.test.trim() !== '' || t.specification.trim() !== '' || t.result.trim() !== '');
    if (validTests.length === 0) {
      toast.error('Please add at least one test.');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        itemCodes: selectedProducts.map((p) => p.value),
        description: JSON.stringify(validTests),
        createdBy: user?.EmpID || user?.emp_id || user?.id || 0
      };

      const res = await axiosInstance.post(API_ENDPOINTS.QC.CREATE_TEMPLATE, payload);
      
      if (res.data.success) {
        toast.success(res.data.message || 'COA Template saved successfully!');
        resetForm();
        setShowCreateForm(false);
        fetchSavedTemplates();
      } else {
        toast.error(res.data.message || 'Failed to save COA template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('An error occurred while saving the template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRowClick = (row) => {
    try {
      const testsArray = JSON.parse(row.Description);
      setSelectedTemplate({ ...row, parsedTests: testsArray });
    } catch (e) {
      console.error("Failed to parse description", e);
      setSelectedTemplate({ ...row, parsedTests: [] });
    }
  };

  const handleEdit = async (e, row) => {
    e.stopPropagation(); // Prevent row click from opening modal
    try {
      let fullLabel = row.ItemName
        ? `${row.ItemCode} - ${row.ItemName}`
        : row.ItemCode;
      if (!row.ItemName) {
        try {
          const items = await fetchProducts(row.ItemCode);
          const matched = items.find(i => i.value === row.ItemCode);
          if (matched) fullLabel = matched.label;
        } catch (err) {
          console.error("Failed to fetch full item label", err);
        }
      }

      const testsArray = JSON.parse(row.Description);
      setFormData({
        products: [{ value: row.ItemCode, label: fullLabel }],
        tests: testsArray.map((t, index) => ({
          id: index + 1,
          test: t.test || t.tests,
          specification: t.specification || t.specifications,
          result: t.result
        }))
      });
      setIsEditing(true);
      setShowCreateForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error("Failed to parse template for editing", err);
      toast.error("Failed to load template data for editing");
    }
  };

  const handleActionClick = (action, row) => {
    if (action === 'info' || action === 'list') {
      handleRowClick(row);
    }
  };

  const tableColumns = [
    { key: 'ItemCode', header: 'Item Code', width: '18%' },
    {
      key: 'ItemName',
      header: 'Item Name',
      width: '28%',
      render: (row) => row.ItemName || '—'
    },
    { 
      key: 'CreatedBy', 
      header: 'Created By', 
      width: '18%',
      render: (row) => row.CreatedByName || row.CreatedBy || 'N/A'
    },
    { 
      key: 'CreatedDate', 
      header: 'Created Date', 
      width: '18%',
      render: (row) => new Date(row.CreatedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) 
    },

    {
      key: 'actions',
      header: 'Actions',
      width: '10%',
      render: (row) => (
        <button 
          className="dome-table-action-btn dome-table-action-btn--info coa-template-btn-edit"
          onClick={(e) => handleEdit(e, row)}
          title="Edit"
        >
          <IconEdit size={16} stroke={2} />
        </button>
      )
    }
  ];

  const modalColumns = [
    { key: 'id', header: 'S.#', width: '10%' },
    { key: 'tests', header: 'TEST', width: '30%' },
    { key: 'specifications', header: 'SPECIFICATION', width: '40%' },
    { key: 'result', header: 'RESULT', width: '20%' }
  ];

  return (
    <div className="coa-document-wrapper coa-template-wrapper">
      <Toaster position="top-right" />

      {/* Header with Create Button */}
      <div className="coa-template-header">
        <h2 className="coa-template-title"></h2>
        {!showCreateForm && (
          <Button variant="primary" onClick={() => {
            resetForm();
            setShowCreateForm(true);
          }} icon={<IconPlus size={18} />}>
            Create Template
          </Button>
        )}
      </div>

      {showCreateForm && (
        <div className="add-sample-wrapper">
          <div className="add-sample-grid">
            <div className="add-sample-col" style={{ maxWidth: '100%' }}>
              <div className="add-sample-field">
                <label className="add-sample-label">Product(s)</label>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <AsyncSelect
                    cacheOptions
                    defaultOptions
                    isMulti
                    closeMenuOnSelect={false}
                    loadOptions={fetchProducts}
                    onChange={(selected) => {
                      setFormData(prev => ({ ...prev, products: selected || [] }));
                      if (selected?.length) setShowError(false);
                    }}
                    value={formData.products}
                    styles={customSelectStyles}
                    placeholder="Search and select one or more products..."
                    isClearable
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                  {showError && <span className="coa-template-error">Select at least one product</span>}
                </div>
              </div>
            </div>
          </div>

        {/* Tests Table */}
        <div className="po-grid-container" style={{ minHeight: 'auto' }}>
          <table className="po-table" style={{ whiteSpace: 'normal' }}>
            <thead>
              <tr>
                <th className="coa-template-th-sn">S.#</th>
                <th>TEST</th>
                <th>SPECIFICATION</th>
                <th>RESULT</th>
                <th className="coa-template-th-action">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {formData.tests.map((test, index) => (
                <tr key={index}>
                  <td className="coa-template-td-center">{index + 1}</td>
                  <td className="coa-template-td-nopadding">
                    <textarea 
                      value={test.test} 
                      onChange={(e) => handleTestChange(index, 'test', e.target.value)} 
                      onInput={(e) => handleAutoResize(e.target)} 
                      ref={handleAutoResize} 
                      placeholder="Enter test name"
                      className="coa-template-textarea"
                    />
                  </td>
                  <td className="coa-template-td-nopadding">
                    <textarea 
                      value={test.specification} 
                      onChange={(e) => handleTestChange(index, 'specification', e.target.value)} 
                      onInput={(e) => handleAutoResize(e.target)} 
                      ref={handleAutoResize} 
                      placeholder="Enter specification"
                      className="coa-template-textarea"
                    />
                  </td>
                  <td className="coa-template-td-nopadding">
                    <textarea 
                      value={test.result} 
                      onChange={(e) => handleTestChange(index, 'result', e.target.value)} 
                      onInput={(e) => handleAutoResize(e.target)} 
                      ref={handleAutoResize} 
                      placeholder="Enter result"
                      className="coa-template-textarea"
                    />
                  </td>
                  <td className="coa-template-td-center">
                    <Button variant="danger" size="sm" onClick={() => removeTestRow(index)}>Remove</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="coa-template-add-btn-wrapper">
          <Button variant="secondary" size="sm" onClick={addTestRow}>+ Add Row</Button>
        </div>

        <div className="add-sample-footer">
          <Button variant="outline" onClick={() => { resetForm(); setShowCreateForm(false); }}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
            {isEditing ? 'Save Changes' : 'Save Template'}
          </Button>
        </div>

      </div>
      )}

      {/* Saved Templates Table */}
      {!showCreateForm && <div className="coa-document-container coa-template-container">
        <Table 
          data={savedTemplates}
          columns={tableColumns}
          isLoading={isFetchingTemplates}
          showActions={false}
          onRowClick={handleRowClick}
        />
      </div>}

      {/* Template Details Modal */}
      {selectedTemplate && (
        <GlobalPopup 
          title={`Template Details - ${selectedTemplate.ItemCode}${selectedTemplate.ItemName ? ` — ${selectedTemplate.ItemName}` : ''}`} 
          onClose={() => setSelectedTemplate(null)}
          className="coa-template-modal"
        >
          <div className="coa-template-modal-content">
            
            {/* Modal Header matching the screenshot style */}
            <div className="coa-template-modal-header">
              <div className="coa-template-modal-title-wrapper">
                <h2 className="coa-template-modal-title">
                  Item Code : {selectedTemplate.ItemCode}
                  {selectedTemplate.ItemName ? ` — ${selectedTemplate.ItemName}` : ''}
                </h2>
             
              </div>
              <p className="coa-template-modal-subtitle">
                Created on {new Date(selectedTemplate.CreatedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} 
                &nbsp;&nbsp;•&nbsp;&nbsp; 
                Created By: {selectedTemplate.CreatedByName || selectedTemplate.CreatedBy || 'N/A'}
              </p>
            </div>

            {/* Modal Table */}
            <div className="coa-template-modal-table-wrapper">
              <Table 
                data={selectedTemplate.parsedTests?.map((t, index) => ({
                  id: index + 1,
                  tests: t.test || t.tests,
                  specifications: t.specification || t.specifications,
                  result: t.result
                })) || []}
                columns={modalColumns}
                showActions={false}
                showPagination={false}
              />
            </div>

          </div>
        </GlobalPopup>
      )}

    </div>
  );
};

export default COATemplates;
