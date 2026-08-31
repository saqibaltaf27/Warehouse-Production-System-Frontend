import React, { useState, useEffect } from 'react';
import Table from '../../global-components/Table/Table';
import Button from '../../global-components/Button/Button';
import GlobalPopup from '../../global-components/GlobalPopup/GlobalPopup';
import Input from '../../global-components/Input/Input';
import { IconPlus } from '@tabler/icons-react';
import Select from 'react-select';
import { productionTemplateApi } from '../../apis/production-template/production-template';

import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Tab2 = () => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalEntries, setTotalEntries] = useState(0);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    productionOrder: '',
    product: '',
    producedQty: '',
    rejectedQty: '',
    reworkedQty: '',
    targetRejectionPct: '2.00',
    rejectionPct: '',
    reworkPct: '',
    fpy: '',
    topRejectionReason: ''
  });

  const [productionOrders, setProductionOrders] = useState([]);

  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize]);

  useEffect(() => {
    if (showModal) {
      fetchProductionOrders();
    }
  }, [showModal]);

  const fetchData = async (page = currentPage, size = pageSize) => {
    try {
      setIsLoading(true);
      const response = await productionTemplateApi.getQualityPerformance(page, size);
      if (response.data?.success) {
        setData(response.data.data);
        if (response.data.pagination) {
          setTotalEntries(response.data.pagination.totalRecords);
        }
      }
    } catch (err) {
      console.error("Failed to fetch quality performance:", err);
      toast.error("Failed to load quality performance data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductionOrders = async () => {
    try {
      const response = await productionTemplateApi.getProductionOrders();
      if (response.data?.success) {
        setProductionOrders(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch production orders:", err);
    }
  };

  const handleSelectChange = (selectedOption) => {
    if (selectedOption) {
      setFormData(prev => ({
        ...prev,
        productionOrder: selectedOption.value,
        product: productionOrders.find(o => o.ProductionOrderNo === selectedOption.value)?.ProductName || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        productionOrder: '',
        product: ''
      }));
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    
    setFormData(prev => {
      const updated = { ...prev, [id]: value };
      
      // Auto-calculate metrics when quantities change
      if (['producedQty', 'rejectedQty', 'reworkedQty'].includes(id)) {
        const produced = parseFloat(updated.producedQty) || 0;
        const rejected = parseFloat(updated.rejectedQty) || 0;
        const reworked = parseFloat(updated.reworkedQty) || 0;
        
        updated.rejectionPct = produced > 0 ? ((rejected / produced) * 100).toFixed(2) : '0.00';
        updated.reworkPct = produced > 0 ? ((reworked / produced) * 100).toFixed(2) : '0.00';
        updated.fpy = produced > 0 ? (((produced - rejected) / produced) * 100).toFixed(2) : '100.00';
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      date: formData.date,
      productionOrder: formData.productionOrder,
      product: formData.product,
      producedQty: parseFloat(formData.producedQty) || 0,
      rejectedQty: parseFloat(formData.rejectedQty) || 0,
      reworkedQty: parseFloat(formData.reworkedQty) || 0,
      rejectionPct: parseFloat(formData.rejectionPct) || 0,
      reworkPct: parseFloat(formData.reworkPct) || 0,
      fpy: parseFloat(formData.fpy) || 100,
      targetRejectionPct: parseFloat(formData.targetRejectionPct) || 2.00,
      topRejectionReason: formData.topRejectionReason,
      createdBy: user?.EmpID
    };
    
    try {
      const response = await productionTemplateApi.addQualityPerformance(payload);
      if (response.data?.success) {
        toast.success("Quality performance added successfully");
        setShowModal(false);
        setFormData({
          date: new Date().toISOString().split('T')[0],
          productionOrder: '',
          product: '',
          producedQty: '',
          rejectedQty: '',
          reworkedQty: '',
          targetRejectionPct: '2.00',
          rejectionPct: '',
          reworkPct: '',
          fpy: '',
          topRejectionReason: ''
        });
        fetchData(1);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("Failed to add quality performance:", err);
      toast.error("Failed to save data");
    }
  };

  const calculateMetrics = (row) => {
    const produced = row.producedQty || 0;
    const rejected = row.rejectedQty || 0;
    const reworked = row.reworkedQty || 0;
    
    const rejectionPct = produced > 0 ? (rejected / produced) * 100 : 0;
    const reworkPct = produced > 0 ? (reworked / produced) * 100 : 0;
    const fpy = produced > 0 ? ((produced - rejected) / produced) * 100 : 100;
    
    return {
      rejectionPct,
      reworkPct,
      fpy
    };
  };

  const columns = [
    { header: 'Date', key: 'date', render: row => new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) },
    { header: 'Production Order', key: 'productionOrder' },
    { header: 'Product', key: 'product' },
    { header: 'Produced Qty', key: 'producedQty', render: row => row.producedQty.toLocaleString() },
    { header: 'Rejected Qty', key: 'rejectedQty', render: row => row.rejectedQty.toLocaleString() },
    { header: 'Reworked Qty', key: 'reworkedQty', render: row => row.reworkedQty.toLocaleString() },
    { header: 'Rejection %', key: 'rejectionPct', render: row => `${calculateMetrics(row).rejectionPct.toFixed(2)}%` },
    { header: 'Rework %', key: 'reworkPct', render: row => `${calculateMetrics(row).reworkPct.toFixed(2)}%` },
    { header: 'First Pass Yield %', key: 'fpy', render: row => `${calculateMetrics(row).fpy.toFixed(2)}%` },
    { header: 'Target Rejection %', key: 'targetRejectionPct', render: row => `${row.targetRejectionPct.toFixed(2)}%` },
    { header: 'Top Rejection Reason', key: 'topRejectionReason' }
  ];

  return (
    <div className="planning-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3>Quality Performance</h3>
          <p className="section-desc" style={{ color: '#666', marginTop: '5px' }}>Track and evaluate production quality, rejections, and yields.</p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)} icon={<IconPlus size={18} />}>
          Add Quality Data
        </Button>
      </div>

      <Table
        data={data}
        columns={columns}
        showPagination={true}
        currentPage={currentPage}
        pageSize={pageSize}
        totalEntries={totalEntries}
        onPageChange={(page) => setCurrentPage(page)}
        onItemsPerPageChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        showActions={false}
      />

      {showModal && (
        <GlobalPopup
          title="Add Quality Performance"
          onClose={() => setShowModal(false)}
          showClose={false}
        >
          <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>Add Quality Performance</h2>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <Input
                label="Date"
                id="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
              <div className="dome-form-group">
                <label htmlFor="productionOrder" className="dome-form-label">Production Order</label>
                <Select
                  id="productionOrder"
                  value={
                    formData.productionOrder 
                      ? { 
                          value: formData.productionOrder, 
                          label: formData.productionOrder 
                        } 
                      : null
                  }
                  onChange={handleSelectChange}
                  options={productionOrders.map((order) => ({
                    value: order.ProductionOrderNo,
                    label: `${order.ProductionOrderNo} - ${order.ProductName}`
                  }))}
                  placeholder="Search and Select Order"
                  isClearable
                  isSearchable
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      minHeight: '42px',
                      background: 'var(--dashboard-surface)',
                      border: `1px solid ${state.isFocused ? 'var(--dashboard-primary)' : 'var(--dashboard-border)'}`,
                      borderRadius: '11px',
                      fontSize: '13px',
                      boxShadow: 'none',
                      '&:hover': {
                        borderColor: state.isFocused ? 'var(--dashboard-primary)' : 'var(--dashboard-border)'
                      }
                    }),
                    valueContainer: (base) => ({
                      ...base,
                      padding: '0 13px',
                    }),
                    input: (base) => ({
                      ...base,
                      color: 'var(--dashboard-text)',
                      margin: 0,
                      padding: 0
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: 'var(--dashboard-text)',
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: 'var(--dashboard-text-muted)',
                    }),
                    menu: (base) => ({
                      ...base,
                      backgroundColor: 'var(--dashboard-surface)',
                      borderRadius: '11px',
                      border: '1px solid var(--dashboard-border)',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      zIndex: 9999
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected 
                        ? 'var(--dashboard-primary)' 
                        : state.isFocused 
                          ? 'var(--dashboard-bg)' 
                          : 'transparent',
                      color: state.isSelected ? '#fff' : 'var(--dashboard-text)',
                      fontSize: '13px',
                      cursor: 'pointer',
                      '&:active': {
                        backgroundColor: 'var(--dashboard-primary)'
                      }
                    })
                  }}
                />
              </div>
              <Input
                label="Product Name"
                id="product"
                type="text"
                placeholder="Auto-filled Product Name"
                value={formData.product}
                onChange={handleChange}
                readOnly={true}
                required
              />
              <Input
                label="Produced Qty"
                id="producedQty"
                type="number"
                placeholder="Enter Produced Qty"
                value={formData.producedQty}
                onChange={handleChange}
                required
              />
              <Input
                label="Rejected Qty"
                id="rejectedQty"
                type="number"
                placeholder="Enter Rejected Qty"
                value={formData.rejectedQty}
                onChange={handleChange}
                required
              />
              <Input
                label="Reworked Qty"
                id="reworkedQty"
                type="number"
                placeholder="Enter Reworked Qty"
                value={formData.reworkedQty}
                onChange={handleChange}
                required
              />
              <Input
                label="Target Rejection %"
                id="targetRejectionPct"
                type="number"
                step="0.01"
                placeholder="Target %"
                value={formData.targetRejectionPct}
                onChange={handleChange}
                required
              />
              <Input
                label="Rejection %"
                id="rejectionPct"
                type="number"
                step="0.01"
                value={formData.rejectionPct}
                onChange={handleChange}
              />
              <Input
                label="Rework %"
                id="reworkPct"
                type="number"
                step="0.01"
                value={formData.reworkPct}
                onChange={handleChange}
              />
              <Input
                label="First Pass Yield %"
                id="fpy"
                type="number"
                step="0.01"
                value={formData.fpy}
                onChange={handleChange}
              />
              <div style={{ gridColumn: '1 / -1' }}>
                <Input
                  label="Top Rejection Reason"
                  id="topRejectionReason"
                  type="text"
                  placeholder="Enter main reason for rejection"
                  value={formData.topRejectionReason}
                  onChange={handleChange}
                />
              </div>
              
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save Data
                </Button>
              </div>
            </form>
          </div>
        </GlobalPopup>
      )}
    </div>
  );
};

export default Tab2;
