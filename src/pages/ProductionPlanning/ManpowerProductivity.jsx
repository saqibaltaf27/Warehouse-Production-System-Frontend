import React, { useState, useEffect } from 'react';
import Table from '../../global-components/Table/Table';
import Button from '../../global-components/Button/Button';
import GlobalPopup from '../../global-components/GlobalPopup/GlobalPopup';
import Input from '../../global-components/Input/Input';
import { IconUsers } from '@tabler/icons-react';
import { productionPlanningApi } from '../../apis/production-planning/production-planning';
import { useAuth } from '../../context/AuthContext';
import './ManpowerProductivity.css';

const ExpandableText = ({ text, maxLength = 30 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!text) return null;
  if (text.length <= maxLength) return <span>{text}</span>;
  
  return (
    <span>
      {isExpanded ? text : `${text.slice(0, maxLength)}... `}
      <button 
        type="button" 
        onClick={() => setIsExpanded(!isExpanded)} 
        style={{ color: '#1B47DB', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '12px', fontWeight: 'bold', marginLeft: '5px' }}
      >
        {isExpanded ? 'See less' : 'See more'}
      </button>
    </span>
  );
};

const ManpowerProductivity = () => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
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

  // Track if user manually edited the calculated fields to stop auto-overriding
  const [userEdited, setUserEdited] = useState({
    totalManHours: false,
    unitsPerManHour: false,
    productivity: false
  });

  const fetchData = async (page = currentPage, size = pageSize) => {
    try {
      setIsLoading(true);
      const response = await productionPlanningApi.getManpowerProductivity(page, size);
      if (response.data.success) {
        setData(response.data.data);
        if (response.data.pagination) {
          setTotalEntries(response.data.pagination.totalRecords);
        }
      }
    } catch (error) {
      console.error("Failed to fetch manpower productivity data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, pageSize);
  }, [currentPage, pageSize]);

  useEffect(() => {
    const actual = parseFloat(formData.actualManpower) || 0;
    const hours = parseFloat(formData.workingHours) || 0;
    const qty = parseFloat(formData.productionQty) || 0;
    const stdUnits = parseFloat(formData.standardUnitsPerHour) || 0;

    setFormData(prev => {
      const updates = { ...prev };
      
      const newTotal = actual * hours;
      if (!userEdited.totalManHours) {
        updates.totalManHours = newTotal > 0 ? newTotal.toFixed(2) : '';
      }
      
      const effectiveTotal = parseFloat(updates.totalManHours) || 0;
      const newUnits = effectiveTotal > 0 ? qty / effectiveTotal : 0;
      if (!userEdited.unitsPerManHour) {
        updates.unitsPerManHour = newUnits > 0 ? newUnits.toFixed(2) : '';
      }
      
      const effectiveUnits = parseFloat(updates.unitsPerManHour) || 0;
      const newProd = stdUnits > 0 ? (effectiveUnits / stdUnits) * 100 : 0;
      if (!userEdited.productivity) {
        updates.productivity = newProd > 0 ? newProd.toFixed(2) : '';
      }
      
      return updates;
    });
  }, [formData.actualManpower, formData.workingHours, formData.productionQty, formData.standardUnitsPerHour, userEdited]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    
    // If user types into calculated fields, mark them as user edited
    if (['totalManHours', 'unitsPerManHour', 'productivity'].includes(id)) {
      setUserEdited(prev => ({ ...prev, [id]: true }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        date: formData.date,
        shift: formData.shift,
        plannedManpower: parseFloat(formData.plannedManpower) || null,
        actualManpower: parseFloat(formData.actualManpower) || null,
        workingHours: parseFloat(formData.workingHours) || null,
        totalManHour: parseFloat(formData.totalManHours) || null,
        productionQty: parseFloat(formData.productionQty) || null,
        unitsPerManHour: parseFloat(formData.unitsPerManHour) || null,
        stdUnitsPerManHour: parseFloat(formData.standardUnitsPerHour) || null,
        prdPercentage: parseFloat(formData.productivity) || null,
        remarks: formData.remarks,
        createdBy: user?.EmpID 
      };

      const response = await productionPlanningApi.addManpowerProductivity(payload);
      if (response.data.success) {
        setShowModal(false);
        // Reset form
        setFormData({
          date: new Date().toISOString().split('T')[0],
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
        setUserEdited({ totalManHours: false, unitsPerManHour: false, productivity: false });
        if (currentPage === 1) {
          fetchData(1, pageSize);
        } else {
          setCurrentPage(1);
        }
      }
    } catch (error) {
      console.error("Failed to add manpower productivity:", error);
      alert("Failed to save manpower productivity");
    }
  };

  const columns = [
    { header: 'Date', key: 'Date', render: row => row.Date ? new Date(row.Date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '' },
    { header: 'Shift', key: 'Shift' },
    { header: 'Planned Manpower', key: 'PlannedManpower' },
    { header: 'Actual Manpower', key: 'ActualManpower' },
    { header: 'Working Hours', key: 'WorkingHours' },
    { header: 'Total Man-Hour', key: 'TotalManHour' },
    { header: 'Production Qty', key: 'ProductionQty' },
    { header: 'Units / Man-Hour', key: 'UnitsPerManHour', render: row => row.UnitsPerManHour?.toFixed(2) },
    { header: 'Standard Units / Man-Hour', key: 'StdUnitsPerManHour' },
    { header: 'Productivity %', key: 'PrdPercentage', render: row => `${row.PrdPercentage?.toFixed(2)}%` },
    { header: 'Remarks', key: 'Remarks', render: row => <ExpandableText text={row.Remarks} /> }
  ];

  return (
    <div className="planning-section">
      <div className="d-flex justify-between align-center mb-4">
        <div>
          <h3>Manpower Productivity</h3>
          <p className="section-desc">Track shift-wise manpower and calculate labor productivity.</p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)} icon={<IconUsers size={18} />}>
          Add Manpower
        </Button>
      </div>

      <Table
        data={data}
        columns={columns}
        showPagination={totalEntries >= 10}
        currentPage={currentPage}
        pageSize={pageSize}
        totalEntries={totalEntries}
        onPageChange={(page) => setCurrentPage(page)}
        onItemsPerPageChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        showActions={false}
      />

      {showModal && (
        <GlobalPopup
          title="Add Manpower Productivity"
          onClose={() => setShowModal(false)}
          className="manpower-productivity-modal"
          showClose={false}
        >
          <div className="manpower-modal-content">
            <div className="manpower-modal-header">
              <h2>Add Manpower Productivity</h2>
            </div>
            <div className="manpower-modal-body">
              <form className="manpower-form">
                <Input
                  label="Date"
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                />
                <Input
                  label="Shift"
                  id="shift"
                  type="text"
                  placeholder="Enter Shift"
                  value={formData.shift}
                  onChange={handleChange}
                />
                <Input
                  label="Planned Manpower"
                  id="plannedManpower"
                  type="number"
                  placeholder="Enter Planned Manpower"
                  value={formData.plannedManpower}
                  onChange={handleChange}
                />
                <Input
                  label="Actual Manpower"
                  id="actualManpower"
                  type="number"
                  placeholder="Enter Actual Manpower"
                  value={formData.actualManpower}
                  onChange={handleChange}
                />
                <Input
                  label="Working Hours"
                  id="workingHours"
                  type="number"
                  placeholder="Enter Working Hours"
                  value={formData.workingHours}
                  onChange={handleChange}
                />
                <Input
                  label="Production Qty"
                  id="productionQty"
                  type="number"
                  placeholder="Enter Production Qty"
                  value={formData.productionQty}
                  onChange={handleChange}
                />
                <Input
                  label="Standard Units / Man-Hour"
                  id="standardUnitsPerHour"
                  type="number"
                  placeholder="Enter Standard Units"
                  value={formData.standardUnitsPerHour}
                  onChange={handleChange}
                />
                <Input
                  label="Total Man-Hours"
                  id="totalManHours"
                  type="number"
                  placeholder="Auto-calculated (Editable)"
                  value={formData.totalManHours}
                  onChange={handleChange}
                />
                <Input
                  label="Units / Man-Hour"
                  id="unitsPerManHour"
                  type="number"
                  placeholder="Auto-calculated (Editable)"
                  value={formData.unitsPerManHour}
                  onChange={handleChange}
                />
                <Input
                  label="Productivity %"
                  id="productivity"
                  type="number"
                  placeholder="Auto-calculated (Editable)"
                  value={formData.productivity}
                  onChange={handleChange}
                />
                
                <div className="col-span-2">
                  <Input
                    label="Remarks"
                    id="remarks"
                    type="text"
                    placeholder="Enter Remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                  />
                </div>
              </form>
            </div>
            <div className="manpower-modal-footer">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit}>
                Save Manpower
              </Button>
            </div>
          </div>
        </GlobalPopup>
      )}
    </div>
  );
};

export default ManpowerProductivity;
