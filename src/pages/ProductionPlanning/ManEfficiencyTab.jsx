import React, { useState } from 'react';
import Table from '../../global-components/Table/Table';
import Button from '../../global-components/Button/Button';
import GlobalPopup from '../../global-components/GlobalPopup/GlobalPopup';
import { IconPlus } from '@tabler/icons-react';
import './ProductionPlanning.css';

const ManEfficiencyTab = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    cnic: '',
    qty: '',
    hours: ''
  });

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'phoneNumber', header: 'Phone Number' },
    { key: 'cnic', header: 'CNIC' },
    { key: 'qty', header: 'Qty' },
    { key: 'hours', header: 'Hours' },
  ];

  const dummyData = [
    { name: 'John Doe', phoneNumber: '123-456-7890', cnic: '12345-6789012-3', qty: '50', hours: '8' },
    { name: 'Jane Smith', phoneNumber: '098-765-4321', cnic: '98765-4321098-7', qty: '60', hours: '7' },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitted Man Efficiency:", formData);
    setIsModalOpen(false);
    setFormData({ name: '', phoneNumber: '', cnic: '', qty: '', hours: '' });
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
            <h3>Add Man Efficiency</h3>
          </div>
          <form className="man-efficiency-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>CNIC</label>
              <input type="text" name="cnic" value={formData.cnic} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Qty</label>
              <input type="number" name="qty" value={formData.qty} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Hours</label>
              <input type="number" name="hours" value={formData.hours} onChange={handleInputChange} required />
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

export default ManEfficiencyTab;
