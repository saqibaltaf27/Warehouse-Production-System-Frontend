import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Table from '../../global-components/Table/Table';
import Button from '../../global-components/Button/Button';
import toast from 'react-hot-toast';
import './Sampling.css';

const QualityAssurance = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [recordDetails, setRecordDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchQualityRecords = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/quality/quality-records`, {
        params: { page: pageNum, limit }
      });
      if (res.data?.success) {
        setData(res.data.data);
        setTotalRecords(res.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Error fetching quality records:", err);
      toast.error("Failed to load quality records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQualityRecords(page);
  }, [page]);

  const handleRowClick = async (row) => {
    setSelectedRecord(row);
    setShowForm(true);
    setLoadingDetails(true);
    
    // Smooth scroll to top to see the details panel
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/quality/quality-record/${row['Document Entry']}`);
      if (res.data?.success) {
        setRecordDetails(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching details:", err);
      toast.error("Failed to load record details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAddQuality = () => {
    setSelectedRecord(null);
    setRecordDetails([]);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const mainColumns = [
    { key: 'Document Number', header: 'Doc Num' },
    { key: 'QC Type', header: 'QC Type' },
    { key: 'Type', header: 'Type' },
    { key: 'Request Number', header: 'Request No' },
    { key: 'BaseType', header: 'Base Type' },
    { key: 'Item Code', header: 'Item Code' },
    { key: 'Item Name', header: 'Item Name' },
    { key: 'Sample Qty', header: 'Sample Qty' },
    { key: 'QC Decision', header: 'QC Decision' }
  ];

  const detailColumns = [
    { key: 'Parameter Line', header: 'Line' },
    { key: 'Parameter Code', header: 'Param Code' },
    { key: 'Parameter Name', header: 'Param Name' },
    { key: 'Action', header: 'Action' },
    { key: 'Criteria', header: 'Criteria' },
    { key: 'Equipment Name', header: 'Equipment' },
    { key: 'UOM', header: 'UOM' },
    { key: 'Std Value', header: 'Std Value' },
    { key: 'Observed Value 1', header: 'Observed 1' },
    { key: 'Observed Value 2', header: 'Observed 2' },
    { key: 'Observed Value 3', header: 'Observed 3' }
  ];

  return (
    <div className="qc-sampling-container fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {showForm && (
        <div className="add-sample-wrapper">
          <div className="add-sample-header section-header-flex">
            <h4 className="add-sample-title">
              {selectedRecord ? `Quality Details: ${selectedRecord['Document Number']}` : 'Add Quality Record'}
            </h4>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Close</Button>
          </div>

          <div className="add-sample-body">
            {!selectedRecord ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                <p>Form to add new Quality record will go here.</p>
                <p style={{ fontSize: '0.9em', marginTop: '10px' }}>
                  (Please provide details on what fields are needed for creation)
                </p>
              </div>
            ) : (
              <div>
                <div className="add-sample-grid" style={{ marginBottom: '24px' }}>
                  <div className="add-sample-col">
                    <div className="add-sample-field">
                      <label className="add-sample-label">Item</label>
                      <input type="text" className="add-sample-input" disabled value={`${selectedRecord['Item Code'] || ''} - ${selectedRecord['Item Name'] || ''}`} />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">Base Doc</label>
                      <input type="text" className="add-sample-input" disabled value={`${selectedRecord['Base Document No'] || ''} (${selectedRecord['BaseType'] || ''})`} />
                    </div>
                  </div>
                  
                  <div className="add-sample-col">
                    <div className="add-sample-field">
                      <label className="add-sample-label">QC Type</label>
                      <input type="text" className="add-sample-input" disabled value={selectedRecord['QC Type'] || ''} />
                    </div>
                    <div className="add-sample-field">
                      <label className="add-sample-label">QC Decision</label>
                      <input type="text" className="add-sample-input" disabled value={selectedRecord['QC Decision'] || 'Pending'} />
                    </div>
                  </div>
                </div>
                
                <h4 style={{ marginBottom: '12px', color: '#333' }}>Parameters</h4>
                <div className="add-sample-table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
                  <Table 
                    data={recordDetails}
                    columns={detailColumns}
                    isLoading={loadingDetails}
                    showActions={false}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="dome-card-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px 0' }}>
          <h3 className="section-title">Quality Records</h3>
          <Button variant="primary" onClick={handleAddQuality}>
            Add Quality
          </Button>
        </div>

        <Table 
          data={data}
          columns={mainColumns}
          isLoading={loading}
          showActions={false}
          onRowClick={handleRowClick}
          totalEntries={totalRecords}
          currentPage={page}
          pageSize={limit}
          onPageChange={setPage}
          onItemsPerPageChange={setLimit}
        />
      </div>
    </div>
  );
};

export default QualityAssurance;
