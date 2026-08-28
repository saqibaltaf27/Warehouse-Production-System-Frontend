import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { axiosInstance } from '../../apis/axiosinstance';
import { API_ENDPOINTS } from '../../apis/endpoints';
import ProductionOrderHeader from './ProductionOrderHeader';
import ProductionOrderComponents from './ProductionOrderComponents';
import './ProductionOrders.css';

const ProductionOrders = () => {
  const [itemCode, setItemCode] = useState('');
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [headerData, setHeaderData] = useState(null);
  const [componentsData, setComponentsData] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axiosInstance.get(API_ENDPOINTS.PRODUCTION_ORDERS.PRODUCTS);
        if (res.data?.success) {
          setProducts(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching products list:", err);
      }
    };

    const fetchWarehouses = async () => {
      try {
        const res = await axiosInstance.get(API_ENDPOINTS.PRODUCTION_ORDERS.WAREHOUSES);
        if (res.data?.success) {
          setWarehouses(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching warehouses:", err);
      }
    };

    fetchProducts();
    fetchWarehouses();
  }, []);

  const fetchProductionOrder = async (codeToFetch) => {
    const code = codeToFetch !== undefined ? codeToFetch : itemCode;
    if (!code || !code.trim()) return;
    
    setLoading(true);
    setError(null);
    setHeaderData(null);
    setComponentsData([]);

    try {
      const response = await axiosInstance.get(API_ENDPOINTS.PRODUCTION_ORDERS.DETAILS(code));
      if (response.data?.success) {
        if (response.data.data.header) {
          setHeaderData(response.data.data.header);
          setComponentsData(response.data.data.lines);
        } else {
          setError(`No Production Order found for product ${code}.`);
        }
      } else {
        setError("Failed to fetch production order data.");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBOMOrder = async (codeToFetch) => {
    const code = codeToFetch !== undefined ? codeToFetch : itemCode;
    if (!code || !code.trim()) return;
    
    setLoading(true);
    setError(null);
    setHeaderData(null);
    setComponentsData([]);

    try {
      const response = await axiosInstance.get(API_ENDPOINTS.PRODUCTION_ORDERS.BOM_DETAILS(code));
      if (response.data?.success) {
        if (response.data.data.header) {
          setHeaderData(response.data.data.header);
          setComponentsData(response.data.data.lines);
        } else {
          setError(`No BOM found for product ${code}.`);
        }
      } else {
        setError("Failed to fetch BOM data.");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setItemCode('');
    setHeaderData(null);
    setComponentsData([]);
    setError(null);
  };

  const handleHeaderPlannedQtyChange = (val) => {
    setHeaderData(prev => prev ? { ...prev, PlannedQuantity: val } : prev);
    
    const numVal = parseFloat(val) || 0;
    setComponentsData(prev => prev.map(comp => ({
      ...comp,
      PlannedQty: comp.BaseQty ? parseFloat((comp.BaseQty * numVal).toFixed(6)) : 0
    })));
  };

  const handleHeaderWarehouseChange = (val) => {
    setHeaderData(prev => prev ? { ...prev, Warehouse: val } : prev);
  };

  const handleHeaderFieldChange = (field, value) => {
    setHeaderData(prev => prev ? { ...prev, [field]: value } : prev);
  };

  return (
    <div className="po-container">
      <div className="po-search-bar">
        <label htmlFor="itemCodeSearch"><strong>View Past Order:</strong></label>
        <div className="po-search-container">
          <Select
            id="itemCodeSearch"
            value={products.find(p => p.Code === itemCode) ? { value: itemCode, label: `${itemCode} - ${products.find(p => p.Code === itemCode).Name}` } : null}
            onChange={(selectedOption) => {
              const newCode = selectedOption ? selectedOption.value : '';
              setItemCode(newCode);
              if (newCode) {
                fetchProductionOrder(newCode);
              } else {
                handleClear();
              }
            }}
            options={products.map(p => ({ value: p.Code, label: `${p.Code} - ${p.Name}` }))}
            placeholder="Select or search a product..."
            isClearable
            isSearchable
            styles={{
              control: (base) => ({
                ...base,
                minHeight: '32px',
                fontSize: '13px',
                borderRadius: '3px',
                borderColor: '#ccc',
              }),
              dropdownIndicator: (base) => ({
                ...base,
                padding: '4px',
              }),
              clearIndicator: (base) => ({
                ...base,
                padding: '4px',
              }),
              menu: (base) => ({
                ...base,
                fontSize: '13px',
                zIndex: 9999
              })
            }}
          />
        </div>
        <div className="po-header-actions">
          <button type="button" onClick={handleClear} disabled={loading} className="po-clear-btn">
            Clear
          </button>
        </div>
      </div>

      {error && <div className="po-error">{error}</div>}

      <div className="po-form">
        <ProductionOrderHeader 
          headerData={headerData} 
          isCreateMode={true} 
          products={products}
          warehouses={warehouses}
          onSelectProduct={fetchBOMOrder} 
          selectedItemCode={itemCode} 
          setItemCode={setItemCode} 
          onPlannedQtyChange={handleHeaderPlannedQtyChange}
          onWarehouseChange={handleHeaderWarehouseChange}
          onHeaderChange={handleHeaderFieldChange}
        />
        <ProductionOrderComponents 
          componentsData={componentsData} 
          itemCode={itemCode} 
        />
      </div>
    </div>
  );
};

export default ProductionOrders;
