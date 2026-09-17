import React, { useState, useEffect, useCallback } from 'react';
import Table from '../../global-components/Table/Table';
import Button from '../../global-components/Button/Button';
import GlobalPopup from '../../global-components/GlobalPopup/GlobalPopup';
import { IconPlus } from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';
import { axiosInstance } from '../../apis/axiosinstance';
import { API_ENDPOINTS } from '../../apis/endpoints';
import toast from 'react-hot-toast';
import './ProductionPlanning.css';

const ManEfficiencyTab = () => {
  const { user } = useAuth();
  const empId = user?.empId || user?.EmpID || user?.id || user?.emp_id || '';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    productionLine: '',
    qty: '',
    hours: ''
  });

  const columns = [
    { key: 'Id', header: 'ID' },
    { key: 'Name', header: 'Name' },
    { key: 'ProductionLine', header: 'Production Line' },
    { key: 'Qty', header: 'Qty' },
    { key: 'Hour', header: 'Hours' },
    { key: 'CreatedBy', header: 'Created By' },
    { 
      key: 'CreatedDate', 
      header: 'Created Date', 
      render: (r) => r.CreatedDate ? new Date(r.CreatedDate).toLocaleDateString() : '-'
    }
  ];

  const fetchData = useCallback(async () => {
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.PRODUCTION_PLANNING.MAN_EFFICIENCY);
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching man efficiency data:", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!formData.name || !formData.productionLine || !formData.hours || !formData.qty) {
      toast.error("Please fill all required fields.");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        productionLine: formData.productionLine,
        qty: parseInt(formData.qty) || 0,
        hours: parseFloat(formData.hours) || 0,
        createdBy: String(empId)
      };
      const res = await axiosInstance.post(API_ENDPOINTS.PRODUCTION_PLANNING.MAN_EFFICIENCY, payload);
      if (res.data?.success) {
        setIsModalOpen(false);
        setFormData({ name: '', productionLine: '', qty: '', hours: '' });
        fetchData();
        toast.success("Man Efficiency saved successfully!");
      } else {
        toast.error(res.data?.message || 'Failed to save');
      }
    } catch (error) {
      console.error("Error saving man efficiency data:", error);
      toast.error('Error saving data');
    }
  };

  return (
    <div className="planning-section">
      <div className="planning-section-header">
        <div>
          <h3>Man Efficiency</h3>
          <p className="section-desc">Track and manage manual labor efficiency metrics.</p>
        </div>
        <Button variant="primary" icon={<IconPlus size={16} />} onClick={() => setIsModalOpen(true)}>
          Add Man Efficiency
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
      <h3>Add Man Efficiency</h3> 
    </div> 

    <form className="man-efficiency-form" onSubmit={handleSubmit}> 

      <div className="form-group"> 
        <label>Name</label> 
        <input 
          type="text" 
          name="name" 
          value={formData.name} 
          onChange={handleInputChange} 
        /> 
      </div> 

      <div className="form-group"> 
        <label>Production Line</label> 
        <input 
          type="text" 
          name="productionLine" 
          value={formData.productionLine} 
          onChange={handleInputChange} 
        /> 
      </div> 

      <div className="form-group"> 
        <label>Hour</label> 
        <input 
          type="number" 
          step="any"
          name="hours" 
          value={formData.hours} 
          onChange={handleInputChange} 
        /> 
      </div> 

      <div className="form-group"> 
        <label>Qty</label> 
        <input 
          type="number" 
          name="qty" 
          value={formData.qty} 
          onChange={handleInputChange} 
        /> 
      </div> 

      <div className="form-actions mt-4"> 
        <Button 
          type="button" 
          variant="secondary" 
          onClick={() => setIsModalOpen(false)}
        >
          Cancel
        </Button> 

        <Button type="button" variant="primary" onClick={handleSubmit}>
          Save
        </Button> 
      </div> 

    </form> 
  </GlobalPopup> 
)}
    </div>
  );
};

export default ManEfficiencyTab;
