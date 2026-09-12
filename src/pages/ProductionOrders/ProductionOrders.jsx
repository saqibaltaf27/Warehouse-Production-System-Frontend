import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { axiosInstance } from '../../apis/axiosinstance';
import { API_ENDPOINTS } from '../../apis/endpoints';
import Button from '../../global-components/Button/Button';
import { IconSearch } from '@tabler/icons-react';
import ProductionOrderHeader from './ProductionOrderHeader';
import ProductionOrderComponents from './ProductionOrderComponents';
import Table from '../../global-components/Table/Table';
import ProductionOrderDetailsModal from './ProductionOrderDetailsModal';
import './ProductionOrders.css';
import '../PurchaseOrder/PurchaseOrder.css';

const ProductionOrders = () => {
  const [itemCode, setItemCode] = useState('');
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [projectList, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [headerData, setHeaderData] = useState({
    Type: 'Standard',
    Status: 'Planned',
    ProcureItems: false
  });
  const [componentsData, setComponentsData] = useState([]);

  // Table & Pagination state
  const [paginatedOrders, setPaginatedOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDocNum, setSelectedDocNum] = useState(null);
  const [tableLoading, setTableLoading] = useState(false);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

    const fetchBranches = async () => {
      try {
        const res = await axiosInstance.get(API_ENDPOINTS.PRODUCTION_ORDERS.BRANCHES);
        if (res.data?.success) {
          setBranches(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching branches:", err);
      }
    };

    const fetchProjects = async () => {
      try {
        const res = await axiosInstance.get(API_ENDPOINTS.PRODUCTION_ORDERS.PROJECTS);
        if (res.data?.success) {
          setProjects(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
      }
    };

    fetchProducts();
    fetchWarehouses();
    fetchBranches();
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchPaginatedOrders(currentPage, pageSize, searchQuery);
  }, [currentPage, pageSize, searchQuery]);

  const fetchPaginatedOrders = async (page, limit, search) => {
    setTableLoading(true);
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.PRODUCTION_ORDERS.PAGINATED_ORDERS(page, limit, search));
      if (response.data?.success) {
        setPaginatedOrders(response.data.data);
        setTotalOrders(response.data.total);
      }
    } catch (err) {
      toast.error('Failed to fetch production orders table.');
    } finally {
      setTableLoading(false);
    }
  };

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
          const { header, lines } = response.data.data;
          setHeaderData({
            ...header,
            OrderDate: header.OrderDate ? new Date(header.OrderDate).toISOString().split('T')[0] : '',
            StartDate: header.StartDate ? new Date(header.StartDate).toISOString().split('T')[0] : '',
            DueDate: header.DueDate ? new Date(header.DueDate).toISOString().split('T')[0] : ''
          });
          setComponentsData(lines || []);
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
    setHeaderData({
      Type: 'Standard',
      Status: 'Planned',
      ProcureItems: false
    });
    setComponentsData([]);
    setItemCode('');
    setError(null);
  };

  const handleHeaderPlannedQtyChange = (val) => {
    setHeaderData(prev => ({ ...(prev || {}), PlannedQuantity: val }));
    
    const numVal = parseFloat(val) || 0;
    setComponentsData(prev => prev.map(comp => ({
      ...comp,
      PlannedQty: comp.BaseQty ? parseFloat((comp.BaseQty * numVal).toFixed(6)) : 0
    })));
  };

  const handleHeaderWarehouseChange = (newWarehouseCode) => {
    setHeaderData(prev => ({ ...(prev || {}), Warehouse: newWarehouseCode }));
    
    const updatedComponents = componentsData.map(comp => ({
      ...comp,
      Warehouse: newWarehouseCode
    }));
    setComponentsData(updatedComponents);
  };

  const handleHeaderFieldChange = (field, value) => {
    setHeaderData(prev => ({ ...(prev || {}), [field]: value }));
  };

  const handleAddPO = async () => {
    if (!itemCode || !headerData.PlannedQuantity) {
      toast.error("Please select a product and provide a planned quantity.");
      return;
    }

    const payload = {
      CompanyDB: "Z_Dummy_LDS_Live",
      ItemCode: itemCode,
      PlannedQuantity: parseFloat(headerData.PlannedQuantity),
      WarehouseCode: headerData.Warehouse || '',
      BranchId: parseInt(headerData.Branch, 10) || null,
      PostingDate: headerData.OrderDate || '',
      StartDate: headerData.StartDate || '',
      DueDate: headerData.DueDate || '',
      Priority: parseInt(headerData.Priority, 10) || 0,
      ProjectCode: headerData.Project || '',
      Status: headerData.Status === 'Planned' ? 'Planned' : headerData.Status,
      Type: headerData.Type === 'Standard' ? 'Standard' : headerData.Type
    };

    setLoading(true);
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.PRODUCTION_ORDERS.CREATE_ORDER, payload);
      
      if (response.data?.success) {
        const responseData = response.data.data;
        const message = responseData?.Message || responseData?.message || (typeof responseData === 'string' ? responseData : JSON.stringify(responseData));
        toast.success(message || "Production Order created successfully!", { duration: 5000 });
        handleClear();
        fetchPaginatedOrders(1, pageSize, searchQuery); // Refresh list
        setCurrentPage(1);
        setShowCreateForm(false);
      } else {
        toast.error(response.data?.message || "Failed to create Production Order.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "An error occurred while creating.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const tableColumns = [
    { key: 'DocNum', header: 'PO No.', width: '10%' },
    { key: 'ProductNo', header: 'Item No.', width: '15%' },
    { key: 'ProductDescription', header: 'Item Name', width: '25%' },
    { key: 'PlannedQty', header: 'Planned Qty', width: '10%' },
    { key: 'DueDate', header: 'Due Date', width: '15%', render: (row) => formatDate(row.DueDate) },
    { key: 'Project', header: 'Project', width: '15%' },
    { key: 'Status', header: 'Status', width: '10%' },
  ];

  return (
    <div className="po-container">
      {error && <div className="po-error">{error}</div>}

      {showCreateForm && (
        <>
          <div className="po-form">
            <ProductionOrderHeader 
              headerData={headerData} 
              isCreateMode={true} 
              products={products}
              warehouses={warehouses}
              branches={branches}
              projectList={projectList}
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

          <div className="po-footer-actions">
            <Button variant="primary" disabled={loading} onClick={handleAddPO}>
              Add PO
            </Button>
            <Button variant="danger" onClick={handleClear} disabled={loading}>
              Clear
            </Button>
          </div>
        </>
      )}

      <div className={`po-table-section ${showCreateForm ? 'po-table-section-margin' : ''}`}>
        <div className="po-table-header">
          <h3 className="po-table-title"></h3>
          <div className="po-table-controls">
            <div className="purchase-order-search-wrapper">
              <IconSearch size={18} className="purchase-order-search-icon" />
              <input
                type="text"
                placeholder="Search by Doc No, Item, Project..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="purchase-order-search-input"
              />
            </div>
            <Button variant="primary" onClick={() => setShowCreateForm(!showCreateForm)}>
              {showCreateForm ? 'Cancel Creation' : 'Create Production Order'}
            </Button>
          </div>
        </div>
        <Table 
          data={paginatedOrders}
          columns={tableColumns}
          totalEntries={totalOrders}
          currentPage={currentPage}
          pageSize={pageSize}
          isLoading={tableLoading}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setPageSize}
          showActions={false}
          onRowClick={(row) => {
            setSelectedDocNum(row.DocNum);
            setIsDetailsModalOpen(true);
          }}
        />
      </div>

      <ProductionOrderDetailsModal 
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        docNum={selectedDocNum}
      />
    </div>
  );
};

export default ProductionOrders;
