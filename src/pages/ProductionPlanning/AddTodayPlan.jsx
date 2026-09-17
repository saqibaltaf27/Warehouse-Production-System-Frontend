import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Select from 'react-select';
import toast from 'react-hot-toast';
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
  const [staffList, setStaffList] = useState([]);

  const getInitialPlanFormData = () => ({
    date: getTodayDate(),
    line: 'R-Test Line',
    machineItems: [{ name: '', qty: '', hours: '' }],
    supervisor: '',
    po: '',
    jdItems: [{ name: '', jd: '', hours: '' }],
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
      
      let parsedMachines = [{ name: '', qty: '', hours: '' }];
      if (plan.Machine) {
        try {
          const parsed = JSON.parse(plan.Machine);
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (typeof parsed[0] === 'string') {
              // Backward compatibility for old string array
              parsedMachines = parsed.map(m => ({ name: m, qty: '', hours: '' }));
            } else {
              parsedMachines = parsed;
            }
          }
        } catch (e) {
          parsedMachines = plan.Machine.split(', ').map(m => ({ name: m, qty: '', hours: '' }));
        }
      }

      let parsedJdItems = [{ name: '', jd: '', hours: '' }];
      if (plan.Persons) {
        try {
          const parsed = JSON.parse(plan.Persons);
          if (Array.isArray(parsed) && parsed.length > 0) {
            parsedJdItems = parsed.map(p => ({
              staffId: p.StaffID,
              jd: p.jd || '',
              hours: p.hours || '',
              name: '' // Will be resolved by the Select component using staffId
            }));
          }
        } catch (e) {
          console.error("Failed to parse Persons", e);
        }
      }

      setPlanFormData({
        date: plan.PlanDate ? plan.PlanDate.split('T')[0] : getTodayDate(),
        line: plan.Line || 'R-Test Line',
        machineItems: parsedMachines,
        supervisor: plan.Supervisor || '',
        po: plan.PO || '',
        jdItems: parsedJdItems,
        shift: plan.Shift !== undefined && plan.Shift !== null ? plan.Shift : '',
        plannedManpower: plan.PlannedManpower !== undefined && plan.PlannedManpower !== null ? plan.PlannedManpower : '',
        actualManpower: plan.ActualManpower !== undefined && plan.ActualManpower !== null ? plan.ActualManpower : '',
        workingHours: plan.WorkingHours !== undefined && plan.WorkingHours !== null ? plan.WorkingHours : '8',
        productionQty: plan.ProductionQty !== undefined && plan.ProductionQty !== null ? plan.ProductionQty : '',
        standardUnitsPerHour: plan.StdUnitsPerManHour !== undefined && plan.StdUnitsPerManHour !== null ? plan.StdUnitsPerManHour : '',
        totalManHours: plan.TotalManHour !== undefined && plan.TotalManHour !== null ? plan.TotalManHour : '',
        unitsPerManHour: plan.UnitsPerManHour !== undefined && plan.UnitsPerManHour !== null ? plan.UnitsPerManHour : '',
        productivity: plan.PrdPercentage !== undefined && plan.PrdPercentage !== null ? plan.PrdPercentage : '',
        remarks: plan.Remarks || ''
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

  const fetchStaff = useCallback(async () => {
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.STAFF.GET_STAFF);
      if (res.data?.success) {
        // Only active staff
        setStaffList(res.data.data.filter(s => s.Status === 1 || s.Status === true));
      }
    } catch (err) {
      console.error('Fetch Staff error:', err);
    }
  }, []);

  useEffect(() => {
    fetchOpenPOs();
    fetchMachines();
    fetchStaff();
  }, [fetchOpenPOs, fetchMachines, fetchStaff]);

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

  const handleEmployeeSelect = (idx, staffId) => {
    const selectedStaff = staffList.find(s => s.StaffID === staffId);
    const newItems = [...planFormData.jdItems];
    if (selectedStaff) {
      newItems[idx].name = selectedStaff.Name;
      newItems[idx].staffId = selectedStaff.StaffID;
      newItems[idx].jd = selectedStaff.Designation || '';
    } else {
      newItems[idx].name = '';
      newItems[idx].staffId = '';
      newItems[idx].jd = '';
    }
    setPlanFormData({ ...planFormData, jdItems: newItems });
  };

  const handleAddJdItem = () => {
    setPlanFormData({ ...planFormData, jdItems: [...planFormData.jdItems, { name: '', jd: '', staffId: '', hours: '' }] });
  };

  const handleRemoveJdItem = (idx) => {
    const newItems = planFormData.jdItems.filter((_, i) => i !== idx);
    setPlanFormData({ ...planFormData, jdItems: newItems });
  };

  const handleMachineItemChange = (idx, field, val) => {
    const newItems = [...planFormData.machineItems];
    newItems[idx][field] = val;
    setPlanFormData({ ...planFormData, machineItems: newItems });
  };

  const handleAddMachineItem = () => {
    setPlanFormData({ ...planFormData, machineItems: [...planFormData.machineItems, { name: '', qty: '', hours: '' }] });
  };

  const handleRemoveMachineItem = (idx) => {
    const newItems = planFormData.machineItems.filter((_, i) => i !== idx);
    setPlanFormData({ ...planFormData, machineItems: newItems });
  };

  const handleSavePlan = async () => {
    try {
      const payload = {
        ...planFormData,
        machineItems: planFormData.machineItems.filter(item => item.name.trim() !== ''),
        jdItems: planFormData.jdItems
          .filter(item => item.staffId || item.name?.trim() !== '' || item.jd?.trim() !== '')
          .map(item => ({ StaffID: item.staffId, jd: item.jd, hours: item.hours })),
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
        toast.success(editingPlanId ? 'Plan updated successfully!' : 'Plan created successfully!');
        // Navigate back to Production page and set active tab
        navigate('/production', { state: { activeTab: 'production-order' } }); 
      } else {
        toast.error(res.data?.message || 'Failed to save plan');
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Error saving plan');
    }
  };

  return (
    <div className="add-today-plan-page p-6">
      <div className="add-today-plan-header">
        <button className="add-today-plan-back-btn" onClick={() => navigate('/production', { state: { activeTab: 'production-order' } })} aria-label="Go back">
          <IconArrowLeft size={24} />
        </button>
        <h2 className="add-today-plan-title">{editingPlanId ? 'Edit Today Plan' : 'Add Today Plans'}</h2>
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

        {/* Assign Machine Section */}
        <div>
          <h3 className="add-today-plan-section-title">Assign Machine</h3>
          <div className="plan-items-container">
            <table className="plan-items-table">
              <thead className="plan-items-thead">
                <tr>
                  <th className="plan-items-th col-name">Machine</th>
                  <th className="plan-items-th col-jd">Produced Qty</th>
                  <th className="plan-items-th col-jd">Run Hours</th>
                  <th className="plan-items-th col-action">Action</th>
                </tr>
              </thead>
              <tbody>
                {planFormData.machineItems.map((item, idx) => (
                  <tr key={idx} className="plan-items-tr">
                    <td className="plan-items-td">
                      <select 
                        className="plan-item-input" 
                        value={item.name} 
                        onChange={(e) => handleMachineItemChange(idx, 'name', e.target.value)}
                      >
                        <option value="">Select Machine</option>
                        {machines.map(m => (
                          <option key={m.ItemName} value={m.ItemName}>{m.ItemName}</option>
                        ))}
                      </select>
                    </td>
                    <td className="plan-items-td">
                      <input type="number" className="plan-item-input" value={item.qty} onChange={(e) => handleMachineItemChange(idx, 'qty', e.target.value)} placeholder="Enter Qty" />
                    </td>
                    <td className="plan-items-td">
                      <input type="number" className="plan-item-input" value={item.hours} onChange={(e) => handleMachineItemChange(idx, 'hours', e.target.value)} placeholder="Enter Hours" />
                    </td>
                    <td className="plan-items-td center">
                      <Button variant="danger" size="sm" onClick={() => handleRemoveMachineItem(idx)}>Remove</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="plan-items-footer">
              <Button variant="secondary" size="sm" onClick={handleAddMachineItem}>+ Add machine</Button>
            </div>
          </div>
        </div>

        {/* Assign Employee Section */}
        <div>
          <h3 className="add-today-plan-section-title">Assign Employees</h3>
          <div className="plan-items-container">
            <table className="plan-items-table">
              <thead className="plan-items-thead">
                <tr>
                  <th className="plan-items-th col-name">Name</th>
                  <th className="plan-items-th col-jd">J.D</th>
                  <th className="plan-items-th col-jd">Hours</th>
                  <th className="plan-items-th col-action">Action</th>
                </tr>
              </thead>
              <tbody>
                {planFormData.jdItems.map((item, idx) => (
                  <tr key={idx} className="plan-items-tr">
                    <td className="plan-items-td" style={{ minWidth: '250px' }}>
                      <Select
                        options={staffList.map(s => ({
                          value: s.StaffID,
                          label: s.Name,
                          staff: s
                        }))}
                        value={
                          item.staffId 
                            ? { value: item.staffId, label: item.name, staff: staffList.find(s => s.StaffID === item.staffId) } 
                            : (item.name ? { value: item.name, label: item.name, staff: staffList.find(s => s.Name === item.name) } : null)
                        }
                        onChange={(selected) => handleEmployeeSelect(idx, selected ? selected.value : '')}
                        formatOptionLabel={(option, { context }) => {
                          const { staff } = option;
                          if (!staff) return option.label;
                          if (context === 'value') {
                            return <span>{staff.Name}</span>;
                          }
                          return (
                            <div>
                              <div><strong>{staff.Name}</strong> {staff.Designation ? `- ${staff.Designation}` : ''}</div>
                              {staff.Address && <div style={{ fontSize: '0.8em', color: '#6b7280', marginTop: '2px' }}>{staff.Address}</div>}
                            </div>
                          );
                        }}
                        placeholder="Select Employee"
                        isSearchable
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        styles={{
                          control: (base, state) => ({
                            ...base,
                            border: state.isFocused ? '1px solid #3b82f6' : '1px solid #e5e7eb',
                            borderRadius: '4px',
                            minHeight: '38px',
                            fontSize: '0.9rem',
                            boxShadow: 'none',
                            backgroundColor: '#fff',
                          }),
                          menuPortal: base => ({ ...base, zIndex: 9999 })
                        }}
                      />
                    </td>
                    <td className="plan-items-td">
                      <input type="text" className="plan-item-input" value={item.jd} onChange={(e) => handleJdItemChange(idx, 'jd', e.target.value)} placeholder="Enter J.D" />
                    </td>
                    <td className="plan-items-td">
                      <input type="number" className="plan-item-input" value={item.hours || ''} onChange={(e) => handleJdItemChange(idx, 'hours', e.target.value)} placeholder="Enter Hours" />
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
          <Button variant="secondary" onClick={() => navigate('/production', { state: { activeTab: 'production-order' } })}>Cancel</Button>
          <Button variant="primary" onClick={handleSavePlan}>{editingPlanId ? 'Update' : 'Save'}</Button>
        </div>
      </div>
    </div>
  );
};

export default AddTodayPlan;
