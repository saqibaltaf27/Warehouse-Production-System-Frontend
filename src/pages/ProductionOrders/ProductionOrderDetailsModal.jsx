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
          <h3>Production Order # {docNum}</h3>
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
                <div className="po-detail-item">
                  <strong>Item No.:</strong>
                  <span>{header.ProductNo}</span>
                </div>

                <div className="po-detail-item">
                  <strong>Item Name:</strong>
                  <span>{header.ProductDescription}</span>
                </div>

                <div className="po-detail-item">
                  <strong>Status:</strong>
                  <span>{header.Status}</span>
                </div>

                <div className="po-detail-item">
                  <strong>Type:</strong>
                  <span>{header.Type}</span>
                </div>

                <div className="po-detail-item">
                  <strong>Planned Quantity:</strong>
                  <span>{header.PlannedQuantity} {header.UoMName}</span>
                </div>

                <div className="po-detail-item">
                  <strong>Project:</strong>
                  <span>{header.Project}</span>
                </div>

                <div className="po-detail-item">
                  <strong>Order Date:</strong>
                  <span>{formatDate(header.OrderDate)}</span>
                </div>

                <div className="po-detail-item">
                  <strong>Due Date:</strong>
                  <span>{formatDate(header.DueDate)}</span>
                </div>

                <div className="po-detail-item">
                  <strong>Warehouse:</strong>
                  <span>{header.Warehouse}</span>
                </div>

                <div className="po-detail-item">
                  <strong>Priority:</strong>
                  <span>{header.Priority}</span>
                </div>
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
