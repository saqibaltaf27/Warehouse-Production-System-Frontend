import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconRefresh, IconPlus, IconArrowLeft, IconEdit, IconTrash } from '@tabler/icons-react';
import { aclApi } from '../../apis/acl/acl';
import toast from 'react-hot-toast';
import AddPermissionModal from './AddPermissionModal';
import './PermissionControl.css';

const PermissionControl = () => {
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null); // ID of permission to delete
  const [isDeleting, setIsDeleting] = useState(false);

  // Drill-down state
  const [selectedMainModule, setSelectedMainModule] = useState('');
  const [navPath, setNavPath] = useState([]); // Array of selected nodes (e.g., [sub_module, child_module, child_module_last])

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const res = await aclApi.getPermissions();
      if (res.data.success) {
        setPermissions(res.data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  // Compute unique main modules for the dropdown
  const mainModules = useMemo(() => {
    const unique = [...new Set(permissions.map(p => p.main_module).filter(Boolean))];
    return unique.sort();
  }, [permissions]);

  // Set default dropdown value if not set, or reset if deleted
  useEffect(() => {
    if (mainModules.length > 0) {
      if (!selectedMainModule || !mainModules.includes(selectedMainModule)) {
        setSelectedMainModule(mainModules[0]);
        setNavPath([]);
      }
    } else {
      setSelectedMainModule('');
      setNavPath([]);
    }
  }, [mainModules, selectedMainModule]);

  // Handle dropdown change (resets drill-down path)
  const handleMainModuleChange = (e) => {
    setSelectedMainModule(e.target.value);
    setNavPath([]);
  };

  // Determine what nodes to show based on current drill-down level
  const currentView = useMemo(() => {
    if (!selectedMainModule) return { type: 'empty', data: [] };

    let filtered = permissions.filter(p => p.main_module === selectedMainModule);
    let nextLevelProperty = 'sub_module';

    for (let i = 0; i < navPath.length; i++) {
      const node = navPath[i];
      if (i === 0) {
        filtered = filtered.filter(p => p.sub_module === node);
        nextLevelProperty = 'child_module';
      } else if (i === 1) {
        filtered = filtered.filter(p => p.child_module === node);
        nextLevelProperty = 'child_module_last';
      } else if (i === 2) {
        filtered = filtered.filter(p => p.child_module_last === node);
        nextLevelProperty = null; // Leaf nodes reached based on hierarchy depth
      }
    }

    // Check if there are any distinct properties at the next level
    if (nextLevelProperty) {
      const uniqueNextLevelNodes = [...new Set(filtered.map(p => p[nextLevelProperty]).filter(Boolean))];
      if (uniqueNextLevelNodes.length > 0) {
        return { type: 'nodes', data: uniqueNextLevelNodes.sort() };
      }
    }

    // If no deeper nodes, we show the permissions (leaves)
    return { type: 'leaves', data: filtered };
  }, [permissions, selectedMainModule, navPath]);

  // Breadcrumb string
  const breadcrumbText = [selectedMainModule, ...navPath].filter(Boolean).join(' > ');

  const handleNodeClick = (nodeName) => {
    setNavPath(prev => [...prev, nodeName]);
  };

  const handleUpClick = () => {
    setNavPath(prev => {
      const newPath = [...prev];
      newPath.pop();
      return newPath;
    });
  };

  const handleEdit = (perm) => {
    setEditData(perm);
    setIsModalOpen(true);
  };

  const handleDeletePrompt = (id) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    try {
      const res = await aclApi.deletePermission(deleteConfirmId);
      if (res.data.success) {
        toast.success('Permission deleted successfully');
        fetchPermissions();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete permission');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  const openAddModal = () => {
    setEditData(null);
    setIsModalOpen(true);
  };

  return (
    <div className="permission-control-page">
      <div className="pc-top-section">
        <div className="pc-header-text" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button 
             onClick={() => navigate(-1)} 
             style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#1e40af', padding: 0 }}
             title="Go Back"
           >
             <IconArrowLeft size={28} />
           </button>
          <div>
            <h1 style={{ margin: 0 }}>Permissions</h1>
            <p style={{ margin: 0 }}>Browse modules by clicking cards. Permissions appear at the selected node.</p>
          </div>
        </div>
        <div className="pc-action-buttons">
          <button className="pc-btn-outline" onClick={fetchPermissions}>
            <IconRefresh size={16} />
            Refresh
          </button>
          <button className="pc-btn-solid" onClick={openAddModal}>
            <IconPlus size={16} />
            Add
          </button>
        </div>
      </div>

      <div className="pc-controls-bar">
        <select 
          className="pc-dropdown"
          value={selectedMainModule}
          onChange={handleMainModuleChange}
        >
          {mainModules.map(mod => (
             <option key={mod} value={mod}>{mod}</option>
          ))}
        </select>

        <div className="pc-breadcrumb-actions">
          <div className="pc-breadcrumb">{breadcrumbText}</div>
          <button className="pc-btn-up" onClick={handleUpClick} disabled={navPath.length === 0}>
            <IconArrowLeft size={16} />
            Up
          </button>
        </div>
      </div>

      {loading ? (
        <div>Loading permissions...</div>
      ) : currentView.type === 'nodes' ? (
        <div className="pc-modules-grid">
          {currentView.data.map((nodeName) => (
            <div key={nodeName} className="pc-module-card" onClick={() => handleNodeClick(nodeName)}>
              <span className="pc-module-title">{nodeName}</span>
              <span className="pc-module-subtitle">Click to open</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="pc-permissions-list">
          <h3 className="pc-leaves-header">Permissions at this level</h3>
          <div className="pc-leaves-grid">
            {currentView.data.map((perm) => (
              <div key={perm.Id} className="pc-permission-card">
                <div className="pc-perm-card-header">
                  <div>
                    <h4>{perm.Title}</h4>
                    <span className="pc-perm-card-path">{breadcrumbText}</span>
                  </div>
                  <div className="pc-perm-actions">
                    <button className="pc-icon-btn pc-edit-btn" onClick={() => handleEdit(perm)}>
                      <IconEdit size={16} />
                    </button>
                    <button className="pc-icon-btn pc-delete-btn" onClick={() => handleDeletePrompt(perm.Id)}>
                      <IconTrash size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="pc-perm-details">
                  <div className="pc-perm-row">
                    <label>Method</label>
                    <span className="pc-perm-val-bold">{perm.Method}</span>
                  </div>
                  <div className="pc-perm-row">
                    <label>AccessText</label>
                    <span>{perm.AccessText}</span>
                  </div>
                  <div className="pc-perm-row">
                    <label>Route</label>
                    <span>{perm.Route}</span>
                  </div>
                  <div className="pc-perm-row-group">
                    <label>main: {perm.main_module}</label>
                    {perm.sub_module && <label>sub: {perm.sub_module}</label>}
                    {perm.child_module && <label>child: {perm.child_module}</label>}
                    {perm.child_module_last && <label>child last: {perm.child_module_last}</label>}
                  </div>
                </div>
              </div>
            ))}
            {currentView.data.length === 0 && <p>No permissions found at this level.</p>}
          </div>
        </div>
      )}

      {/* Modal Integration */}
      <AddPermissionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        editData={editData}
        refreshData={fetchPermissions}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="ap-modal-overlay">
          <div className="ap-modal-container" style={{ maxWidth: '400px' }}>
            <div className="ap-modal-header" style={{ borderBottom: 'none' }}>
              <div className="ap-modal-header-text">
                <h2>Delete Permission</h2>
                <p>Are you sure you want to delete this permission? This action cannot be undone.</p>
              </div>
            </div>
            <div className="ap-modal-footer">
              <button className="ap-btn-cancel" onClick={() => setDeleteConfirmId(null)} disabled={isDeleting}>Cancel</button>
              <button className="pc-icon-btn pc-delete-btn" style={{ padding: '8px 16px', borderRadius: '6px' }} onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionControl;
