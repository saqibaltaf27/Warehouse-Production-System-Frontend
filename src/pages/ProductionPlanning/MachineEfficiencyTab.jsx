import React, { useState } from 'react';
import Table from '../../global-components/Table/Table';
import Button from '../../global-components/Button/Button';
import GlobalPopup from '../../global-components/GlobalPopup/GlobalPopup';
import { IconPlus } from '@tabler/icons-react';
import './ProductionPlanning.css';

const MachineEfficiencyTab = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    machine: '',
    totalHour: '',
    totalQuantityProduced: ''
  });

  const columns = [
    { key: 'machine', header: 'Machine' },
    { key: 'totalHour', header: 'Total Hours' },
    { key: 'totalQuantityProduced', header: 'Total Quantity Produced' },
  ];

  const dummyData = [
    { machine: 'Machine A (Packing)', totalHour: '8', totalQuantityProduced: '1200' },
    { machine: 'Machine B (Mixing)', totalHour: '6.5', totalQuantityProduced: '850' },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitted Machine Efficiency:", formData);
    setIsModalOpen(false);
    setFormData({ machine: '', totalHour: '', totalQuantityProduced: '' });
  };

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
        data={dummyData}
        columns={columns}
        totalEntries={dummyData.length}
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
              <div className="form-group">
                <label>Machine</label>
                <input type="text" name="machine" value={formData.machine} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Total Hours</label>
                <input type="number" name="totalHour" step="0.1" value={formData.totalHour} onChange={handleInputChange} required />
              </div>
              <div className="form-group form-group-full">
                <label>Total Quantity Produced</label>
                <input type="number" name="totalQuantityProduced" value={formData.totalQuantityProduced} onChange={handleInputChange} required />
              </div>
            </div>
            
            <div className="form-actions mt-4">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Save</Button>
            </div>
          </form>
        </GlobalPopup>
      )}
    </div>
  );
};

export default MachineEfficiencyTab;
