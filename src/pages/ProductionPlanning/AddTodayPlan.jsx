import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { axiosInstance } from '../../apis/axiosinstance';
import { API_ENDPOINTS } from '../../apis/endpoints';
import Button from '../../global-components/Button/Button';
import { IconArrowLeft, IconCalendar, IconTrash, IconPlus } from '@tabler/icons-react';
import './ProductionPlanning.css';

const getTodayDate = () => new Date().toISOString().split('T')[0];

const AddTodayPlan = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [editingPlanId, setEditingPlanId] = useState(null);
  const isReadOnly = Boolean(location.state?.readOnly || location.pathname.includes('/view'));
  
  const [openPOs, setOpenPOs] = useState([]);
  const [machines, setMachines] = useState([]);
  const [staffList, setStaffList] = useState([]);

  const getInitialPlanFormData = () => ({
    date: getTodayDate(),
    line: 'R-Test Line',
    machineItems: [{ name: '', qty: '', hours: '' }],
    supervisor: '',
    po: '',
    jdItems: [],
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

      let parsedJdItems = [];
      if (plan.Persons) {
        try {
          const parsed = JSON.parse(plan.Persons);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const savedItems = Array.isArray(plan.jdItems) ? plan.jdItems : [];
            parsedJdItems = parsed.map((p, idx) => ({
              staffId: p.StaffID ?? '',
              jd: p.jd || '',
              hours: p.hours || '8',
              name: p.name || savedItems[idx]?.name || ''
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
      const res = await axiosInstance.get(API_ENDPOINTS.STAFF.GET_STAFF, { params: { limit: 1000 } });
      if (res.data?.success) {
        // Only active staff. The staff API pages results, so ask for the full list
        // or saved employees past the first page render as an empty name.
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

  const allStaffSelected = staffList.length > 0 && staffList.every(s =>
    planFormData.jdItems.some(item =>
      (item.staffId != null && Number(item.staffId) === Number(s.StaffID)) ||
      (item.name && item.name === s.Name)
    )
  );

  const staffSelectOptions = [
    {
      value: '__ALL__',
      label: '★ All Staff (Include All)',
      isAll: true
    },
    ...staffList.map(s => ({
      value: s.StaffID,
      label: s.Name,
      designation: s.Designation,
      address: s.Address,
      staff: s
    }))
  ];

  const selectedStaffOptions = allStaffSelected
    ? [{ value: '__ALL__', label: `All Staff (${staffList.length} employees)`, isAll: true }]
    : planFormData.jdItems
        .filter(item => item.staffId || item.name)
        .map(item => {
          const matched = staffList.find(s => (item.staffId != null && Number(s.StaffID) === Number(item.staffId)) || s.Name === item.name);
          return {
            value: matched ? matched.StaffID : (item.staffId || item.name),
            label: item.name || matched?.Name || 'Staff',
            designation: item.jd || matched?.Designation || '',
            staff: matched
          };
        });

  const handleStaffDropdownChange = (selected, actionMeta) => {
    const { action, option, removedValue } = actionMeta;

    if (action === 'select-option') {
      if (option?.value === '__ALL__') {
        // User selected "All Staff"
        const existingMap = new Map();
        planFormData.jdItems.forEach(item => {
          if (item.staffId != null && item.staffId !== '') existingMap.set(Number(item.staffId), item);
          else if (item.name) existingMap.set(item.name, item);
        });

        const allItems = staffList.map(s => {
          const existing = existingMap.get(Number(s.StaffID)) || existingMap.get(s.Name);
          return {
            staffId: s.StaffID,
            name: s.Name,
            jd: existing?.jd || s.Designation || '',
            hours: existing?.hours || '8'
          };
        });

        // Retain any custom item added that is not in staffList
        const customItems = planFormData.jdItems.filter(
          item => !item.staffId && item.name && !staffList.some(s => s.Name === item.name)
        );

        setPlanFormData(prev => ({
          ...prev,
          jdItems: [...allItems, ...customItems]
        }));
        return;
      }

      // Individual staff selected
      const staff = option?.staff || staffList.find(s => Number(s.StaffID) === Number(option?.value));
      if (staff) {
        const isAlreadyAssigned = planFormData.jdItems.some(
          item => (item.staffId != null && Number(item.staffId) === Number(staff.StaffID)) || item.name === staff.Name
        );

        if (isAlreadyAssigned) {
          // Toggle off if already assigned
          setPlanFormData(prev => ({
            ...prev,
            jdItems: prev.jdItems.filter(
              item => Number(item.staffId) !== Number(staff.StaffID) && item.name !== staff.Name
            )
          }));
        } else {
          // Add this staff
          const newItem = {
            staffId: staff.StaffID,
            name: staff.Name,
            jd: staff.Designation || '',
            hours: '8'
          };
          const filtered = planFormData.jdItems.filter(item => item.name || item.staffId);
          setPlanFormData(prev => ({
            ...prev,
            jdItems: [...filtered, newItem]
          }));
        }
      }
    } else if (action === 'deselect-option') {
      if (option?.value === '__ALL__') {
        setPlanFormData(prev => ({ ...prev, jdItems: [] }));
      } else {
        const staffId = option?.value;
        const staffName = option?.label;
        setPlanFormData(prev => ({
          ...prev,
          jdItems: prev.jdItems.filter(
            item => (item.staffId != null ? Number(item.staffId) !== Number(staffId) : true) && item.name !== staffName
          )
        }));
      }
    } else if (action === 'remove-value' || action === 'pop-value') {
      if (removedValue?.value === '__ALL__') {
        setPlanFormData(prev => ({ ...prev, jdItems: [] }));
      } else {
        const staffId = removedValue?.value;
        const staffName = removedValue?.label;
        setPlanFormData(prev => ({
          ...prev,
          jdItems: prev.jdItems.filter(
            item => (item.staffId != null ? Number(item.staffId) !== Number(staffId) : true) && item.name !== staffName
          )
        }));
      }
    } else if (action === 'clear') {
      setPlanFormData(prev => ({ ...prev, jdItems: [] }));
    }
  };

  const handleAddCustomEmployee = () => {
    setPlanFormData(prev => ({
      ...prev,
      jdItems: [...prev.jdItems, { name: '', jd: '', staffId: '', hours: '8' }]
    }));
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
          .filter(item => item.staffId || item.name?.trim())
          .map(item => ({ StaffID: item.staffId, name: item.name, jd: item.jd, hours: item.hours })),
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
        navigate('/production?tab=production-planning'); 
      } else {
        toast.error(res.data?.message || 'Failed to save plan');
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Error saving plan');
    }
  };

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).replace(/ /g, '-');
};

  return (
    <div className="plan-detail-view-container">
      {/* Header bar: Plan Date on left, View All Plans on right */}
      <div className="plan-header-bar">
        <div className="plan-header-date-wrapper">
          <strong>Plan Date:</strong>
          {isReadOnly ? (
            <span className="plan-header-date-display">{formatDate(planFormData.date)}</span>
          ) : (
            <input
              type="date"
              className="plan-header-date-input"
              value={planFormData.date}
              onChange={(e) => setPlanFormData({ ...planFormData, date: e.target.value })}
            />
          )}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/production?tab=production-planning')}
          icon={<IconArrowLeft size={16} />}
        >
          View All Plans
        </Button>
      </div>

      {/* 2-Column Details Grid */}
      <div className="plan-details-grid">
        {/* Left Column */}
        <div className="plan-details-column">
          <div className="plan-detail-row">
            <strong>Line:</strong>
            {isReadOnly ? (
              <span className="plan-detail-val">{planFormData.line || '-'}</span>
            ) : (
              <select
                className="plan-detail-input"
                value={planFormData.line}
                onChange={(e) => setPlanFormData({ ...planFormData, line: e.target.value })}
              >
                <option value="R-Test Line">R-Test Line</option>
                <option value="Vacutainer Line">Vacutainer Line</option>
                <option value="Packing Line">Packing Line</option>
                <option value="Extraction Line">Extraction Line</option>
                <option value="Printing Line">Printing Line</option>
                <option value="I-Sugar Line">I-Sugar Line</option>
                <option value="PCR & Filling Line">PCR & Filling Line</option>
                <option value="Other">Other</option>
              </select>
            )}
          </div>

          <div className="plan-detail-row" style={{ marginTop: '12px' }}>
            <strong>Supervisor:</strong>
            {isReadOnly ? (
              <span className="plan-detail-val">{planFormData.supervisor || '-'}</span>
            ) : (
              <input
                type="text"
                className="plan-detail-input"
                value={planFormData.supervisor}
                onChange={(e) => setPlanFormData({ ...planFormData, supervisor: e.target.value })}
                placeholder="Enter supervisor name"
              />
            )}
          </div>

          <div className="plan-detail-row" style={{ marginTop: '12px' }}>
            <strong>PO:</strong>
            {isReadOnly ? (
              <span className="plan-detail-val">{planFormData.po || '-'}</span>
            ) : (
              <Select
                options={openPOs.map(po => ({ value: po.DocNum, label: po.DocNum.toString() }))}
                value={planFormData.po ? { value: planFormData.po, label: planFormData.po.toString() } : null}
                onChange={(selected) => setPlanFormData({ ...planFormData, po: selected ? selected.value : '' })}
                placeholder="Select PO"
                isClearable
                isSearchable
                menuPortalTarget={document.body}
                menuPosition="fixed"
                styles={{
                  control: (base, state) => ({
                    ...base,
                    border: state.isFocused ? '1px solid #1b47db' : '1px solid #e5e7eb',
                    borderRadius: '3px',
                    minHeight: '32px',
                    height: '32px',
                    fontSize: '13px',
                    boxShadow: 'none',
                    backgroundColor: '#f3f4f6',
                  }),
                  valueContainer: (base) => ({
                    ...base,
                    padding: '0 8px',
                    height: '30px',
                  }),
                  indicatorsContainer: (base) => ({
                    ...base,
                    height: '30px',
                  }),
                  menuPortal: base => ({ ...base, zIndex: 9999 })
                }}
              />
            )}
          </div>

          <div className="plan-detail-row" style={{ marginTop: '12px' }}>
            <strong>Shift:</strong>
            {isReadOnly ? (
              <span className="plan-detail-val">{planFormData.shift || '-'}</span>
            ) : (
              <input
                type="text"
                className="plan-detail-input"
                name="shift"
                value={planFormData.shift}
                onChange={handlePlanFormChange}
                placeholder="Enter Shift"
              />
            )}
          </div>

          <div className="plan-detail-row" style={{ marginTop: '12px' }}>
            <strong>Planned Manpower:</strong>
            {isReadOnly ? (
              <span className="plan-detail-val">{planFormData.plannedManpower !== '' && planFormData.plannedManpower != null ? planFormData.plannedManpower : '-'}</span>
            ) : (
              <input
                type="number"
                className="plan-detail-input"
                name="plannedManpower"
                value={planFormData.plannedManpower}
                onChange={handlePlanFormChange}
                placeholder="Enter Planned Manpower"
              />
            )}
          </div>

          <div className="plan-detail-row" style={{ marginTop: '12px' }}>
            <strong>Actual Manpower:</strong>
            {isReadOnly ? (
              <span className="plan-detail-val">{planFormData.actualManpower !== '' && planFormData.actualManpower != null ? planFormData.actualManpower : '-'}</span>
            ) : (
              <input
                type="number"
                className="plan-detail-input"
                name="actualManpower"
                value={planFormData.actualManpower}
                onChange={handlePlanFormChange}
                placeholder="Enter Actual Manpower"
              />
            )}
          </div>

          <div className="plan-detail-row" style={{ marginTop: '12px' }}>
            <strong>Working Hours:</strong>
            {isReadOnly ? (
              <span className="plan-detail-val">{planFormData.workingHours !== '' && planFormData.workingHours != null ? planFormData.workingHours : '-'}</span>
            ) : (
              <input
                type="number"
                className="plan-detail-input"
                name="workingHours"
                value={planFormData.workingHours}
                onChange={handlePlanFormChange}
                placeholder="Enter Working Hours"
              />
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="plan-details-column">
          <div className="plan-detail-row">
            <strong>Production Qty:</strong>
            {isReadOnly ? (
              <span className="plan-detail-val">{planFormData.productionQty !== '' && planFormData.productionQty != null ? planFormData.productionQty : '-'}</span>
            ) : (
              <input
                type="number"
                className="plan-detail-input"
                name="productionQty"
                value={planFormData.productionQty}
                onChange={handlePlanFormChange}
                placeholder="Enter Production Qty"
              />
            )}
          </div>

          <div className="plan-detail-row" style={{ marginTop: '12px' }}>
            <strong>Std Units / Man-Hour:</strong>
            {isReadOnly ? (
              <span className="plan-detail-val">{planFormData.standardUnitsPerHour !== '' && planFormData.standardUnitsPerHour != null ? planFormData.standardUnitsPerHour : '-'}</span>
            ) : (
              <input
                type="number"
                className="plan-detail-input"
                name="standardUnitsPerHour"
                value={planFormData.standardUnitsPerHour}
                onChange={handlePlanFormChange}
                placeholder="Enter Standard Units"
              />
            )}
          </div>

          <div className="plan-detail-row" style={{ marginTop: '12px' }}>
            <strong>Total Man-Hours:</strong>
            {isReadOnly ? (
              <span className="plan-detail-val">{planFormData.totalManHours !== '' && planFormData.totalManHours != null ? planFormData.totalManHours : '-'}</span>
            ) : (
              <input
                type="number"
                className="plan-detail-input"
                name="totalManHours"
                value={planFormData.totalManHours}
                onChange={handlePlanFormChange}
                placeholder="Auto-calculated"
              />
            )}
          </div>

          <div className="plan-detail-row" style={{ marginTop: '12px' }}>
            <strong>Units / Man-Hour:</strong>
            {isReadOnly ? (
              <span className="plan-detail-val">{planFormData.unitsPerManHour !== '' && planFormData.unitsPerManHour != null ? planFormData.unitsPerManHour : '-'}</span>
            ) : (
              <input
                type="number"
                className="plan-detail-input"
                name="unitsPerManHour"
                value={planFormData.unitsPerManHour}
                onChange={handlePlanFormChange}
                placeholder="Auto-calculated"
              />
            )}
          </div>

          <div className="plan-detail-row" style={{ marginTop: '12px' }}>
            <strong>Productivity %:</strong>
            {isReadOnly ? (
              <span className="plan-detail-val">{planFormData.productivity !== '' && planFormData.productivity != null ? `${planFormData.productivity}%` : '-'}</span>
            ) : (
              <input
                type="number"
                className="plan-detail-input"
                name="productivity"
                value={planFormData.productivity}
                onChange={handlePlanFormChange}
                placeholder="Auto-calculated"
              />
            )}
          </div>

          <div className="plan-detail-row" style={{ marginTop: '12px' }}>
            <strong>Remarks:</strong>
            {isReadOnly ? (
              <span className="plan-detail-val">{planFormData.remarks || '-'}</span>
            ) : (
              <input
                type="text"
                className="plan-detail-input"
                name="remarks"
                value={planFormData.remarks}
                onChange={handlePlanFormChange}
                placeholder="Enter Remarks"
              />
            )}
          </div>
        </div>
      </div>

      {/* Tables Section matching image Components table */}
      {/* Assigned Machines */}
      <div className="plan-table-section">
        <div className="plan-table-header-row">
          <h3>Assigned Machines</h3>
          {!isReadOnly && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleAddMachineItem}
              icon={<IconPlus size={14} />}
            >
              Add Machine
            </Button>
          )}
        </div>
        <div className="plan-table-container">
          <table className="plan-image-table">
            <thead>
              <tr>
                <th style={{ width: '45%' }}>Machine</th>
                <th style={{ width: '25%' }}>Produced Qty</th>
                <th style={{ width: '20%' }}>Run Hours</th>
                {!isReadOnly && <th style={{ width: '10%', textAlign: 'center' }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {planFormData.machineItems.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    {isReadOnly ? (
                      item.name || '-'
                    ) : (
                      <select
                        className="plan-table-input"
                        value={item.name}
                        onChange={(e) => handleMachineItemChange(idx, 'name', e.target.value)}
                      >
                        <option value="">Select Machine</option>
                        {machines.map(m => (
                          <option key={m.ItemName} value={m.ItemName}>{m.ItemName}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>
                    {isReadOnly ? (
                      item.qty || '-'
                    ) : (
                      <input
                        type="number"
                        className="plan-table-input"
                        value={item.qty}
                        onChange={(e) => handleMachineItemChange(idx, 'qty', e.target.value)}
                        placeholder="0"
                      />
                    )}
                  </td>
                  <td>
                    {isReadOnly ? (
                      item.hours || '-'
                    ) : (
                      <input
                        type="number"
                        className="plan-table-input"
                        value={item.hours}
                        onChange={(e) => handleMachineItemChange(idx, 'hours', e.target.value)}
                        placeholder="0"
                      />
                    )}
                  </td>
                  {!isReadOnly && (
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="plan-table-del-btn"
                        title="Remove Machine"
                        onClick={() => handleRemoveMachineItem(idx)}
                      >
                        <IconTrash size={15} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {planFormData.machineItems.length === 0 && (
                <tr>
                  <td colSpan={isReadOnly ? 3 : 4} style={{ textAlign: 'center', color: '#9ca3af', padding: '16px' }}>
                    No machines assigned.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assigned Employees */}
      <div className="plan-table-section" style={{ marginTop: '32px' }}>
        <div className="plan-table-header-row" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0 }}>Assigned Employees</h3>
            <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>
              ({planFormData.jdItems.filter(i => i.name || i.staffId).length})
            </span>
          </div>

          {!isReadOnly && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', justifyContent: 'flex-end', minWidth: '320px' }}>
              <div style={{ minWidth: '320px', maxWidth: '480px', flex: '1' }}>
                <Select
                  isMulti
                  closeMenuOnSelect={false}
                  options={staffSelectOptions}
                  value={selectedStaffOptions}
                  onChange={handleStaffDropdownChange}
                  filterOption={(option, rawInput) => {
                    if (!rawInput) return true;
                    const term = rawInput.toLowerCase();
                    if (option.data.isAll) {
                      return 'all staff include all'.includes(term);
                    }
                    const name = (option.data.label || '').toLowerCase();
                    const designation = (option.data.designation || '').toLowerCase();
                    return name.includes(term) || designation.includes(term);
                  }}
                  formatOptionLabel={(option, { context }) => {
                    if (option.isAll) {
                      return (
                        <div style={{ fontWeight: 600, color: allStaffSelected ? '#15803d' : '#1b47db', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <span>★ All Staff (Include All)</span>
                          <span style={{ fontSize: '11px', color: allStaffSelected ? '#15803d' : '#6b7280', fontWeight: 500 }}>
                            {allStaffSelected ? 'All Included' : `(${staffList.length} employees)`}
                          </span>
                        </div>
                      );
                    }
                    if (context === 'value') {
                      return <span>{option.label}</span>;
                    }
                    const isAssigned = planFormData.jdItems.some(
                      item => (option.value != null && Number(item.staffId) === Number(option.value)) || item.name === option.label
                    );
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <div>
                          <div style={{ fontWeight: isAssigned ? 600 : 400, color: isAssigned ? '#1b47db' : '#1f2937' }}>
                            {isAssigned ? '✓ ' : ''}{option.label}
                          </div>
                          {option.designation && (
                            <div style={{ fontSize: '0.75em', color: '#6b7280' }}>{option.designation}</div>
                          )}
                        </div>
                        {isAssigned && (
                          <span style={{ fontSize: '11px', color: '#1b47db', fontWeight: 500, backgroundColor: '#eff6ff', padding: '1px 6px', borderRadius: '3px' }}>
                            Assigned
                          </span>
                        )}
                      </div>
                    );
                  }}
                  placeholder="Select employees or 'All Staff'..."
                  isSearchable
                  hideSelectedOptions={false}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      border: state.isFocused ? '1px solid #1b47db' : '1px solid #cbd5e1',
                      borderRadius: '3px',
                      minHeight: '32px',
                      fontSize: '12.5px',
                      boxShadow: 'none',
                      backgroundColor: '#fff',
                    }),
                    valueContainer: (base) => ({
                      ...base,
                      padding: '2px 6px',
                      maxHeight: '68px',
                      overflowY: 'auto',
                    }),
                    multiValue: (base) => ({
                      ...base,
                      backgroundColor: '#eff6ff',
                      borderRadius: '3px',
                      margin: '2px',
                    }),
                    multiValueLabel: (base) => ({
                      ...base,
                      color: '#1b47db',
                      fontSize: '12px',
                      fontWeight: 500,
                      padding: '1px 6px',
                    }),
                    multiValueRemove: (base) => ({
                      ...base,
                      color: '#1b47db',
                      ':hover': {
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                      },
                    }),
                    menuPortal: base => ({ ...base, zIndex: 9999 })
                  }}
                />
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleAddCustomEmployee}
                icon={<IconPlus size={14} />}
              >
                Add Custom
              </Button>
            </div>
          )}
        </div>
        <div className="plan-table-container">
          <table className="plan-image-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Employee Name</th>
                <th style={{ width: '32%' }}>Designation</th>
                <th style={{ width: '16%' }}>Hours</th>
                {!isReadOnly && <th style={{ width: '12%', textAlign: 'center' }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {planFormData.jdItems.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    {isReadOnly ? (
                      item.name || '-'
                    ) : item.name ? (
                      <span style={{ fontWeight: 500, color: '#1f2937' }}>{item.name}</span>
                    ) : (
                      <input
                        type="text"
                        className="plan-table-input"
                        value={item.name}
                        onChange={(e) => handleJdItemChange(idx, 'name', e.target.value)}
                        placeholder="Enter Employee Name"
                      />
                    )}
                  </td>
                  <td>
                    {isReadOnly ? (
                      item.jd || '-'
                    ) : (
                      <input
                        type="text"
                        className="plan-table-input"
                        value={item.jd}
                        onChange={(e) => handleJdItemChange(idx, 'jd', e.target.value)}
                        placeholder="Designation"
                      />
                    )}
                  </td>
                  <td>
                    {isReadOnly ? (
                      item.hours || '-'
                    ) : (
                      <input
                        type="number"
                        className="plan-table-input"
                        value={item.hours || ''}
                        onChange={(e) => handleJdItemChange(idx, 'hours', e.target.value)}
                        placeholder="8"
                      />
                    )}
                  </td>
                  {!isReadOnly && (
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="plan-table-del-btn"
                        title="Remove Employee"
                        onClick={() => handleRemoveJdItem(idx)}
                      >
                        <IconTrash size={15} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {planFormData.jdItems.length === 0 && (
                <tr>
                  <td colSpan={isReadOnly ? 3 : 4} style={{ textAlign: 'center', color: '#9ca3af', padding: '24px' }}>
                    {isReadOnly ? 'No employees assigned.' : "No employees assigned. Use the dropdown above to select employees or include all staff."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Actions (Cancel / Save or Update) */}
      {!isReadOnly && (
        <div className="plan-footer-actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/production?tab=production-planning')}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSavePlan}
          >
            {editingPlanId ? 'Update Plan' : 'Save Plan'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AddTodayPlan;
