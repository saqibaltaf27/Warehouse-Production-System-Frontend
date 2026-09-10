import React from 'react';
import GlobalPopup from '../../global-components/GlobalPopup/GlobalPopup';
import Table from '../../global-components/Table/Table';
import './PurchaseOrderModal.css';

const PurchaseOrderModal = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  const { header, lines } = data;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const columns = [
    { key: 'LineNum', header: '#', width: 60, render: (row) => (row.LineNum !== undefined ? row.LineNum + 1 : '-') },
    { key: 'ItemCode', header: 'Item Code', width: 150 },
    { key: 'Dscription', header: 'Item Description', width: 250 },
    { key: 'Quantity', header: 'Req Qty', width: 100 },
    { key: 'WhsCode', header: 'Warehouse', width: 100 },
    { key: 'Vendor', header: 'Preferred Vendor', width: 150, render: (row) => row.LineVendor || '-' },
    { key: 'Price', header: 'Est. Price', width: 120, render: (row) => row.Price ? `$${parseFloat(row.Price).toLocaleString()}` : '$0.00' }
  ];

  const totalQty = lines.reduce((sum, line) => sum + (line.Quantity || 0), 0);
  const totalValue = lines.reduce((sum, line) => sum + ((line.Quantity || 0) * (line.Price || 0)), 0);

  return (
    <GlobalPopup onClose={onClose} title="Purchase Order Details" className="po-modal" showClose={true}>
      <div className="po-modal-content">
        
        {/* Document Information Section */}
        <div className="po-section">
          <div className="po-section-header">
            <span className="po-section-title">Document Information</span>
            <span className={`po-status po-badge po-badge-${header.DocStatus === 'O' ? 'open' : header.DocStatus === 'C' ? 'closed' : 'default'}`}>
              {header.DocStatus === 'O' ? 'Open' : header.DocStatus === 'C' ? 'Closed' : header.DocStatus}
            </span>
          </div>
          <div className="po-info-grid">
            <div className="po-info-item">
              <label>PR NUMBER</label>
              <span>#{header.DocNum}</span>
            </div>
            <div className="po-info-item">
              <label>COMPANY</label>
              <span>{header.BranchName || header.Branch || '-'}</span>
            </div>
            <div className="po-info-item">
              <label>REQUESTER ID</label>
              <span>{header.Requester}</span>
            </div>
            <div className="po-info-item">
              <label>REQUESTER NAME</label>
              <span>{header.ReqName}</span>
            </div>
            <div className="po-info-item">
              <label>POSTING DATE</label>
              <span>{formatDate(header.DocDate)}</span>
            </div>
            <div className="po-info-item">
              <label>REQUIRED DATE</label>
              <span>{formatDate(header.ReqDate)}</span>
            </div>
          </div>
        </div>

        {/* Contents Section */}
        <div className="po-section">
          <div className="po-section-title-wrap">
            <span className="po-section-title">Contents</span>
            <span className="po-item-count">({lines.length} item{lines.length !== 1 ? 's' : ''})</span>
          </div>
          <div className="po-table-wrapper">
            <Table
              data={lines}
              columns={columns}
              showPagination={false}
              showActions={false}
            />
          </div>
        </div>

        {/* Bottom Sections */}
        <div className="po-bottom-grid">
          
          <div className="po-section po-flex-1">
            <div className="po-section-title">Remarks & Justification</div>
            <div className="po-remarks">
              {header.Comments || '-'}
            </div>
          </div>

          <div className="po-section po-flex-1">
            <div className="po-section-title">Document Summary</div>
            <div className="po-summary-list">
              <div className="po-summary-item">
                <span>Company:</span>
                <span>{header.BranchName || header.Branch || '-'}</span>
              </div>
              <div className="po-summary-item">
                <span>Total Line Items:</span>
                <span>{lines.length}</span>
              </div>
              <div className="po-summary-item">
                <span>Total Requested Qty:</span>
                <span>{totalQty}</span>
              </div>
              <div className="po-summary-item po-summary-total">
                <span>Est. Total Value:</span>
                <span className="po-total-value">${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </GlobalPopup>
  );
};

export default PurchaseOrderModal;
