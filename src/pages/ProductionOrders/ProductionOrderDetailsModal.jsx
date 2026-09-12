import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { axiosInstance } from '../../apis/axiosinstance';
import { API_ENDPOINTS } from '../../apis/endpoints';
import './SalesOrderModal.css';

const ProductionOrderDetailsModal = ({ isOpen, onClose, docNum }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && docNum) {
      fetchDetails(docNum);
    } else {
      setDetails(null);
    }
  }, [isOpen, docNum]);

  const fetchDetails = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.PRODUCTION_ORDERS.DETAILS_BY_DOCNUM(id));
      if (res.data?.success) {
        setDetails(res.data.data);
      } else {
        setError(res.data?.message || 'Failed to fetch details');
      }
    } catch (err) {
      setError(err.message || 'Error fetching details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const header = details?.header || {};
  const lines = details?.lines || [];

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return createPortal(
    <div className="so-modal-overlay">
      <div className="so-modal-content po-details-modal">
        <div className="so-modal-header">
          <h3>Production Order Details - Doc No. {docNum}</h3>
          <button onClick={onClose} className="so-modal-close">&times;</button>
        </div>
        
        <div className="so-modal-body">
          {loading ? (
            <div>Loading details...</div>
          ) : error ? (
            <div className="po-modal-error-text">{error}</div>
          ) : details ? (
            <div className="po-details-container">
              <div className="po-header-details">
                <div><strong>Item No.:</strong> {header.ProductNo}</div>
                <div><strong>Item Name:</strong> {header.ProductDescription}</div>
                <div><strong>Status:</strong> {header.Status}</div>
                <div><strong>Type:</strong> {header.Type}</div>
                <div><strong>Planned Quantity:</strong> {header.PlannedQuantity} {header.UoMName}</div>
                <div><strong>Project:</strong> {header.Project}</div>
                <div><strong>Order Date:</strong> {formatDate(header.OrderDate)}</div>
                <div><strong>Due Date:</strong> {formatDate(header.DueDate)}</div>
                <div><strong>Warehouse:</strong> {header.Warehouse}</div>
                <div><strong>Priority:</strong> {header.Priority}</div>
              </div>
              
              <h4>Components</h4>
              <div className="so-table-container po-mt-10 po-details-table-container">
                <table className="so-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>No.</th>
                      <th>Description</th>
                      <th>Base Qty</th>
                      <th>Planned Qty</th>
                      <th>Warehouse</th>
                      <th>Issue Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, index) => (
                      <tr key={index} className="so-table-row">
                        <td>{line.Type}</td>
                        <td>{line.No}</td>
                        <td>{line.Description}</td>
                        <td>{line.BaseQty}</td>
                        <td>{line.PlannedQty}</td>
                        <td>{line.Warehouse}</td>
                        <td>{line.IssueMethod}</td>
                      </tr>
                    ))}
                    {lines.length === 0 && (
                      <tr>
                        <td colSpan="7" className="po-text-center">No components found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProductionOrderDetailsModal;
