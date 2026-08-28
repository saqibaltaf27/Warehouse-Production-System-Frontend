import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconArrowLeft, IconFolder, IconFolderOpen, IconChevronRight, IconChevronDown } from '@tabler/icons-react';
import { aclApi } from '../../apis/acl/acl';
import toast from 'react-hot-toast';
import './AccessPermission.css';

// Recursive component to render the tree
const PermissionNode = ({ nodeName, nodeData, selectedPermissions, handleToggle, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  // Extract permissions and children
  const { __permissions, ...children } = nodeData;
  const hasChildren = Object.keys(children).length > 0;
  
  // Calculate total permissions in this node and sub-nodes for the badge
  const getTotalPermissions = (node) => {
    let count = (node.__permissions || []).length;
    for (const key in node) {
      if (key !== '__permissions') {
        count += getTotalPermissions(node[key]);
      }
    }
    return count;
  };
  
  const totalPerms = getTotalPermissions(nodeData);

  return (
    <div className={`ap-tree-node level-${level}`}>
      {/* Folder Header */}
      <div className="ap-folder-header" onClick={toggleExpand}>
        <div className="ap-folder-icon-wrapper">
          {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
          {isExpanded ? <IconFolderOpen size={20} color="#e55353" /> : <IconFolder size={20} color="#e55353" />}
        </div>
        <span className="ap-folder-name">{nodeName} <span className="ap-folder-count">({totalPerms})</span></span>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="ap-folder-content">
          {/* Render children folders recursively */}
          {Object.keys(children).map(childName => (
            <PermissionNode 
              key={childName} 
              nodeName={childName} 
              nodeData={children[childName]} 
              selectedPermissions={selectedPermissions}
              handleToggle={handleToggle}
              level={level + 1} 
            />
          ))}

          {/* Render permissions for this folder */}
          {__permissions && __permissions.length > 0 && (
            <div className="ap-permission-list">
              {__permissions.map(perm => {
                const isSelected = selectedPermissions.includes(perm.Id);
                return (
                <div key={perm.Id} className={`ap-permission-item ${isSelected ? 'selected' : ''}`}>
                  <input 
                    type="checkbox" 
                    id={`perm-${perm.Id}`} 
                    checked={isSelected}
                    onChange={() => handleToggle(perm.Id)}
                    className="ap-checkbox"
                  />
                  <div className="ap-permission-info">
                    <label htmlFor={`perm-${perm.Id}`} className="ap-permission-title">{perm.Title}</label>
                    <div className="ap-permission-meta">
                      <span className="ap-method">{perm.Method}</span>
                      <span className="ap-route">{perm.Route}</span>
                      <span className="ap-access-text">{perm.AccessText}</span>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AccessPermission = () => {
  const { empid } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [allPermissions, setAllPermissions] = useState([]);
  const [initialSelected, setInitialSelected] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  
  const [selectedMainModule, setSelectedMainModule] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Employee Details
        const empRes = await aclApi.getEmployeeById(empid);
        if (empRes.data.success) {
          setEmployee(empRes.data.data);
        }

        // Fetch All Permissions
        const permRes = await aclApi.getPermissions();
        if (permRes.data.success) {
          setAllPermissions(permRes.data.data);
        }

        // Fetch Assigned Permissions
        const userPermRes = await aclApi.getUserPermissions(empid);
        if (userPermRes.data.success) {
          setInitialSelected(userPermRes.data.data);
          setSelectedPermissions(userPermRes.data.data);
        }
        
      } catch (err) {
        console.error("Failed to load data", err);
        toast.error("Failed to load permissions data");
      } finally {
        setLoading(false);
      }
    };

    if (empid) {
      fetchData();
    }
  }, [empid]);

  // Derived Main Modules
  const mainModules = useMemo(() => {
    const unique = [...new Set(allPermissions.map(p => p.main_module).filter(Boolean))];
    return unique.sort();
  }, [allPermissions]);

  useEffect(() => {
    if (mainModules.length > 0 && !selectedMainModule) {
      setSelectedMainModule(mainModules[0]);
    }
  }, [mainModules, selectedMainModule]);

  // Check if there are unsaved changes
  const hasAdded = useMemo(() => {
    return selectedPermissions.some(id => !initialSelected.includes(id));
  }, [initialSelected, selectedPermissions]);

  const hasRemoved = useMemo(() => {
    return initialSelected.some(id => !selectedPermissions.includes(id));
  }, [initialSelected, selectedPermissions]);

  // Build Tree for selected main module
  const treeData = useMemo(() => {
    if (!selectedMainModule) return { __permissions: [] };

    const filtered = allPermissions.filter(p => p.main_module === selectedMainModule);
    const tree = { __permissions: [] };

    filtered.forEach(perm => {
      let currentLevel = tree;
      
      const path = [perm.sub_module, perm.child_module, perm.child_module_last].filter(Boolean);
      
      path.forEach(levelName => {
        if (!currentLevel[levelName]) {
          currentLevel[levelName] = { __permissions: [] };
        }
        currentLevel = currentLevel[levelName];
      });

      currentLevel.__permissions.push(perm);
    });

    return tree;
  }, [allPermissions, selectedMainModule]);

  const handleToggle = (permId) => {
    setSelectedPermissions(prev => 
      prev.includes(permId) 
        ? prev.filter(id => id !== permId) 
        : [...prev, permId]
    );
  };

  const handleReset = () => {
    setSelectedPermissions(initialSelected);
    toast.success("Reset to original permissions");
  };

  const handleRemoveAll = () => {
    // We can keep this if they want a quick way to uncheck everything, 
    // but the actual save happens via handleSave
    if (window.confirm("Are you sure you want to uncheck all permissions?")) {
      setSelectedPermissions([]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await aclApi.saveUserPermissions(empid, selectedPermissions);
      if (res.data.success) {
        toast.success("Permissions saved successfully!");
        setInitialSelected(selectedPermissions); // Update baseline
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save permissions");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="ap-loading">Loading permission data...</div>;
  }

  return (
    <div className="access-permission-page">
      {/* Header */}
      <div className="ap-header">
        <div className="ap-header-left">
       
          <div className="ap-header-info">
            <h1>Permissions</h1>
            <p>{employee?.FirstName} {employee?.LastName || ''} • EmpID: {employee?.EmpID}</p>
          </div>
        </div>
        
        <div className="ap-header-right">
          <button className="ap-btn ap-btn-reset" onClick={handleReset} disabled={!hasAdded && !hasRemoved}>
             Reset
          </button>
          <button className={`ap-btn ap-btn-add ${hasAdded ? 'highlight' : ''}`} onClick={handleSave} disabled={isSaving || !hasAdded}>
            {isSaving ? "Saving..." : "Add Permissions"}
          </button>
          <button className={`ap-btn ap-btn-remove ${hasRemoved ? 'highlight-remove' : ''}`} onClick={handleSave} disabled={isSaving || !hasRemoved}>
            {isSaving ? "Saving..." : "Remove Permissions"}
          </button>
        </div>
      </div>

      <div className="ap-employee-card">
        <h3>{employee?.FirstName} {employee?.LastName || ''}</h3>
        <p>{employee?.OfficeEmail}</p>
      </div>

      <div className="ap-content-card">
        <div className="ap-content-header">
          <div className="ap-content-title">
            <h3>Permission Trees</h3>
            <p>Check to add, uncheck to remove.</p>
          </div>
          <div className="ap-module-selector">
            <label>Main Module</label>
            <select 
              value={selectedMainModule} 
              onChange={(e) => setSelectedMainModule(e.target.value)}
            >
              {mainModules.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="ap-tree-container">
          {/* Render Root Folders */}
          {Object.keys(treeData).filter(k => k !== '__permissions').map(folderName => (
            <PermissionNode 
              key={folderName}
              nodeName={folderName}
              nodeData={treeData[folderName]}
              selectedPermissions={selectedPermissions}
              handleToggle={handleToggle}
              level={0}
            />
          ))}

          {/* Render Root Permissions (no sub_module) */}
          {treeData.__permissions && treeData.__permissions.length > 0 && (
            <div className="ap-permission-list ap-root-permissions">
              {treeData.__permissions.map(perm => {
                const isSelected = selectedPermissions.includes(perm.Id);
                return (
                <div key={perm.Id} className={`ap-permission-item ${isSelected ? 'selected' : ''}`}>
                  <input 
                    type="checkbox" 
                    id={`perm-root-${perm.Id}`} 
                    checked={isSelected}
                    onChange={() => handleToggle(perm.Id)}
                    className="ap-checkbox"
                  />
                  <div className="ap-permission-info">
                    <label htmlFor={`perm-root-${perm.Id}`} className="ap-permission-title">{perm.Title}</label>
                    <div className="ap-permission-meta">
                      <span className="ap-method">{perm.Method}</span>
                      <span className="ap-route">{perm.Route}</span>
                      <span className="ap-access-text">{perm.AccessText}</span>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          )}
          
          {Object.keys(treeData).length === 1 && treeData.__permissions.length === 0 && (
             <div className="ap-no-data">No permissions configured for this module.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccessPermission;
