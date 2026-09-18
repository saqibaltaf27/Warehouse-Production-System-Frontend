import React, { useState } from 'react';
import axios from 'axios';
import Table from '../../global-components/Table/Table';
import Button from '../../global-components/Button/Button';
import toast from 'react-hot-toast';
import './Sampling.css';

const UnderInspection = () => {
  const [filters, setFilters] = useState({
    status: '',
    docType: ''
  });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    if (!filters.status || !filters.docType) {
      toast.error("Please select both Document Status and Document Type");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/sampling/filtered`, {
        params: filters
      });
      if (res.data?.success) {
        setData(res.data.data);
        if (res.data.data.length === 0) {
          toast.success("No records found");
        }
      } else {
        toast.error(res.data?.message || "Failed to fetch data");
      }
    } catch (err) {
      console.error("Error fetching filtered samples:", err);
      toast.error("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'Sampling No', header: 'Sampling No' },
    { key: 'Sampling Date', header: 'Sampling Date', render: row => row['Sampling Date'] ? new Date(row['Sampling Date']).toLocaleDateString() : '' },
    { key: 'Docnument Type', header: 'Document Type' },
    { key: 'Document No', header: 'Document No' },
    { key: 'Supplier Code', header: 'Supplier Code' },
    { key: 'Supplier Name', header: 'Supplier Name' },
    { key: 'QC Request Number', header: 'QC Request Number' },
    { key: 'Collect Sample Type', header: 'Collect Sample Type' },
    { key: 'ItemCode', header: 'ItemCode' },
    { key: 'ItemName', header: 'ItemName' },
    { key: 'Actual Qty', header: 'Actual Qty' },
    { key: 'Managed By', header: 'Managed By' },
    { key: 'Batch', header: 'Batch/Serial' },
    { key: 'Batch Qty', header: 'Batch/Serial Qty' },
    { key: 'Sample Qty', header: 'Sample Qty' },
    { key: 'Status', header: 'Status' }
  ];

  return (
    <div className="qc-sampling-container fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="dome-card-wrapper" style={{ padding: '24px' }}>
        <h3 className="section-title" style={{ marginBottom: '16px' }}>Filter Samples</h3>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end' }}>
          <div className="add-sample-field" style={{ flex: 1, marginBottom: 0 }}>
            <label className="add-sample-label">Document Status</label>
            <select 
              className="add-sample-input"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">Select Status...</option>
              <option value="P">Pending</option>
              <option value="UI">Under Inspection</option>
              <option value="PR">Processed</option>
              <option value="C">Cancel</option>
            </select>
          </div>
          
          <div className="add-sample-field" style={{ flex: 1, marginBottom: 0 }}>
            <label className="add-sample-label">Document Type</label>
            <select 
              className="add-sample-input"
              value={filters.docType}
              onChange={(e) => setFilters(prev => ({ ...prev, docType: e.target.value }))}
            >
              <option value="">Select Document Type...</option>
              <option value="20">Goods Receipt PO</option>
              <option value="59">Receipt From Production</option>
              <option value="16">Sales Returns</option>
              <option value="14">A/R Credit Memo</option>
              <option value="-1">Re Test</option>
            </select>
          </div>
          
          <div style={{ paddingBottom: '2px' }}>
            <Button variant="primary" onClick={handleFetch} disabled={loading}>
              Fetch
            </Button>
          </div>
        </div>
      </div>

      {data.length > 0 && (
        <div className="dome-card-wrapper">
          <Table 
            data={data}
            columns={columns}
            isLoading={loading}
            showActions={false}
          />
        </div>
      )}
    </div>
  );
};

export default UnderInspection;
