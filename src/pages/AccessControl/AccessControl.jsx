import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconSearch, IconEdit, IconShieldLock } from '@tabler/icons-react';
import { axiosInstance } from '../../apis/axiosinstance';
import './AccessControl.css';

const AccessControl = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get('/acl/employees', {
          params: { search: searchTerm },
          skipGlobalLoading: true
        });
        if (response.data.success) {
          setEmployees(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch employees", error);
      } finally {
        setLoading(false);
      }
    };

    // Simple debounce
    const timeoutId = setTimeout(() => {
      fetchEmployees();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return (
    <div className="access-control-page">
      <div className="access-control-header">
        <h1>Access Control Manager</h1>
      </div>

      <div className="access-control-controls">
        <div className="access-search-wrapper">
          <IconSearch className="search-icon" size={18} />
          <input 
            type="text" 
            placeholder="Type EmpID, FirstName..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="access-search-input"
          />
        </div>
        <button 
          className="permission-btn"
          onClick={() => navigate('/access-control/permission-control')}
        >
          <IconEdit size={16} />
          Permission Control
        </button>
      </div>

      <p className="employee-count-text">
        {loading ? "Searching..." : `${employees.length} employee(s) found.`}
      </p>

      <div className="employee-cards-grid">
        {employees.map((emp) => (
          <div 
            key={emp.id} 
            className="employee-card"
            onClick={() => navigate(`/access-control/access-permission/${emp.id}`)}
            style={{ cursor: 'pointer' }}
          >
            <div className="employee-card-header">
              <div className="employee-identity">
                <h3>{emp.firstName} {emp.lastName}</h3>
                <p className="employee-email">{emp.email}</p>
              </div>
              <div className="employee-shield-icon">
                <IconShieldLock size={20} stroke={2} color="#ffffff" />
              </div>
            </div>

            <div className="employee-details">
              <div className="detail-group">
                <label>EmpID</label>
                <p>{emp.id}</p>
              </div>
              <div className="detail-group">
                <label>Department</label>
                <p>{emp.department}</p>
              </div>
              <div className="detail-group">
                <label>Designation</label>
                <p>{emp.designation}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccessControl;
