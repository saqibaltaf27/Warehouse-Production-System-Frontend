import React, { useState, useEffect, useMemo } from 'react';
import { axiosInstance } from '../../apis/axiosinstance';
import { API_ENDPOINTS } from '../../apis/endpoints';
import Table from '../../global-components/Table/Table';
import { IconSearch } from '@tabler/icons-react';

import './Machine.css';

const Machine = () => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(API_ENDPOINTS.MACHINE.GET_MACHINES_LIST);
      if (res.data?.success) {
        setMachines(res.data.data);
      } else {
        setError('Failed to fetch machines.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while fetching data.');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return machines.filter(m => {
      const matchSearch = 
        (m.Code && m.Code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.Description && m.Description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchSearch;
    });
  }, [machines, searchQuery]);

  const fmtNum = (val) => {
    if (val == null || isNaN(val)) return '-';
    return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const columns = [
    { header: 'Code', key: 'Code' },
    { header: 'Description', key: 'Description' },
    { header: 'Type', key: 'Type' },
    { header: 'Location', key: 'Location' },
    { header: 'Useful Life (M)', key: 'Useful Life (M)' },
    { header: 'Remaining Life (M)', key: 'Remaining Life (M)' },
    { header: 'APC', key: 'APC', render: (r) => fmtNum(r.APC) },
    { header: 'Dep', key: 'Dep', render: (r) => fmtNum(r.Dep) },
    { header: 'FBV', key: 'FBV', render: (r) => fmtNum(r.FBV) }
  ];

  return (
    <div className="machine-page-wrapper">
      <h2 className="machine-page-title">Machine List</h2>
      
      <div className="machine-filters-card">
        <div className="machine-filters-grid">
          <div className="machine-filter-group">
            <label>Search</label>
            <div className="machine-filter-input">
              <IconSearch size={18} />
              <input 
                type="text" 
                placeholder="Search by Code or Description..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="machine-table-card">
        {loading ? (
          <div className="machine-loading">Loading machines...</div>
        ) : error ? (
          <div className="machine-error">{error}</div>
        ) : (
          <Table 
            columns={columns}
            data={filteredData}
            showActions={false}
          />
        )}
      </div>
    </div>
  );
};

export default Machine;
