import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../../apis/axiosinstance';
import { API_ENDPOINTS } from '../../apis/endpoints';
import './SalesOrderModal.css';

const ProductionOrderModal = ({ isOpen, onClose, onSelect }) => {
  const [productionOrders, setProductionOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchProductionOrders();
    }
  }, [isOpen]);

  const fetchProductionOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.PRODUCTION_ORDERS.OPEN_PRODUCTION_ORDERS);
      if (res.data?.success) {
        setProductionOrders(res.data.data);
      } else {
        setError('Failed to fetch production orders');
      }
    } catch (err) {
      setError(err.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredOrders = productionOrders.filter(o => 
    String(o.DocNum).includes(searchTerm) || 
    (o.ProdName && o.ProdName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="so-modal-overlay">
      <div className="so-modal-content">
        <div className="so-modal-header">
          <h3>List of Production Orders</h3>
          <button onClick={onClose} className="so-modal-close">&times;</button>
        </div>
        
        <div className="so-modal-body">
          <input 
            type="text" 
            placeholder="Search by Doc. No. or Product Name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="so-search-input"
          />
          
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="po-modal-error-text">{error}</div>
          ) : (
            <div className="so-table-container">
              <table className="so-table">
                <thead>
                  <tr>
                    <th>Doc. No.</th>
                    <th>Product Name</th>
                    <th>Project</th>
                    <th>Due Date</th>
                    <th>Planned Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => {
                    const d = new Date(order.DueDate);
                    const formattedDate = isNaN(d) ? '' : `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
                    return (
                      <tr key={order.DocNum} onClick={() => { onSelect(order.DocNum); onClose(); }} className="so-table-row">
                        <td>{order.DocNum}</td>
                        <td>{order.ProdName}</td>
                        <td>{order.Project}</td>
                        <td>{formattedDate}</td>
                        <td>{order.PlannedQty}</td>
                      </tr>
                    );
                  })}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan="5" className="po-text-center">No open production orders found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductionOrderModal;
