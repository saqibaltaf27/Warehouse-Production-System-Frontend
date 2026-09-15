import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Select from 'react-select';
import { axiosInstance } from '../../apis/axiosinstance';
import { API_ENDPOINTS } from '../../apis/endpoints';
import Button from '../../global-components/Button/Button';
import { IconArrowLeft } from '@tabler/icons-react';
import './ProductionPlanning.css'; // Reuse existing styles or add new ones

const getTodayDate = () => new Date().toISOString().split('T')[0];

const AddTodayPlan = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [editingPlanId, setEditingPlanId] = useState(null);
  
  const [openPOs, setOpenPOs] = useState([]);
  const [machines, setMachines] = useState([]);

  const getInitialPlanFormData = () => ({
    date: getTodayDate(),
    line: 'R-Test Line',
    machine: '[]',
    supervisor: '',
    po: '',
    jdItems: [{ name: '', jd: '' }],
    shift: '',
    plannedManpower: '',
    actualManpower: '',
    workingHours: '8',
    productionQty: '',
    standardUnitsPerHour: '',
    totalManHours: '',
    unitsPerManHour: '',
    productivity: '',
    remarks: ''
  });

  const [planFormData, setPlanFormData] = useState(getInitialPlanFormData());
  
  const [userEditedPlan, setUserEditedPlan] = useState({
    totalManHours: false,
    unitsPerManHour: false,
    productivity: false
  });

  useEffect(() => {
    // If we are editing, populate from state
    if (location.state?.plan) {
      const plan = location.state.plan;
      setEditingPlanId(plan.Id);
      
      let machineVal = '[]';
      if (plan.Machine) {
        try {
          const parsed = JSON.parse(plan.Machine);
          machineVal = Array.isArray(parsed) ? plan.Machine : '[]';
        } catch (e) {
          machineVal = JSON.stringify(plan.Machine.split(', '));
        }
      }

      setPlanFormData({
        date: plan.PlanDate ? plan.PlanDate.split('T')[0] : getTodayDate(),
        line: plan.Line || 'R-Test Line',
        machine: machineVal,
        supervisor: plan.Supervisor || '',
        po: plan.PO || '',
        jdItems: plan.jdItems && plan.jdItems.length > 0 ? plan.jdItems : [{ name: '', jd: '' }],
        shift: plan.shift || '',
        plannedManpower: plan.plannedManpower || '',
        actualManpower: plan.actualManpower || '',
        workingHours: plan.workingHours || '8',
        productionQty: plan.productionQty || '',
        standardUnitsPerHour: plan.stdUnitsPerManHour || '',
        totalManHours: plan.totalManHour || '',
        unitsPerManHour: plan.unitsPerManHour || '',
        productivity: plan.prdPercentage || '',
        remarks: plan.remarks || ''
      });
      setUserEditedPlan({ totalManHours: false, unitsPerManHour: false, productivity: false });
    }
  }, [location.state]);

  const fetchOpenPOs = useCallback(async () => {
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.PRODUCTION_PLANNING.OPEN_ORDERS);
      if (res.data?.success) {
        setOpenPOs(res.data.data);
      }
    } catch (err) {
      console.error('Fetch Open POs error:', err);
    }
  }, []);

  const fetchMachines = useCallback(async () => {
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.PRODUCTION_PLANNING.GET_MACHINES);
      if (res.data?.success) {
        setMachines(res.data.data);
      }
    } catch (err) {
      console.error('Fetch Machines error:', err);
    }
  }, []);

  useEffect(() => {
    fetchOpenPOs();
    fetchMachines();
  }, [fetchOpenPOs, fetchMachines]);

  useEffect(() => {
    const actual = parseFloat(planFormData.actualManpower) || 0;
    const hours = parseFloat(planFormData.workingHours) || 0;
    const qty = parseFloat(planFormData.productionQty) || 0;
    const stdUnits = parseFloat(planFormData.standardUnitsPerHour) || 0;

    setPlanFormData(prev => {
      const updates = { ...prev };
      let changed = false;
      
      const newTotal = actual * hours;
      if (!userEditedPlan.totalManHours) {
        const totalStr = newTotal > 0 ? newTotal.toFixed(2) : '';
        if (updates.totalManHours !== totalStr) {
          updates.totalManHours = totalStr;
          changed = true;
        }
      }
      
      const effectiveTotal = parseFloat(updates.totalManHours) || 0;
      const newUnits = effectiveTotal > 0 ? qty / effectiveTotal : 0;
      if (!userEditedPlan.unitsPerManHour) {
        const unitsStr = newUnits > 0 ? newUnits.toFixed(2) : '';
        if (updates.unitsPerManHour !== unitsStr) {
          updates.unitsPerManHour = unitsStr;
          changed = true;
        }
      }
      
      const effectiveUnits = parseFloat(updates.unitsPerManHour) || 0;
      const newProd = stdUnits > 0 ? (effectiveUnits / stdUnits) * 100 : 0;
      if (!userEditedPlan.productivity) {
        const prodStr = newProd > 0 ? newProd.toFixed(2) : '';
        if (updates.productivity !== prodStr) {
          updates.productivity = prodStr;
          changed = true;
        }
      }
      
      return changed ? updates : prev;
    });
  }, [planFormData.actualManpower, planFormData.workingHours, planFormData.productionQty, planFormData.standardUnitsPerHour, userEditedPlan]);

  const handlePlanFormChange = (e) => {
    const { name, value } = e.target;
    setPlanFormData(prev => ({ ...prev, [name]: value }));
    
    // If user types into calculated fields, mark them as user edited
    if (['totalManHours', 'unitsPerManHour', 'productivity'].includes(name)) {
      setUserEditedPlan(prev => ({ ...prev, [name]: true }));
    }
  };

  const handleJdItemChange = (idx, field, val) => {
    const newItems = [...planFormData.jdItems];
    newItems[idx][field] = val;
    setPlanFormData({ ...planFormData, jdItems: newItems });
  };

  const handleAddJdItem = () => {
    setPlanFormData({ ...planFormData, jdItems: [...planFormData.jdItems, { name: '', jd: '' }] });
  };

  const handleRemoveJdItem = (idx) => {
    const newItems = planFormData.jdItems.filter((_, i) => i !== idx);
    setPlanFormData({ ...planFormData, jdItems: newItems });
  };

  const handleSavePlan = async () => {
    try {
      const payload = {
        ...planFormData,
        jdItems: planFormData.jdItems.filter(item => item.name.trim() !== '' || item.jd.trim() !== ''),
        plannedManpower: parseFloat(planFormData.plannedManpower) || null,
        actualManpower: parseFloat(planFormData.actualManpower) || null,
        workingHours: parseFloat(planFormData.workingHours) || null,
        totalManHour: parseFloat(planFormData.totalManHours) || null,
        productionQty: parseFloat(planFormData.productionQty) || null,
        unitsPerManHour: parseFloat(planFormData.unitsPerManHour) || null,
        stdUnitsPerManHour: parseFloat(planFormData.standardUnitsPerHour) || null,
        prdPercentage: parseFloat(planFormData.productivity) || null,
      };
      
      let res;
      if (editingPlanId) {
        res = await axiosInstance.put(`${API_ENDPOINTS.PRODUCTION_PLANNING.UPDATE_PLAN}/${editingPlanId}`, payload);
      } else {
        res = await axiosInstance.post(API_ENDPOINTS.PRODUCTION_PLANNING.CREATE_PLAN, payload);
      }

      if (res.data?.success) {
        // Navigate back to Production page (Production Planning tab is active by default or state)
        navigate('/production'); 
      } else {
        alert(res.data?.message || 'Failed to save plan');
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Error saving plan');
    }
  };

  return (
    <div className="add-today-plan-page p-6">
      <div className="add-today-plan-header">
        <button className="add-today-plan-back-btn" onClick={() => navigate('/production')} aria-label="Go back">
          <IconArrowLeft size={24} />
        </button>
        <h2 className="add-today-plan-title">{editingPlanId ? 'Edit Today Plan' : 'Add Today Plan'}</h2>
      </div>
      
      <div className="add-today-plan-body">
        {/* Grid for top fields */}
        <div className="plan-form-grid">
          <div className="form-group">
            <label className="plan-form-label">Date</label>
            <input type="date" className="plan-form-input" value={planFormData.date} onChange={(e) => setPlanFormData({...planFormData, date: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="plan-form-label">Line</label>
            <select className="plan-form-input" value={planFormData.line} onChange={(e) => setPlanFormData({...planFormData, line: e.target.value})}>
              <option value="R-Test Line">R-Test Line</option>
              <option value="Vacutainer Line">Vacutainer Line</option>
              <option value="Packing Line">Packing Line</option>
              <option value="Extraction Line">Extraction Line</option>
              <option value="Printing Line">Printing Line</option>
              <option value="I-Sugar Line">I-Sugar Line</option>
              <option value="PCR & Filling Line">PCR & Filling Line</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label className="plan-form-label">Supervisor</label>
            <input type="text" className="plan-form-input" value={planFormData.supervisor} onChange={(e) => setPlanFormData({...planFormData, supervisor: e.target.value})} placeholder="Enter supervisor name" />
          </div>
          <div className="form-group">
            <label className="plan-form-label">PO</label>
            <Select
              options={openPOs.map(po => ({ value: po.DocNum, label: po.DocNum.toString() }))}
              value={planFormData.po ? { value: planFormData.po, label: planFormData.po.toString() } : null}
              onChange={(selected) => setPlanFormData({...planFormData, po: selected ? selected.value : ''})}
              placeholder="Select PO"
              isClearable
              isSearchable
              menuPortalTarget={document.body}
              menuPosition="fixed"
              styles={{
                control: (base, state) => ({
                  ...base,
                  border: state.isFocused ? '1px solid #3b82f6' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  minHeight: '42px',
                  fontSize: '0.9rem',
                  boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
                  backgroundColor: state.isFocused ? '#fff' : '#f9fafb',
                  transition: 'all 0.2s',
                  '&:hover': {
                    border: state.isFocused ? '1px solid #3b82f6' : '1px solid #e5e7eb'
                  }
                }),
                menuPortal: base => ({ ...base, zIndex: 9999 })
              }}
            />
          </div>
          <div className="form-group">
            <label className="plan-form-label">Machine</label>
            <Select
              isMulti
              options={machines.map(m => ({ value: m.ItemName, label: m.ItemName }))}
              value={(() => {
                try {
                  const parsed = JSON.parse(planFormData.machine || '[]');
                  return Array.isArray(parsed) ? parsed.map(m => ({ value: m, label: m })) : [];
                } catch (e) {
                  return [];
                }
              })()}
              onChange={(selected) => setPlanFormData({...planFormData, machine: JSON.stringify(selected ? selected.map(s => s.value) : [])})}
              placeholder="Select Machines"
              isClearable
              isSearchable
              menuPortalTarget={document.body}
              menuPosition="fixed"
              styles={{
                control: (base, state) => ({
                  ...base,
                  border: state.isFocused ? '1px solid #3b82f6' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  minHeight: '42px',
                  fontSize: '0.9rem',
                  boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
                  backgroundColor: state.isFocused ? '#fff' : '#f9fafb',
                  transition: 'all 0.2s',
                  '&:hover': {
                    border: state.isFocused ? '1px solid #3b82f6' : '1px solid #e5e7eb'
                  }
                }),
                menuPortal: base => ({ ...base, zIndex: 9999 })
              }}
            />
          </div>
        </div>

        {/* Manpower Details Section */}
        <div>
          <h3 className="add-today-plan-section-title">Manpower Productivity</h3>
          <div className="plan-form-grid">
            <div className="form-group">
              <label className="plan-form-label">Shift</label>
              <input type="text" className="plan-form-input" name="shift" value={planFormData.shift} onChange={handlePlanFormChange} placeholder="Enter Shift" />
            </div>
            <div className="form-group">
              <label className="plan-form-label">Planned Manpower</label>
              <input type="number" className="plan-form-input" name="plannedManpower" value={planFormData.plannedManpower} onChange={handlePlanFormChange} placeholder="Enter Planned Manpower" />
            </div>
            <div className="form-group">
              <label className="plan-form-label">Actual Manpower</label>
              <input type="number" className="plan-form-input" name="actualManpower" value={planFormData.actualManpower} onChange={handlePlanFormChange} placeholder="Enter Actual Manpower" />
            </div>
            <div className="form-group">
              <label className="plan-form-label">Working Hours</label>
              <input type="number" className="plan-form-input" name="workingHours" value={planFormData.workingHours} onChange={handlePlanFormChange} placeholder="Enter Working Hours" />
            </div>
            <div className="form-group">
              <label className="plan-form-label">Production Qty</label>
              <input type="number" className="plan-form-input" name="productionQty" value={planFormData.productionQty} onChange={handlePlanFormChange} placeholder="Enter Production Qty" />
            </div>
            <div className="form-group">
              <label className="plan-form-label">Standard Units / Man-Hour</label>
              <input type="number" className="plan-form-input" name="standardUnitsPerHour" value={planFormData.standardUnitsPerHour} onChange={handlePlanFormChange} placeholder="Enter Standard Units" />
            </div>
            <div className="form-group">
              <label className="plan-form-label">Total Man-Hours</label>
              <input type="number" className="plan-form-input" name="totalManHours" value={planFormData.totalManHours} onChange={handlePlanFormChange} placeholder="Auto-calculated (Editable)" />
            </div>
            <div className="form-group">
              <label className="plan-form-label">Units / Man-Hour</label>
              <input type="number" className="plan-form-input" name="unitsPerManHour" value={planFormData.unitsPerManHour} onChange={handlePlanFormChange} placeholder="Auto-calculated (Editable)" />
            </div>
            <div className="form-group">
              <label className="plan-form-label">Productivity %</label>
              <input type="number" className="plan-form-input" name="productivity" value={planFormData.productivity} onChange={handlePlanFormChange} placeholder="Auto-calculated (Editable)" />
            </div>
            <div className="form-group-full">
              <label className="plan-form-label">Remarks</label>
              <input type="text" className="plan-form-input" name="remarks" value={planFormData.remarks} onChange={handlePlanFormChange} placeholder="Enter Remarks" />
            </div>
          </div>
        </div>

        {/* Assign Employee Section */}
        <div>
          <h3 className="add-today-plan-section-title">Assign Employee</h3>
          <div className="plan-items-container">
            <table className="plan-items-table">
              <thead className="plan-items-thead">
                <tr>
                  <th className="plan-items-th col-name">Name</th>
                  <th className="plan-items-th col-jd">J.D</th>
                  <th className="plan-items-th col-action">Action</th>
                </tr>
              </thead>
              <tbody>
                {planFormData.jdItems.map((item, idx) => (
                  <tr key={idx} className="plan-items-tr">
                    <td className="plan-items-td">
                      <input type="text" className="plan-item-input" value={item.name} onChange={(e) => handleJdItemChange(idx, 'name', e.target.value)} placeholder="Enter name" />
                    </td>
                    <td className="plan-items-td">
                      <input type="text" className="plan-item-input" value={item.jd} onChange={(e) => handleJdItemChange(idx, 'jd', e.target.value)} placeholder="Enter J.D" />
                    </td>
                    <td className="plan-items-td center">
                      <Button variant="danger" size="sm" onClick={() => handleRemoveJdItem(idx)}>Remove</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="plan-items-footer">
              <Button variant="secondary" size="sm" onClick={handleAddJdItem}>+ Add employee</Button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="plan-modal-actions add-today-plan-actions">
          <Button variant="secondary" onClick={() => navigate('/production')}>Cancel</Button>
          <Button variant="primary" onClick={handleSavePlan}>{editingPlanId ? 'Update' : 'Save'}</Button>
        </div>
      </div>
    </div>
  );
};

export default AddTodayPlan;
