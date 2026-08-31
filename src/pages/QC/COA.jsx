import React, { useState } from 'react';
import AsyncSelect from 'react-select/async';
import { API_ENDPOINTS } from '../../apis/endpoints';
import coaData from '../../util/text/coa.json';
import './COA.css';

const getTodayFormatted = () => {
  const date = new Date();
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
};

const getTodayFormattedUpper = () => {
  const date = new Date();
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase().replace(/-/g, ' ');
};

const COA = () => {
  const [formData, setFormData] = useState({
    formNo: '',
    issueDate: getTodayFormatted(),
    productTop: '',
    productLine: '',
    composition: '',
    product: '',
    catNo: '',
    batch: '',
    packSize: '',
    batchSize: '',
    mfgDate: '',
    sopNo: '',
    expDate: '',
    processStage: '',
    revisionNo: '',
    reg: '',
    dateReported: '',
    tests: [
      { id: 1, tests: '', specifications: '', analyzedBy: '', result: '', conclusion: '' }
    ],
    remarks: '',
    analyzedBy: { name: 'Husnain', title: 'QC Analyst', date: getTodayFormattedUpper() },
    checkedBy: { name: 'Saba Abbas', title: 'QC Officer', date: getTodayFormattedUpper() },
    approvedBy: { name: 'Madiha Rashid', title: 'QC Manager', date: getTodayFormattedUpper() }
  });

  const handleInputChange = (e, field, subField = null) => {
    const { value } = e.target;
    if (subField) {
      setFormData({
        ...formData,
        [field]: { ...formData[field], [subField]: value }
      });
    } else {
      setFormData({ ...formData, [field]: value });
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
      tests: [...prev.tests, { id: prev.tests.length + 1, tests: '', specifications: '', analyzedBy: '', result: '', conclusion: '' }]
    }));
  };

  const handleAutoResize = (el) => {
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  };

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
          label: `${item.ItemCode} - ${item.ItemName}`,
          productLine: item.U_Prod_line
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
  };

  const fetchProductDetails = async (itemCode, productLineStr) => {
    if (!itemCode) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${API_ENDPOINTS.COMPLAINTS.COA_PRODUCT_DETAILS(itemCode)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data) {
        const details = data.data;
        
        // Check if there is preset test data for this product line
        let presetTests = formData.tests;
        let presetRemarks = formData.remarks;
        if (productLineStr && coaData[productLineStr]) {
          presetTests = coaData[productLineStr].tests;
          presetRemarks = coaData[productLineStr].remarks;
        }

        setFormData(prev => ({
          ...prev,
          product: details['PRODUCT'] || '',
          batch: details['BATCH'] || '',
          batchSize: details['BATCH SIZE'] || '',
          sopNo: details['BMR NO.'] || '',
          processStage: details['PROCESS STAGE'] || '',
          catNo: details['CAT NO.'] || '',
          packSize: details['PACK SIZE'] || '',
          mfgDate: formatDate(details['MFG DATE']) || '',
          expDate: formatDate(details['EXP DATE']) || '',
          dateReported: formatDate(details['DATE REPORTED']) || '',
          tests: presetTests,
          remarks: presetRemarks
        }));
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
    }
  };

  const customSelectStyles = {
    control: (base) => ({
      ...base,
      background: 'transparent',
      border: 'none',
      boxShadow: 'none',
      minHeight: '24px',
    }),
    singleValue: (base) => ({
      ...base,
      color: '#333',
      fontWeight: 'normal',
    }),
    input: (base) => ({
      ...base,
      color: '#333',
    }),
    placeholder: (base) => ({
      ...base,
      color: '#888',
    }),
    menu: (base) => ({
      ...base,
      background: '#fff',
      color: '#333',
    }),
  };

  return (
    <div className="coa-document-wrapper">
      <div className="coa-document-container">
        {/* Top Header Outside Document */}
        <div className="coa-top-header">
          <div className="coa-top-logo">
            <span className="logo-lds">LDS</span>
            <span className="logo-text">Lab Diagnostic Systems<br/>(SMC) Pvt Ltd</span>
          </div>
          <div className="coa-top-title">{formData.productLine || ''}</div>
        </div>

        <div className="coa-document">
          
          {/* Header Section */}
        <div className="coa-header">
          <div className="coa-logo-section">
            <div className="coa-logo-placeholder">LDS</div>
          </div>
          <div className="coa-title-section">
            <h2>LAB DIAGNOSTIC SYSTEMS (SMC) PVT LTD.</h2>
            <h3>QUALITY CONTROL LABORATORY</h3>
            <h4>CERTIFICATE OF ANALYSIS FOR FINISHED PRODUCT</h4>
          </div>
          <div className="coa-form-info">
            <div className="coa-form-row">
              <label>Issue Date:</label>
              <input type="text" value={formData.issueDate} onChange={(e) => handleInputChange(e, 'issueDate')} />
            </div>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="coa-details-section">
          <div className="coa-detail-row full-width coa-detail-row-centered">
            <label>PRODUCT:</label>
            <div className="coa-item-select-container">
              <AsyncSelect
                cacheOptions
                defaultOptions
                loadOptions={fetchProducts}
                onChange={(selected) => {
                  setFormData(prev => ({
                    ...prev,
                    productTop: selected ? selected.label : '',
                    productLine: selected ? selected.productLine : ''
                  }));
                  if (selected && selected.value) {
                    fetchProductDetails(selected.value, selected.productLine);
                  }
                }}
                styles={customSelectStyles}
                placeholder="Search Product..."
                isClearable
              />
            </div>
          </div>
          <div className="coa-detail-row full-width">
            <label>COMPOSITION:</label>
            <input type="text" value={formData.composition} onChange={(e) => handleInputChange(e, 'composition')} />
          </div>
          
          <div className="coa-grid-details">
            <div className="coa-grid-col">
              <div className="coa-detail-row">
                <label>PRODUCT</label>
                <input type="text" value={formData.product} onChange={(e) => handleInputChange(e, 'product')} />
              </div>
              <div className="coa-detail-row">
                <label>BATCH:</label>
                <input type="text" value={formData.batch} onChange={(e) => handleInputChange(e, 'batch')} />
              </div>
              <div className="coa-detail-row">
                <label>BATCH SIZE:</label>
                <input type="text" value={formData.batchSize} onChange={(e) => handleInputChange(e, 'batchSize')} />
              </div>
              <div className="coa-detail-row">
                <label>SOP NO.:</label>
                <input type="text" value={formData.sopNo} onChange={(e) => handleInputChange(e, 'sopNo')} />
              </div>
              <div className="coa-detail-row">
                <label>PROCESS STAGE:</label>
                <input type="text" value={formData.processStage} onChange={(e) => handleInputChange(e, 'processStage')} />
              </div>
              <div className="coa-detail-row">
                <label>REG:</label>
                <input type="text" value={formData.reg} onChange={(e) => handleInputChange(e, 'reg')} />
              </div>
            </div>
            <div className="coa-grid-col">
              <div className="coa-detail-row">
                <label>CAT No:</label>
                <input type="text" value={formData.catNo} onChange={(e) => handleInputChange(e, 'catNo')} />
              </div>
              <div className="coa-detail-row">
                <label>PACK SIZE:</label>
                <input type="text" value={formData.packSize} onChange={(e) => handleInputChange(e, 'packSize')} />
              </div>
              <div className="coa-detail-row">
                <label>MFG DATE:</label>
                <input type="text" value={formData.mfgDate} onChange={(e) => handleInputChange(e, 'mfgDate')} />
              </div>
              <div className="coa-detail-row">
                <label>EXP DATE:</label>
                <input type="text" value={formData.expDate} onChange={(e) => handleInputChange(e, 'expDate')} />
              </div>
              <div className="coa-detail-row">
                <label>REVISION NO.:</label>
                <input type="text" value={formData.revisionNo} onChange={(e) => handleInputChange(e, 'revisionNo')} />
              </div>
              <div className="coa-detail-row">
                <label>DATE REPORTED:</label>
                <input type="text" value={formData.dateReported} onChange={(e) => handleInputChange(e, 'dateReported')} />
              </div>
            </div>
          </div>
        </div>

        {/* Tests Table Section */}
        <div className="coa-table-section">
          <table className="coa-table">
            <thead>
              <tr>
                <th>S.#</th>
                <th>TESTS</th>
                <th>SPECIFICATIONS</th>
                <th>ANALYZED BY</th>
                <th>RESULT</th>
                <th>CONCLUSION</th>
              </tr>
            </thead>
            <tbody>
              {formData.tests.map((test, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td><textarea value={test.tests} onChange={(e) => handleTestChange(index, 'tests', e.target.value)} onInput={(e) => handleAutoResize(e.target)} ref={handleAutoResize} /></td>
                  <td><textarea value={test.specifications} onChange={(e) => handleTestChange(index, 'specifications', e.target.value)} onInput={(e) => handleAutoResize(e.target)} ref={handleAutoResize} /></td>
                  <td><input type="text" value={test.analyzedBy} onChange={(e) => handleTestChange(index, 'analyzedBy', e.target.value)} /></td>
                  <td><input type="text" value={test.result} onChange={(e) => handleTestChange(index, 'result', e.target.value)} /></td>
                  <td><input type="text" value={test.conclusion} onChange={(e) => handleTestChange(index, 'conclusion', e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Remarks Section */}
        <div className="coa-remarks-section">
          <div className="coa-remarks-label">REMARKS</div>
          <div className="coa-remarks-input">
            <textarea value={formData.remarks} onChange={(e) => handleInputChange(e, 'remarks')} onInput={(e) => handleAutoResize(e.target)} ref={handleAutoResize} />
          </div>
        </div>

        {/* Signatures Section */}
        <div className="coa-signatures-section">
          <div className="coa-signature-block">
            <div className="coa-sig-header">ANALYZED BY</div>
            <input type="text" placeholder="Name" value={formData.analyzedBy.name} onChange={(e) => handleInputChange(e, 'analyzedBy', 'name')} className="coa-sign-input-bold" />
            <input type="text" placeholder="Title" value={formData.analyzedBy.title} onChange={(e) => handleInputChange(e, 'analyzedBy', 'title')} className="coa-sign-input-bold" />
            <input type="text" placeholder="Date" value={formData.analyzedBy.date} onChange={(e) => handleInputChange(e, 'analyzedBy', 'date')} className="coa-sign-input-grey-bold" />
          </div>
          <div className="coa-signature-block">
            <div className="coa-sig-header">CHECKED BY</div>
            <input type="text" placeholder="Name" value={formData.checkedBy.name} onChange={(e) => handleInputChange(e, 'checkedBy', 'name')} className="coa-sign-input-bold" />
            <input type="text" placeholder="Title" value={formData.checkedBy.title} onChange={(e) => handleInputChange(e, 'checkedBy', 'title')} className="coa-sign-input-bold" />
            <input type="text" placeholder="Date" value={formData.checkedBy.date} onChange={(e) => handleInputChange(e, 'checkedBy', 'date')} className="coa-sign-input-grey-bold" />
          </div>
          <div className="coa-signature-block">
            <div className="coa-sig-header">APPROVED BY</div>
            <input type="text" placeholder="Name" value={formData.approvedBy.name} onChange={(e) => handleInputChange(e, 'approvedBy', 'name')} className="coa-sign-input-bold" />
            <input type="text" placeholder="Title" value={formData.approvedBy.title} onChange={(e) => handleInputChange(e, 'approvedBy', 'title')} className="coa-sign-input-bold" />
            <input type="text" placeholder="Date" value={formData.approvedBy.date} onChange={(e) => handleInputChange(e, 'approvedBy', 'date')} className="coa-sign-input-grey-bold" />
          </div>
        </div>

        {/* Footer Section */}
        <div className="coa-footer-status">
          <div className="coa-approved-text">APPROVED</div>
        </div>
        <div className="coa-footer-disclaimer">
          This is SAP generated Document and does not require signature
        </div>
      </div>
    </div>
    </div>
  );
};

export default COA;