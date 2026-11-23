import React, { useState, useEffect, useMemo } from 'react';
import AsyncSelect from 'react-select/async';
import { API_ENDPOINTS } from '../../apis/endpoints';
import { inventoryPlanningApi } from '../../apis/Inventory/inventory-planning';
import { axiosInstance } from '../../apis/axiosinstance';
import { useAuth } from '../../context/AuthContext';
import Button from '../../global-components/Button/Button';
import Table from '../../global-components/Table/Table';
import toast, { Toaster } from 'react-hot-toast';
import { IconEdit, IconPlus, IconSearch, IconRefresh } from '@tabler/icons-react';
import './COA.css';
import '../Sampling/Sampling.css';
import '../ProductionOrders/ProductionOrders.css';

const emptyTemplate = () => ({
  line: '',
  templateName: '',
  templateId: null,
  headers: [{ label: '', value: '' }],
  notes: [{ text: '' }],
  conformityOptions: [
    { value: 'Complies', text: 'The product complies with the prescribed standard of quality as per specifications.' },
    { value: 'Does Not Comply', text: 'The product not complies with the prescribed standard of quality as per specifications.' }
  ],
  tests: [{ id: 1, test: '', specification: '', analyzedBy: '', result: '', conclusion: '' }]
});

const parseJson = (value, fallback) => {
  if (!value) return fallback;
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return fallback; }
};

const COATemplates = () => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Table and Modal states
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [isFetchingTemplates, setIsFetchingTemplates] = useState(false);
  const [formData, setFormData] = useState(emptyTemplate);

  useEffect(() => {
    inventoryPlanningApi.getRawMaterials({ page: 1, pageSize: 1 })
      .then((res) => setProductLines((res?.productLines || []).filter(Boolean)))
      .catch(() => setProductLines([]));
  }, []);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [productLines, setProductLines] = useState([]);

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

  const filteredTemplates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return (savedTemplates || []).filter((row) => {
      const created = String(row.CreatedDate || '').slice(0, 10);
      if (fromDate && created && created < fromDate) return false;
      if (toDate && created && created > toDate) return false;
      if (!query) return true;
      const haystack = [row.Line, row.TemplateName, row.CreatedByName, row.CreatedBy]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [savedTemplates, searchQuery, fromDate, toDate]);

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
      tests: [...prev.tests, { id: prev.tests.length + 1, test: '', specification: '', analyzedBy: '', result: '', conclusion: '' }]
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
    setFormData(emptyTemplate());
    setIsEditing(false);
    setShowError(false);
  };

  const handleSave = async () => {
    const line = String(formData.line || '').trim();
    if (!line) {
      setShowError(true);
      toast.error('Please enter the product line.');
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
        line,
        templateName: formData.templateName,
        templateId: formData.templateId || null,
        description: validTests.map((t, index) => ({
          SrNo: index + 1,
          Test: t.test,
          Specifications: t.specification,
          AnalyzedBy: t.analyzedBy,
          Results: t.result,
          Conclusion: t.conclusion
        })),
        header: Object.fromEntries(
          formData.headers
            .map((item) => [String(item.label || '').trim(), item.value || ''])
            .filter(([label]) => label)
        ),
        footer: {
          Notes: formData.notes.map((note) => String(note.text || '').trim()).filter(Boolean).map((text, index) => ({ NoteNo: index + 1, Text: text })),
          StatementOfConformity: {
            Label: 'Statement of Conformity',
            Dropdown: true,
            Options: formData.conformityOptions
              .map((option) => ({ Value: String(option.value || '').trim(), Text: String(option.text || '').trim() }))
              .filter((option) => option.Value || option.Text)
          }
        },
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

  const handleEdit = async (e, row) => {
    e.stopPropagation(); // Prevent row click from opening modal
    try {
      const testsArray = parseJson(row.Description, []);
      const header = parseJson(row.Header, {});
      const footer = parseJson(row.Footer, {});
      setFormData({
        line: row.Line || '',
        templateName: row.TemplateName || '',
        templateId: row.ID || null,
        headers: Object.keys(header || {}).length
          ? Object.entries(header).map(([label, value]) => ({ label, value: value ?? '' }))
          : [{ label: '', value: '' }],
        notes: (footer.Notes || []).length
          ? footer.Notes.map((note) => ({ text: note.Text || '' }))
          : [{ text: '' }],
        conformityOptions: (footer.StatementOfConformity?.Options || []).length
          ? footer.StatementOfConformity.Options.map((option) => ({ value: option.Value || '', text: option.Text || '' }))
          : emptyTemplate().conformityOptions,
        tests: (Array.isArray(testsArray) ? testsArray : []).map((t, index) => ({
          id: index + 1,
          test: t.test || t.tests || t.Test || '',
          specification: t.specification || t.specifications || t.Specifications || '',
          analyzedBy: t.analyzedBy || t.AnalyzedBy || '',
          result: t.result || t.Results || '',
          conclusion: t.conclusion || t.Conclusion || ''
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
    { key: 'ID', header: 'ID', width: '8%', render: (row) => row.ID ?? '—' },
    { key: 'TemplateName', header: 'Template Name', width: '20%', render: (row) => row.TemplateName || '—' },
    { key: 'Line', header: 'Product Line', width: '22%', render: (row) => row.Line || '—' },
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
        <div className="coa-document">
          <div className="coa-header coa-cert-head">
            <div className="coa-title-section">
              <h2>LAB DIAGNOSTIC SYSTEMS (SMC) PRIVATE LIMITED</h2>
              <p>Plot No 36-A, PSIC, SIE, Taxila – Rawalpindi, Pakistan</p>
              <h3>CERTIFICATE OF ANALYSIS</h3>
              <h4>(Finished Product)</h4>
            </div>
          </div>
          <table className="coa-cert">
            <tbody>
              <tr>
                <th>Template Name:</th>
                <td colSpan={3}>
                  <input type="text" value={formData.templateName} placeholder="Template name" onChange={(e) => setFormData(prev => ({ ...prev, templateName: e.target.value }))} />
                </td>
              </tr>
              <tr>
                <th>Product Line:</th>
                <td colSpan={3}>
                  <input
                    type="text"
                    list="coa-product-lines"
                    value={formData.line}
                    placeholder="Select or paste a product line"
                    onChange={(e) => { setFormData(prev => ({ ...prev, line: e.target.value })); if (e.target.value.trim()) setShowError(false); }}
                  />
                  <datalist id="coa-product-lines">
                    {productLines.map((line) => (
                      <option key={line} value={line} />
                    ))}
                  </datalist>
                  {showError && <span className="coa-template-error">Enter the product line</span>}
                </td>
              </tr>
              {formData.headers.map((item, index) => (
                <tr key={index}>
                  <th>
                    <input type="text" value={item.label} placeholder="Header name" onChange={(e) => setFormData(prev => ({ ...prev, headers: prev.headers.map((row, i) => i === index ? { ...row, label: e.target.value } : row) }))} />
                  </th>
                  <td colSpan={2}>
                    <input type="text" value={item.value} placeholder="Header value" onChange={(e) => setFormData(prev => ({ ...prev, headers: prev.headers.map((row, i) => i === index ? { ...row, value: e.target.value } : row) }))} />
                  </td>
                  <td>
                    <Button variant="danger" size="sm" onClick={() => setFormData(prev => ({ ...prev, headers: prev.headers.filter((_, i) => i !== index) }))}>Remove</Button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={4}>
                  <Button variant="secondary" size="sm" onClick={() => setFormData(prev => ({ ...prev, headers: [...prev.headers, { label: '', value: '' }] }))}>+ Add Header</Button>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="coa-table-section">
            <table className="coa-table">
              <thead>
                <tr>
                  <th>S.#</th>
                  <th>TEST</th>
                  <th>SPECIFICATIONS</th>
                  <th>ANALYZED BY</th>
                  <th>RESULTS</th>
                  <th>CONCLUSION</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {formData.tests.map((test, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td><textarea value={test.test} onChange={(e) => handleTestChange(index, 'test', e.target.value)} /></td>
                    <td><textarea value={test.specification} onChange={(e) => handleTestChange(index, 'specification', e.target.value)} /></td>
                    <td><input type="text" value={test.analyzedBy} onChange={(e) => handleTestChange(index, 'analyzedBy', e.target.value)} /></td>
                    <td><input type="text" value={test.result} onChange={(e) => handleTestChange(index, 'result', e.target.value)} /></td>
                    <td><input type="text" value={test.conclusion} onChange={(e) => handleTestChange(index, 'conclusion', e.target.value)} /></td>
                    <td><Button variant="danger" size="sm" onClick={() => removeTestRow(index)}>Remove</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="coa-template-add-btn-wrapper">
              <Button variant="secondary" size="sm" onClick={addTestRow}>+ Add Row</Button>
            </div>
          </div>
          <table className="coa-remarks-table">
            <tbody>
              <tr>
                <th>Notes</th>
                <td>
                  {formData.notes.map((note, index) => (
                    <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <span>Note {index + 1}</span>
                      <textarea value={note.text} onChange={(e) => setFormData(prev => ({ ...prev, notes: prev.notes.map((item, i) => i === index ? { text: e.target.value } : item) }))} />
                      <Button variant="danger" size="sm" onClick={() => setFormData(prev => ({ ...prev, notes: prev.notes.filter((_, i) => i !== index) }))}>Delete</Button>
                    </div>
                  ))}
                  <Button variant="secondary" size="sm" onClick={() => setFormData(prev => ({ ...prev, notes: [...prev.notes, { text: '' }] }))}>+ Add Note</Button>
                </td>
              </tr>
              <tr>
                <th>Statement of Conformity</th>
                <td>
                  {formData.conformityOptions.map((option, index) => (
                    <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input type="text" value={option.value} placeholder="Option name" onChange={(e) => setFormData(prev => ({ ...prev, conformityOptions: prev.conformityOptions.map((item, i) => i === index ? { ...item, value: e.target.value } : item) }))} />
                      <textarea value={option.text} placeholder="Option text" onChange={(e) => setFormData(prev => ({ ...prev, conformityOptions: prev.conformityOptions.map((item, i) => i === index ? { ...item, text: e.target.value } : item) }))} />
                      <Button variant="danger" size="sm" onClick={() => setFormData(prev => ({ ...prev, conformityOptions: prev.conformityOptions.filter((_, i) => i !== index) }))}>Delete</Button>
                    </div>
                  ))}
                  <Button variant="secondary" size="sm" onClick={() => setFormData(prev => ({ ...prev, conformityOptions: [...prev.conformityOptions, { value: '', text: '' }] }))}>+ Add Option</Button>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="add-sample-footer">
            <Button variant="outline" onClick={() => { resetForm(); setShowCreateForm(false); }}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
              {isEditing ? 'Save Changes' : 'Save Template'}
            </Button>
          </div>
        </div>
      )}

      {!showCreateForm && <div className="coa-document-container coa-template-container">
        <div className="po-filter-toolbar-card">
          <div className="po-filter-toolbar-grid">
            <div className="po-filter-item po-filter-search-box">
              <label className="po-filter-label">Search</label>
              <div style={{ position: 'relative' }}>
                <IconSearch size={18} className="po-filter-search-icon" />
                <input
                  type="text"
                  placeholder="Product line, created by..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="po-filter-search-input"
                />
              </div>
            </div>
            <div className="po-filter-item">
              <label className="po-filter-label">Created From</label>
              <input type="date" className="po-filter-date-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="po-filter-item">
              <label className="po-filter-label">Created To</label>
              <input type="date" className="po-filter-date-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div className="po-filter-item">
              <label className="po-filter-label">&nbsp;</label>
              <button
                type="button"
                className="po-filter-reset-btn"
                disabled={!searchQuery && !fromDate && !toDate}
                onClick={() => {
                  setSearchQuery('');
                  setFromDate('');
                  setToDate('');
                }}
              >
                <IconRefresh size={16} />
                Reset
              </button>
            </div>
          </div>
        </div>
        <Table 
          data={filteredTemplates}
          columns={tableColumns}
          isLoading={isFetchingTemplates}
          showActions={false}
        />
      </div>}

    </div>
  );
};

export default COATemplates;
