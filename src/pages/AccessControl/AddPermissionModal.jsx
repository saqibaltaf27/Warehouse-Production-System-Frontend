import React, { useState, useEffect } from 'react';
import { IconX } from '@tabler/icons-react';
import { aclApi } from '../../apis/acl/acl';
import toast from 'react-hot-toast';
import './AddPermissionModal.css';

const AddPermissionModal = ({ isOpen, onClose, editData, refreshData }) => {
  const [formData, setFormData] = useState({
    Title: '', Route: '', Method: 'GET', AccessText: '',
    main_module: '', sub_module: '', child_module: '', child_module_last: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editData) {
      setFormData({
        Title: editData.Title || '',
        Route: editData.Route || '',
        Method: editData.Method || 'GET',
        AccessText: editData.AccessText || '',
        main_module: editData.main_module || '',
        sub_module: editData.sub_module || '',
        child_module: editData.child_module || '',
        child_module_last: editData.child_module_last || ''
      });
    } else {
      setFormData({
        Title: '', Route: '', Method: 'GET', AccessText: '',
        main_module: '', sub_module: '', child_module: '', child_module_last: ''
      });
    }
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      let res;
      if (editData) {
        res = await aclApi.updatePermission(editData.Id, formData);
      } else {
        res = await aclApi.addPermission(formData);
      }

      if (res.data.success) {
        toast.success(`Permission ${editData ? 'updated' : 'created'} successfully!`);
        refreshData && refreshData();
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error saving permission');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ap-modal-overlay">
      <div className="ap-modal-container">
        
        {/* Modal Header */}
        <div className="ap-modal-header">
          <div className="ap-modal-header-text">
            <h2>{editData ? 'Edit Permission' : 'Add Permission'}</h2>
            <p>{editData ? 'Modify the existing permission entry' : 'Create a new permission entry'}</p>
          </div>
          <button className="ap-modal-close-btn" onClick={onClose}>
            <IconX size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="ap-modal-body">
          <div className="ap-form-grid">
            
            <div className="ap-form-group">
              <label>Title *</label>
              <input type="text" name="Title" value={formData.Title} onChange={handleChange} placeholder="Permission List" />
            </div>

            <div className="ap-form-group">
              <label>Route *</label>
              <input type="text" name="Route" value={formData.Route} onChange={handleChange} placeholder="/permissions" />
            </div>

            <div className="ap-form-group">
              <label>Method *</label>
              <select name="Method" value={formData.Method} onChange={handleChange}>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div className="ap-form-group">
              <label>AccessText *</label>
              <input type="text" name="AccessText" value={formData.AccessText} onChange={handleChange} placeholder="permission.list" />
            </div>

            <div className="ap-form-group">
              <label>main_module *</label>
              <input type="text" name="main_module" value={formData.main_module} onChange={handleChange} placeholder="User Management" />
            </div>

            <div className="ap-form-group">
              <label>sub_module (optional)</label>
              <input type="text" name="sub_module" value={formData.sub_module} onChange={handleChange} placeholder="Users" />
            </div>

            <div className="ap-form-group">
              <label>child_module (optional)</label>
              <input type="text" name="child_module" value={formData.child_module} onChange={handleChange} placeholder="User Actions" />
              <span className="ap-form-hint">Note: child_module requires sub_module.</span>
            </div>

            <div className="ap-form-group">
              <label>child_module_last (optional)</label>
              <input type="text" name="child_module_last" value={formData.child_module_last} onChange={handleChange} placeholder="Danger Zone" />
              <span className="ap-form-hint">Note: child_module_last requires child_module.</span>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="ap-modal-footer">
          <button className="ap-btn-cancel" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button className="ap-btn-save" onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddPermissionModal;
