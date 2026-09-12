import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IconSearch, IconTrash, IconPlus } from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { axiosInstance } from '../../apis/axiosinstance';
import { API_ENDPOINTS } from '../../apis/endpoints';
import ChooseFromList from '../../global-components/ChooseFromList/ChooseFromList';
import '../ProductionOrders/SalesOrderModal.css';
import './CreatePurchaseRequestModal.css';

const CreatePurchaseRequestModal = ({ isOpen, onClose }) => {
  const [headerData, setHeaderData] = useState({
    Company: 'LDS',
    DocDate: new Date().toISOString().split('T')[0],
    Branch: '',
    RequiredDate: '',
    ValidUntil: '',
    Remarks: ''
  });

  const [rows, setRows] = useState([
    { id: 1, ItemCode: '', ItemDescription: '', ReqQty: '', Warehouse: '', BusinessSegment: '', Reason: '' }
  ]);

  const [branches, setBranches] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [businessSegments, setBusinessSegments] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchLookups();
    }
  }, [isOpen]);

  const fetchLookups = async () => {
    try {
      const [branchRes, whsRes, segRes] = await Promise.all([
        axiosInstance.get(API_ENDPOINTS.INVENTORY.LOOKUP_BRANCHES),
        axiosInstance.get(API_ENDPOINTS.INVENTORY.LOOKUP_WAREHOUSES, { params: { company: 'LDS' } }),
        axiosInstance.get(API_ENDPOINTS.INVENTORY.LOOKUP_BUSINESS_SEGMENTS, { params: { company: 'LDS' } })
      ]);

      if (branchRes.data?.success) setBranches(branchRes.data.data || []);
      if (whsRes.data?.success) setWarehouses(whsRes.data.data || []);
      if (segRes.data?.success) setBusinessSegments(segRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch lookups:', err);
      toast.error('Failed to load lookup data');
    }
  };

  if (!isOpen) return null;

  const handleHeaderChange = (field, value) => {
    setHeaderData(prev => ({ ...prev, [field]: value }));
  };

  const handleRowChange = (id, field, value) => {
    setRows(prev => prev.map(row => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const addRow = () => {
    const newId = rows.length > 0 ? Math.max(...rows.map(r => r.id)) + 1 : 1;
    setRows(prev => [...prev, { id: newId, ItemCode: '', ItemDescription: '', ReqQty: '', Warehouse: '', BusinessSegment: '', Reason: '' }]);
  };

  const removeRow = (id) => {
    if (rows.length === 1) {
      toast.error('You must have at least one item row.');
      return;
    }
    setRows(prev => prev.filter(row => row.id !== id));
  };

  const handleSubmit = async () => {
    if (!headerData.DocDate || !headerData.RequiredDate) {
      toast.error('Document Date and Required Date are required.');
      return;
    }

    const validLines = rows.filter(r => r.ItemCode && r.ReqQty);
    if (validLines.length === 0) {
      toast.error('At least one item with a quantity is required.');
      return;
    }

    const payload = {
      company: headerData.Company,
      docDate: headerData.DocDate,
      requiredDate: headerData.RequiredDate,
      validUntil: headerData.ValidUntil || headerData.RequiredDate,
      branchId: headerData.Branch,
      remarks: headerData.Remarks,
      lines: validLines.map(row => ({
        itemCode: row.ItemCode,
        quantity: row.ReqQty,
        warehouseCode: row.Warehouse,
        businessSegment: row.BusinessSegment,
        reason: row.Reason
      }))
    };

    try {
      const res = await axiosInstance.post(API_ENDPOINTS.PURCHASE_ORDER.CREATE_REQUEST, payload);
      if (res.data?.success) {
        toast.success(res.data?.data?.Message || res.data?.message || 'Purchase Request created successfully!');
        onClose();
      } else {
        toast.error(res.data?.message || 'Failed to create purchase request.');
      }
    } catch (err) {
      console.error('Purchase Request Error:', err);
      toast.error(err.response?.data?.message || err.response?.data?.Message || 'Failed to create purchase request.');
    }
  };

  return createPortal(
    <div className="so-modal-overlay">
      <div className="so-modal-content po-details-modal cpr-custom-modal">
        <div className="so-modal-header">
          <h3>Create Purchase Request</h3>
          <button onClick={onClose} className="so-modal-close">&times;</button>
        </div>
        
        <div className="so-modal-body cpr-modal-body-layout">
          {/* Header Form */}
          <div className="cpr-form-header">
            <div className="cpr-form-group">
              <label>Company</label>
              <select 
                className="cpr-input" 
                value={headerData.Company}
                disabled
              >
                <option value="LDS">LDS</option>
              </select>
            </div>
            <div className="cpr-form-group">
              <label>Document Date</label>
              <input 
                type="date" 
                className="cpr-input" 
                value={headerData.DocDate}
                onChange={(e) => handleHeaderChange('DocDate', e.target.value)}
              />
            </div>
            <div className="cpr-form-group">
              <label>Branch</label>
              <select 
                className="cpr-input" 
                value={headerData.Branch}
                onChange={(e) => handleHeaderChange('Branch', e.target.value)}
              >
                <option value="">Select Branch</option>
                {branches.map((b, idx) => (
                  <option key={idx} value={b.BPLid || b.BPLId || b.id || ''}>{b.BPLName || b.name || String(b)}</option>
                ))}
              </select>
            </div>
            <div className="cpr-form-group">
              <label>Required Date</label>
              <input 
                type="date" 
                className="cpr-input" 
                value={headerData.RequiredDate}
                onChange={(e) => handleHeaderChange('RequiredDate', e.target.value)}
              />
            </div>
            <div className="cpr-form-group">
              <label>Valid Until</label>
              <input 
                type="date" 
                className="cpr-input" 
                value={headerData.ValidUntil}
                onChange={(e) => handleHeaderChange('ValidUntil', e.target.value)}
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="cpr-items-section">
            <div className="cpr-items-header">
              <h3>Items involved in Purchase Request</h3>
              <button className="cpr-add-row-btn" onClick={addRow}>
                <IconPlus size={16} /> Add Row
              </button>
            </div>
            
            <div className="cpr-table-container">
              <table className="cpr-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Item Code</th>
                    <th>Item Description</th>
                    <th>Req Qty</th>
                    <th>Warehouse</th>
                    <th>Business Segment</th>
                    <th>Reason</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={row.id} className="cpr-table-row">
                      <td className="cpr-row-index">{index + 1}</td>
                      <td>
                        <ChooseFromList
                          value={row.ItemCode}
                          displayValue={row.ItemCode}
                          apiEndpoint={API_ENDPOINTS.INVENTORY.ITEMS}
                          queryParams={{ company: 'LDS' }}
                          valueKey="ItemCode"
                          labelKey="ItemName"
                          columns={[
                            { key: 'ItemCode', header: 'Item Code' },
                            { key: 'ItemName', header: 'Item Name' }
                          ]}
                          onChange={(code, name, itemData) => {
                            handleRowChange(row.id, 'ItemCode', code);
                            if (itemData) {
                              handleRowChange(row.id, 'ItemDescription', itemData.ItemName);
                              if (itemData.U_Division || itemData.uDivision || itemData.BusinessSegment) {
                                handleRowChange(row.id, 'BusinessSegment', itemData.U_Division || itemData.uDivision || itemData.BusinessSegment);
                              }
                            }
                          }}
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="cpr-table-input" 
                          value={row.ItemDescription}
                          onChange={(e) => handleRowChange(row.id, 'ItemDescription', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className="cpr-table-input cpr-qty-input" 
                          value={row.ReqQty}
                          onChange={(e) => handleRowChange(row.id, 'ReqQty', e.target.value)}
                        />
                      </td>
                      <td>
                        <select 
                          className="cpr-table-input cpr-warehouse-input" 
                          value={row.Warehouse}
                          onChange={(e) => handleRowChange(row.id, 'Warehouse', e.target.value)}
                        >
                          <option value="">Select...</option>
                          {warehouses.map((w, idx) => {
                            const val = w.WhsCode || w.code || w.WarehouseCode || w.id || '';
                            const rawLabel = w.WhsName || w.WhsCode || w.WarehouseName || w.name || w.WarehouseCode || String(w);
                            const label = val && rawLabel && val !== rawLabel ? `${val} - ${rawLabel}` : rawLabel;
                            return <option key={idx} value={val}>{label}</option>;
                          })}
                        </select>
                      </td>
                      <td>
                        <select 
                          className="cpr-table-input" 
                          value={row.BusinessSegment}
                          onChange={(e) => handleRowChange(row.id, 'BusinessSegment', e.target.value)}
                        >
                          <option value="">Select Segment</option>
                          {businessSegments.map((s, idx) => {
                            const val = s.BusinessSegment || s.Code || s.code || s.id || '';
                            const label = s.BusinessSegment || s.Name || s.Code || s.name || String(s);
                            return <option key={idx} value={val}>{label}</option>;
                          })}
                        </select>
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="cpr-table-input" 
                          value={row.Reason}
                          onChange={(e) => handleRowChange(row.id, 'Reason', e.target.value)}
                        />
                      </td>
                      <td>
                        <button className="cpr-delete-btn" onClick={() => removeRow(row.id)}>
                          <IconTrash size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="cpr-form-group cpr-remarks-container">
            <label>Remarks</label>
            <textarea 
              className="cpr-input cpr-remarks-textarea" 
              placeholder="Enter Remarks..."
              value={headerData.Remarks}
              onChange={(e) => handleHeaderChange('Remarks', e.target.value)}
            />
          </div>
        </div>

        <div className="cpr-modal-footer">
          <button className="cpr-btn cpr-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="cpr-btn cpr-btn-submit" onClick={handleSubmit}>Submit Request</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CreatePurchaseRequestModal;
