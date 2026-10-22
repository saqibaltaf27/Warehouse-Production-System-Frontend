import React from 'react';
import { createPortal } from 'react-dom';
import '../ProductionOrders/SalesOrderModal.css';

const PurchaseOrderModal = ({ isOpen, onClose, data, poDetails }) => {
  const modalData = data || poDetails;
  if (!isOpen || !modalData) return null;

  const { header = {}, lines = [] } = modalData;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const totalQty = lines.reduce((sum, line) => sum + (parseFloat(line.Quantity || line.ReqQty) || 0), 0);
  const totalValue = lines.reduce((sum, line) => {
    const qty = parseFloat(line.Quantity || line.ReqQty) || 0;
    const price = parseFloat(line.Price) || 0;
    return sum + (qty * price);
  }, 0);

  const docNumber = header.DocNum || header.DocEntry || '';
  const statusLabel = header.DocStatus === 'O' ? 'Open' : header.DocStatus === 'C' ? 'Closed' : (header.DocStatus || '-');
  const requesterDisplay = header.ReqName 
    ? (header.Requester ? `${header.Requester} - ${header.ReqName}` : header.ReqName)
    : (header.Requester || '-');

  return createPortal(
    <div className="so-modal-overlay" onClick={onClose}>
      <div className="so-modal-content po-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="so-modal-header">
          <h3>Purchase Order #{docNumber}</h3>
          <button onClick={onClose} className="so-modal-close">&times;</button>
        </div>

        <div className="so-modal-body">
          <div className="po-details-container">
            {/* 2-Column Key-Value Header Details */}
            <div className="po-header-details">
              <div className="po-detail-item">
                <strong>Doc No.:</strong>
                <span>#{docNumber}</span>
              </div>

              <div className="po-detail-item">
                <strong>Status:</strong>
                <span>{statusLabel}</span>
              </div>

              <div className="po-detail-item">
                <strong>Company / Branch:</strong>
                <span>{header.BranchName || header.Branch || '-'}</span>
              </div>

              <div className="po-detail-item">
                <strong>Posting Date:</strong>
                <span>{formatDate(header.DocDate)}</span>
              </div>

              <div className="po-detail-item">
                <strong>Required Date:</strong>
                <span>{formatDate(header.ReqDate)}</span>
              </div>

              <div className="po-detail-item">
                <strong>Requester:</strong>
                <span>{requesterDisplay}</span>
              </div>

              <div className="po-detail-item" style={{ gridColumn: '1 / -1' }}>
                <strong>Remarks:</strong>
                <span>{header.Comments || '-'}</span>
              </div>
            </div>

            {/* Items Table */}
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 600, color: '#111827' }}>
              Items
            </h4>

            <div className="so-table-container po-mt-10 po-details-table-container">
              <table className="so-table">
                <thead>
                  <tr>
                    <th style={{ width: '45px', textAlign: 'center' }}>#</th>
                    <th style={{ minWidth: '130px' }}>Item Code</th>
                    <th style={{ minWidth: '220px' }}>Item Description</th>
                    <th style={{ width: '90px' }}>Req Qty</th>
                    <th style={{ minWidth: '160px' }}>Warehouse</th>
                    <th style={{ minWidth: '150px' }}>Preferred Vendor</th>
                    <th style={{ width: '110px', textAlign: 'right' }}>Est. Price</th>
                    <th style={{ width: '120px', textAlign: 'right' }}>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => {
                    const qty = parseFloat(line.Quantity || line.ReqQty) || 0;
                    const price = parseFloat(line.Price) || 0;
                    const lineTotal = qty * price;
                    const whsDisplay = line.WarehouseName ? `${line.WhsCode} - ${line.WarehouseName}` : (line.WhsCode || line.Warehouse || '-');
                    const vendorDisplay = line.VendorName || line.LineVendor || '-';

                    return (
                      <tr key={index} className="so-table-row">
                        <td style={{ textAlign: 'center' }}>{line.LineNum !== undefined ? line.LineNum + 1 : index + 1}</td>
                        <td style={{ fontWeight: 500 }}>{line.ItemCode || '-'}</td>
                        <td>{line.Dscription || line.ItemDescription || '-'}</td>
                        <td>{qty}</td>
                        <td>{whsDisplay}</td>
                        <td>{vendorDisplay}</td>
                        <td style={{ textAlign: 'right' }}>
                          {price > 0 ? price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 500 }}>
                          {lineTotal > 0 ? lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                        </td>
                      </tr>
                    );
                  })}
                  {lines.length === 0 && (
                    <tr>
                      <td colSpan="8" className="po-text-center" style={{ padding: '24px', color: '#94a3b8' }}>
                        No items found for this purchase order.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Document Summary Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '28px',
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid #e5e7eb',
              fontSize: '13px'
            }}>
              <div>
                <span style={{ color: '#6b7280' }}>Total Items:</span>{' '}
                <strong style={{ color: '#111827' }}>{lines.length}</strong>
              </div>
              <div>
                <span style={{ color: '#6b7280' }}>Total Qty:</span>{' '}
                <strong style={{ color: '#111827' }}>{totalQty}</strong>
              </div>
              <div>
                <span style={{ color: '#6b7280' }}>Est. Total Value:</span>{' '}
                <strong style={{ color: '#111827', fontSize: '14px' }}>
                  {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PurchaseOrderModal;
