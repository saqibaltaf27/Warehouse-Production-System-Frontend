import React, { useState } from 'react';
import Select from 'react-select';
import SalesOrderModal from './SalesOrderModal';
import ProductionOrderModal from './ProductionOrderModal';
import CustomerModal from './CustomerModal';

const renderFieldValue = (value, isDate = false) => {
  if (value === null || value === undefined) return "";
  if (isDate) {
    try {
      const d = new Date(value);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (e) {
      return value;
    }
  }
  return value;
};

const ProductionOrderHeader = ({ headerData, isCreateMode, products, warehouses, onSelectProduct, selectedItemCode, setItemCode, onPlannedQtyChange, onWarehouseChange, onHeaderChange }) => {
  const [isSoModalOpen, setIsSoModalOpen] = useState(false);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  return (
    <div className="po-header-grid">
      {/* Left Column */}
      <div className="po-header-col">
        <div className="po-field-row">
          <div className="po-field-label">Type</div>
          <div className={`po-field-value ${isCreateMode ? 'po-field-value-create' : ''}`}>
            {isCreateMode ? (
              <Select
                value={{ value: headerData?.Type || 'Standard', label: headerData?.Type || 'Standard' }}
                onChange={(opt) => onHeaderChange && onHeaderChange('Type', opt ? opt.value : 'Standard')}
                options={[
                  { value: 'Standard', label: 'Standard' },
                  { value: 'Special', label: 'Special' },
                  { value: 'Disassembly', label: 'Disassembly' }
                ]}
                isSearchable={false}
                styles={{
                  container: (base) => ({ ...base, width: '100%' }),
                  control: (base) => ({
                    ...base,
                    minHeight: '26px',
                    fontSize: '12px',
                    borderRadius: '2px',
                    borderColor: '#ccc',
                    backgroundColor: '#fffde7'
                  }),
                  dropdownIndicator: (base) => ({ ...base, padding: '2px' }),
                  menu: (base) => ({ ...base, fontSize: '12px', zIndex: 9999 })
                }}
              />
            ) : (
              headerData?.Type || ''
            )}
          </div>
        </div>
        <div className="po-field-row">
          <div className="po-field-label">Status</div>
          <div className="po-field-value">{headerData?.Status || ''}</div>
        </div>
        <div className="po-field-row">
          <div className="po-field-label">Product No.</div>
          <div className={`po-field-value highlight ${isCreateMode ? 'po-field-value-create' : ''}`}>
            {isCreateMode ? (
              <Select
                value={products?.find(p => p.Code === selectedItemCode) ? { value: selectedItemCode, label: `${selectedItemCode} - ${products?.find(p => p.Code === selectedItemCode).Name}` } : null}
                onChange={(selectedOption) => {
                  const newCode = selectedOption ? selectedOption.value : '';
                  setItemCode(newCode);
                  if (newCode) {
                    onSelectProduct(newCode);
                  }
                }}
                options={products?.map(p => ({ value: p.Code, label: `${p.Code} - ${p.Name}` }))}
                placeholder="Select a product..."
                isClearable
                isSearchable
                styles={{
                  container: (base) => ({ ...base, width: '100%' }),
                  control: (base) => ({
                    ...base,
                    minHeight: '26px',
                    fontSize: '12px',
                    borderRadius: '2px',
                    borderColor: '#ccc',
                    backgroundColor: '#fffde7'
                  }),
                  dropdownIndicator: (base) => ({ ...base, padding: '2px' }),
                  clearIndicator: (base) => ({ ...base, padding: '2px' }),
                  menu: (base) => ({ ...base, fontSize: '12px', zIndex: 9999 })
                }}
              />
            ) : (
              headerData?.ProductNo || ''
            )}
          </div>
        </div>
        <div className="po-field-row">
          <div className="po-field-label">Product Description</div>
          <div className="po-field-value">{headerData?.ProductDescription || ''}</div>
        </div>
        <div className="po-field-row">
          <div className="po-field-label">Planned Quantity</div>
          <div className={`po-field-value ${isCreateMode ? 'po-field-value-create-basic' : ''}`}>
            {isCreateMode ? (
              <input 
                type="number"
                value={headerData?.PlannedQuantity || ''}
                onChange={(e) => onPlannedQtyChange && onPlannedQtyChange(e.target.value)}
                className="po-uom-input"
              />
            ) : (
              headerData?.PlannedQuantity || ''
            )}
          </div>
          <div className="po-field-label po-inline-label">UoM Name</div>
          <div className="po-field-value">{headerData?.UoMName || ''}</div>
        </div>
        <div className="po-field-row">
          <div className="po-field-label">Warehouse</div>
          <div className={`po-field-value highlight ${isCreateMode ? 'po-field-value-create' : ''}`}>
            {isCreateMode ? (
              <Select
                value={warehouses?.find(w => w.WhsCode === headerData?.Warehouse) ? { value: headerData.Warehouse, label: `${headerData.Warehouse} - ${warehouses.find(w => w.WhsCode === headerData.Warehouse).WhsName}` } : null}
                onChange={(selectedOption) => {
                  if (onWarehouseChange) {
                    onWarehouseChange(selectedOption ? selectedOption.value : '');
                  }
                }}
                options={warehouses?.map(w => ({ value: w.WhsCode, label: `${w.WhsCode} - ${w.WhsName}` }))}
                placeholder="Warehouse..."
                isClearable
                isSearchable
                styles={{
                  container: (base) => ({ ...base, width: '100%' }),
                  control: (base) => ({
                    ...base,
                    minHeight: '26px',
                    fontSize: '12px',
                    borderRadius: '2px',
                    borderColor: '#ccc',
                    backgroundColor: '#fffde7'
                  }),
                  dropdownIndicator: (base) => ({ ...base, padding: '2px' }),
                  clearIndicator: (base) => ({ ...base, padding: '2px' }),
                  menu: (base) => ({ ...base, fontSize: '12px', zIndex: 9999 })
                }}
              />
            ) : (
              headerData?.Warehouse || ''
            )}
          </div>
          <div className="po-field-label po-inline-label">Branch</div>
          <div className="po-field-value">{headerData?.Branch || ''}</div>
        </div>
        <div className="po-field-row">
          <div className="po-field-label">Priority</div>
          <div className="po-field-value">{headerData?.Priority || ''}</div>
        </div>
        <div className="po-field-row">
          <div className="po-field-label">Routing Date Calculation</div>
          <div className="po-field-value">{headerData?.RoutingDateCalculation || ''}</div>
        </div>
        <div className="po-field-row po-margin-top-4">
          <input type="checkbox" checked={headerData?.ProcureItems === 'Yes'} readOnly className="po-margin-right-8" />
          <label className="po-field-label">Procure Items</label>
        </div>
      </div>

      {/* Right Column */}
      <div className="po-header-col">
        <div className="po-field-row">
          <div className="po-field-label">No.</div>
          <div className="po-field-value">{headerData?.No || ''}</div>
        </div>
        <div className="po-field-row">
          <div className="po-field-label">Order Date</div>
          <div className="po-field-value">{renderFieldValue(headerData?.OrderDate, true)}</div>
        </div>
        <div className="po-field-row">
          <div className="po-field-label">Start Date</div>
          <div className="po-field-value">{renderFieldValue(headerData?.StartDate, true)}</div>
        </div>
        <div className="po-field-row">
          <div className="po-field-label">Due Date</div>
          <div className="po-field-value">{renderFieldValue(headerData?.DueDate, true)}</div>
        </div>
        <div className="po-field-row">
          <div className="po-field-label">Origin</div>
          <div className="po-field-value">{headerData?.Origin || ''}</div>
        </div>
        <div className="po-field-row">
          <div className="po-field-label">Linked To</div>
          <div className={`po-field-value ${isCreateMode ? 'po-field-value-create' : ''}`}>
            {isCreateMode ? (
              <Select
                value={headerData?.LinkedTo ? { value: headerData.LinkedTo, label: headerData.LinkedTo } : null}
                onChange={(opt) => onHeaderChange && onHeaderChange('LinkedTo', opt ? opt.value : '')}
                options={[
                  { value: 'Production Order', label: 'Production Order' },
                  { value: 'Sales Order', label: 'Sales Order' }
                ]}
                isClearable
                isSearchable={false}
                placeholder="Select..."
                styles={{
                  container: (base) => ({ ...base, width: '100%' }),
                  control: (base) => ({
                    ...base,
                    minHeight: '26px',
                    fontSize: '12px',
                    borderRadius: '2px',
                    borderColor: '#ccc',
                    backgroundColor: '#fffde7'
                  }),
                  dropdownIndicator: (base) => ({ ...base, padding: '2px' }),
                  clearIndicator: (base) => ({ ...base, padding: '2px' }),
                  menu: (base) => ({ ...base, fontSize: '12px', zIndex: 9999 })
                }}
              />
            ) : (
              headerData?.LinkedTo || ''
            )}
          </div>
        </div>
        <div className="po-field-row">
          <div className="po-field-label">Linked Order</div>
          <div className={`po-field-value ${isCreateMode ? 'po-field-value-create-flex' : ''}`}>
            {isCreateMode ? (
              <input 
                type="text"
                value={headerData?.LinkedOrder || ''}
                onChange={(e) => onHeaderChange && onHeaderChange('LinkedOrder', e.target.value)}
                disabled={!headerData?.LinkedTo}
                className={`po-linked-order-input ${headerData?.LinkedTo ? 'po-linked-order-input-active' : 'po-linked-order-input-inactive'}`}
              />
            ) : (
              headerData?.LinkedOrder || ''
            )}
            {headerData?.LinkedTo && (headerData.LinkedTo === 'Sales Order' || headerData.LinkedTo === 'Production Order') && (
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (headerData.LinkedTo === 'Sales Order') {
                    setIsSoModalOpen(true);
                  } else if (headerData.LinkedTo === 'Production Order') {
                    setIsPoModalOpen(true);
                  }
                }}
                className="po-list-button" 
                title="Choose from List"
              >
                &#9776;
              </button>
            )}
          </div>
        </div>
        <div className="po-field-row">
          <div className="po-field-label">Customer</div>
          <div className={`po-field-value ${isCreateMode ? 'po-field-value-create-flex' : ''}`}>
            {isCreateMode ? (
              <input 
                type="text"
                value={headerData?.Customer || ''}
                onChange={(e) => onHeaderChange && onHeaderChange('Customer', e.target.value)}
                className="po-customer-input"
              />
            ) : (
              headerData?.Customer || ''
            )}
            {isCreateMode && (
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsCustomerModalOpen(true);
                }}
                className="po-list-button" 
                title="Choose from List"
              >
                &#9776;
              </button>
            )}
          </div>
        </div>
        <div className="po-field-row">
          <div className="po-field-label">Distr. Rule</div>
          <div className="po-field-value">{headerData?.DistrRule || ''}</div>
        </div>
        <div className="po-field-row">
          <div className="po-field-label">Project</div>
          <div className="po-field-value">{headerData?.Project || ''}</div>
        </div>
      </div>
      <SalesOrderModal 
        isOpen={isSoModalOpen} 
        onClose={() => setIsSoModalOpen(false)} 
        onSelect={(docNum) => onHeaderChange && onHeaderChange('LinkedOrder', docNum)} 
      />
      <ProductionOrderModal 
        isOpen={isPoModalOpen} 
        onClose={() => setIsPoModalOpen(false)} 
        onSelect={(docNum) => onHeaderChange && onHeaderChange('LinkedOrder', docNum)} 
      />
      <CustomerModal 
        isOpen={isCustomerModalOpen} 
        onClose={() => setIsCustomerModalOpen(false)} 
        onSelect={(cardCode) => onHeaderChange && onHeaderChange('Customer', cardCode)} 
      />
    </div>
  );
};

export default ProductionOrderHeader;
