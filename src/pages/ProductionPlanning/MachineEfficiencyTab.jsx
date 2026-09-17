import React, { useState, useEffect, useCallback } from 'react';
import Table from '../../global-components/Table/Table';
import Button from '../../global-components/Button/Button';
import GlobalPopup from '../../global-components/GlobalPopup/GlobalPopup';
import { IconPlus } from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';
import { axiosInstance } from '../../apis/axiosinstance';
import { API_ENDPOINTS } from '../../apis/endpoints';
import toast from 'react-hot-toast';
import Select from 'react-select';
import './ProductionPlanning.css';

const MachineEfficiencyTab = () => {
  const { user } = useAuth();
  const empId = user?.empId || user?.EmpID || user?.id || user?.emp_id || '';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState([]);
  const [machineList, setMachineList] = useState([]);
  
  const [formData, setFormData] = useState({
    itemCode: '',
    machine: '',
    totalHour: '',
    totalQuantityProduced: ''
  });

  const columns = [
    { key: 'Id', header: 'ID' },
    { key: 'ItemCode', header: 'Item Code' },
    { key: 'Machine', header: 'Machine' },
    { key: 'TotalHours', header: 'Total Hours' },
    { key: 'TotalQuantityProduced', header: 'Total Quantity' },
    { key: 'CreatedBy', header: 'Created By' },
    { 
      key: 'CreatedDate', 
      header: 'Created Date', 
      render: (r) => r.CreatedDate ? new Date(r.CreatedDate).toLocaleDateString() : '-'
    }
  ];

  const fetchData = useCallback(async () => {
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.PRODUCTION_PLANNING.MACHINE_EFFICIENCY_API);
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching machine efficiency data:", error);
    }
  }, []);

  const fetchMachines = useCallback(async () => {
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.MACHINE.GET_MACHINES_LIST);
      if (res.data?.success) {
        setMachineList(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching machines list:", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchMachines();
  }, [fetchData, fetchMachines]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMachineSelect = (selectedOption) => {
    setFormData(prev => ({
      ...prev,
      itemCode: selectedOption ? selectedOption.value : '',
      machine: selectedOption ? selectedOption.description : ''
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!formData.itemCode || !formData.machine || !formData.totalHour || !formData.totalQuantityProduced) {
      toast.error("Please fill all required fields.");
      return;
    }

    try {
      const payload = {
        itemCode: formData.itemCode,
        machine: formData.machine,
        totalQuantityProduced: parseInt(formData.totalQuantityProduced) || 0,
        totalHours: parseFloat(formData.totalHour) || 0,
        createdBy: String(empId)
      };
      const res = await axiosInstance.post(API_ENDPOINTS.PRODUCTION_PLANNING.MACHINE_EFFICIENCY_API, payload);
      if (res.data?.success) {
        setIsModalOpen(false);
        setFormData({ itemCode: '', machine: '', totalHour: '', totalQuantityProduced: '' });
        fetchData();
        toast.success("Machine Efficiency saved successfully!");
      } else {
        toast.error(res.data?.message || 'Failed to save');
      }
    } catch (error) {
      console.error("Error saving machine efficiency data:", error);
      toast.error('Error saving data');
    }
  };

  const machineOptions = machineList.map(m => ({
    value: m.Code,
    label: `${m.Code} - ${m.Description}`,
    description: m.Description
  }));

  const selectedMachine = formData.itemCode 
    ? { value: formData.itemCode, label: `${formData.itemCode} - ${formData.machine}` } 
    : null;

  return (
    <div className="planning-section">
      <div className="planning-section-header">
        <div>
          <h3>Machine Efficiency</h3>
          <p className="section-desc">Track and manage machine utilization and productivity metrics.</p>
        </div>
        <Button variant="primary" icon={<IconPlus size={16} />} onClick={() => setIsModalOpen(true)}>
          Add Machine Efficiency
        </Button>
      </div>
      
      <Table
        data={data}
        columns={columns}
        totalEntries={data.length}
        showActions={false}
        showPagination={true}
        currentPage={1}
        pageSize={10}
        onPageChange={() => {}}
        onItemsPerPageChange={() => {}}
      />

      {isModalOpen && (
        <GlobalPopup onClose={() => setIsModalOpen(false)} className="man-efficiency-popup large">
          <div className="man-efficiency-modal-header">
            <h3>Add Machine Efficiency</h3>
          </div>
          <form className="man-efficiency-form" onSubmit={handleSubmit}>
            <div className="manpower-grid">
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Machine (Code - Description)</label>
                <Select
                  options={machineOptions}
                  value={selectedMachine}
                  onChange={handleMachineSelect}
                  placeholder="Search and select machine..."
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
                <label>Total Hours</label>
                <input type="number" name="totalHour" step="any" value={formData.totalHour} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Total Quantity Produced</label>
                <input type="number" name="totalQuantityProduced" value={formData.totalQuantityProduced} onChange={handleInputChange} />
              </div>
            </div>
            
            <div className="form-actions mt-4">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="button" variant="primary" onClick={handleSubmit}>Save</Button>
            </div>
          </form>
        </GlobalPopup>
      )}
    </div>
  );
};

export default MachineEfficiencyTab;
