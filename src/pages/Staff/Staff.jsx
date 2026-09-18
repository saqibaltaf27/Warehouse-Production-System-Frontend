import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { IconEdit } from '@tabler/icons-react';
import Table from '../../global-components/Table/Table';
import Button from '../../global-components/Button/Button';
import GlobalPopup from '../../global-components/GlobalPopup/GlobalPopup';
import Input from '../../global-components/Input/Input';
import { axiosInstance } from '../../apis/axiosinstance';
import { API_ENDPOINTS } from '../../apis/endpoints';
import './Staff.css';

const Staff = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [staffData, setStaffData] = useState([]);
  const [editStaffId, setEditStaffId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    address: '',
    designation: '',
    salary: '',
    status: '1'
  });

  const fetchStaff = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get(API_ENDPOINTS.STAFF.GET_STAFF);
      if (res.data.success) {
        setStaffData(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const openAddModal = () => {
    setEditStaffId(null);
    setFormData({
      name: '',
      number: '',
      address: '',
      designation: '',
      salary: '',
      status: '1'
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (staff) => {
    setEditStaffId(staff.StaffID);
    setFormData({
      name: staff.Name || '',
      number: staff.PhoneNumber || '',
      address: staff.Address || '',
      designation: staff.Designation || '',
      salary: staff.WageSalary || '',
      status: staff.Status === 1 || staff.Status === true ? '1' : '0'
    });
    setIsAddModalOpen(true);
  };

  const columns = [
    { header: 'Name', key: 'Name', align: 'left' },
    { header: 'Number', key: 'PhoneNumber', align: 'left' },
    { header: 'Address', key: 'Address', align: 'left' },
    { header: 'Designation', key: 'Designation', align: 'left' },
    { header: 'Wage/Salary', key: 'WageSalary', align: 'right' },
    { 
      header: 'Actions', 
      key: 'actions', 
      align: 'center',
      render: (row) => (
        <button 
          className="dome-table-action-btn dome-table-action-btn--info"
          onClick={() => openEditModal(row)}
          title="Edit"
          style={{ cursor: 'pointer' }}
        >
          <IconEdit size={16} stroke={2} />
        </button>
      ) 
    },
  ];

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    // Map the input id back to our formData keys
    const keyMap = {
      'staff-name': 'name',
      'staff-number': 'number',
      'staff-address': 'address',
      'staff-designation': 'designation',
      'staff-salary': 'salary',
      'staff-status': 'status'
    };
    const key = keyMap[id] || id;
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveStaff = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    
    try {
      setIsSaving(true);
      const payload = {
        name: formData.name,
        phoneNumber: formData.number,
        address: formData.address,
        designation: formData.designation,
        wageSalary: formData.salary,
        status: formData.status
      };
      
      let response;
      if (editStaffId) {
        response = await axiosInstance.put(API_ENDPOINTS.STAFF.UPDATE_STAFF(editStaffId), payload);
      } else {
        response = await axiosInstance.post(API_ENDPOINTS.STAFF.ADD_STAFF, payload);
      }
      
      if (response.data.success) {
        toast.success(response.data.message || `Staff ${editStaffId ? 'updated' : 'added'} successfully!`);
        setIsAddModalOpen(false);
        fetchStaff();
      } else {
        toast.error(response.data.message || `Failed to ${editStaffId ? 'update' : 'add'} staff`);
      }
    } catch (error) {
      console.error('Save staff error:', error);
      toast.error(error.response?.data?.message || `An error occurred while ${editStaffId ? 'updating' : 'adding'} staff`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="staff-container">
      <div className="staff-header">
        <h2>Staff Directory</h2>
        <Button variant="primary" onClick={openAddModal}>
          Add Staff
        </Button>
      </div>
      <div className="staff-content">
        <Table
          data={staffData}
          columns={columns}
          totalEntries={staffData.length}
          showActions={false}
          isLoading={isLoading}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
          onItemsPerPageChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </div>

      {isAddModalOpen && (
        <GlobalPopup
          title={editStaffId ? "Edit Staff" : "Add New Staff"}
          className="staff-popup"
          onClose={() => !isSaving && setIsAddModalOpen(false)}
        >
          <div className="staff-modal-content">
            <h3 style={{ marginTop: 0 }}>{editStaffId ? "Edit Staff" : "Add New Staff"}</h3>
            <table className="staff-form-table">
              <tbody>
                <tr>
                  <td className="staff-form-label-cell"><label htmlFor="staff-name">Name</label></td>
                  <td className="staff-form-input-cell">
                    <input id="staff-name" className="dome-form-input" placeholder="Enter staff name" value={formData.name} onChange={handleInputChange} disabled={isSaving} />
                  </td>
                </tr>
                <tr>
                  <td className="staff-form-label-cell"><label htmlFor="staff-number">Number</label></td>
                  <td className="staff-form-input-cell">
                    <input id="staff-number" className="dome-form-input" placeholder="Enter phone number" value={formData.number} onChange={handleInputChange} disabled={isSaving} />
                  </td>
                </tr>
                <tr>
                  <td className="staff-form-label-cell"><label htmlFor="staff-address">Address</label></td>
                  <td className="staff-form-input-cell">
                    <input id="staff-address" className="dome-form-input" placeholder="Enter address" value={formData.address} onChange={handleInputChange} disabled={isSaving} />
                  </td>
                </tr>
                <tr>
                  <td className="staff-form-label-cell"><label htmlFor="staff-designation">Designation</label></td>
                  <td className="staff-form-input-cell">
                    <input id="staff-designation" className="dome-form-input" placeholder="Enter designation" value={formData.designation} onChange={handleInputChange} disabled={isSaving} />
                  </td>
                </tr>
                <tr>
                  <td className="staff-form-label-cell"><label htmlFor="staff-salary">Wage/Salary</label></td>
                  <td className="staff-form-input-cell">
                    <input id="staff-salary" type="number" className="dome-form-input" placeholder="Enter wage or salary" value={formData.salary} onChange={handleInputChange} disabled={isSaving} />
                  </td>
                </tr>
                <tr>
                  <td className="staff-form-label-cell"><label htmlFor="staff-status">Status</label></td>
                  <td className="staff-form-input-cell">
                    <select id="staff-status" className="dome-form-input" value={formData.status} onChange={handleInputChange} disabled={isSaving}>
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="staff-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <Button variant="secondary" onClick={() => setIsAddModalOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveStaff} isLoading={isSaving}>
                {editStaffId ? "Save Changes" : "Save Staff"}
              </Button>
            </div>
          </div>
        </GlobalPopup>
      )}
    </div>
  );
};

export default Staff;
