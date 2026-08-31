import React, { useState, useEffect } from 'react';
import Table from '../../global-components/Table/Table';
import Button from '../../global-components/Button/Button';
import GlobalPopup from '../../global-components/GlobalPopup/GlobalPopup';
import Input from '../../global-components/Input/Input';
import { IconPlus } from '@tabler/icons-react';
import Select from 'react-select';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { productionTemplateApi } from '../../apis/production-template/production-template';

const Tab3 = () => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [productionOrders, setProductionOrders] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalEntries, setTotalEntries] = useState(0);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: '',
    lineMachine: '',
    productionOrder: '',
    product: '',
    plannedQty: '',
    actualQty: '',
    achievementPct: '',
    standardHours: '',
    actualHours: '',
    efficiencyPct: '',
    manpower: '',
    unitsPerManHour: '',
    remarks: ''
  });

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
      const response = await productionTemplateApi.getDailyEfficiency(page, size);
      if (response.data?.success) {
        setData(response.data.data);
        if (response.data.pagination) {
          setTotalEntries(response.data.pagination.totalRecords);
        }
      }
    } catch (err) {
      console.error("Failed to fetch daily efficiency:", err);
      toast.error("Failed to load daily efficiency data");
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

  const handleChange = (e) => {
    const { id, value } = e.target;
    
    setFormData(prev => {
      const updated = { ...prev, [id]: value };
      
      if (['plannedQty', 'actualQty', 'standardHours', 'actualHours', 'manpower'].includes(id)) {
        const planned = parseFloat(updated.plannedQty) || 0;
        const actual = parseFloat(updated.actualQty) || 0;
        const standardHr = parseFloat(updated.standardHours) || 0;
        const actualHr = parseFloat(updated.actualHours) || 0;
        const mp = parseFloat(updated.manpower) || 0;
        
        updated.achievementPct = planned > 0 ? ((actual / planned) * 100).toFixed(2) : '0.00';
        updated.efficiencyPct = actualHr > 0 ? ((standardHr / actualHr) * 100).toFixed(2) : '0.00';
        updated.unitsPerManHour = (mp > 0 && actualHr > 0) ? (actual / (mp * actualHr)).toFixed(2) : '0.00';
      }
      
      return updated;
    });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      date: formData.date,
      shift: formData.shift,
      lineMachine: formData.lineMachine,
      productionOrder: formData.productionOrder,
      product: formData.product,
      plannedQty: parseFloat(formData.plannedQty) || 0,
      actualQty: parseFloat(formData.actualQty) || 0,
      achievementPct: parseFloat(formData.achievementPct) || 0,
      standardHours: parseFloat(formData.standardHours) || 0,
      actualHours: parseFloat(formData.actualHours) || 0,
      efficiencyPct: parseFloat(formData.efficiencyPct) || 0,
      manpower: parseInt(formData.manpower) || 0,
      unitsPerManHour: parseFloat(formData.unitsPerManHour) || 0,
      remarks: formData.remarks,
      createdBy: user?.EmpID
    };
    
    try {
      const response = await productionTemplateApi.addDailyEfficiency(payload);
      if (response.data?.success) {
        toast.success("Daily efficiency added successfully");
        setShowModal(false);
        setFormData({
          date: new Date().toISOString().split('T')[0],
          shift: '',
          lineMachine: '',
          productionOrder: '',
          product: '',
          plannedQty: '',
          actualQty: '',
          achievementPct: '',
          standardHours: '',
          actualHours: '',
          efficiencyPct: '',
          manpower: '',
          unitsPerManHour: '',
          remarks: ''
        });
        fetchData(1);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("Failed to add daily efficiency:", err);
      toast.error("Failed to save data");
    }
  };

  const columns = [
    { header: 'Date', key: 'date', render: row => new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) },
    { header: 'Shift', key: 'shift' },
    { header: 'Line/Machine', key: 'lineMachine' },
    { header: 'Production Order', key: 'productionOrder' },
    { header: 'Product', key: 'product' },
    { header: 'Planned Qty', key: 'plannedQty', render: row => row.plannedQty?.toLocaleString() || '0' },
    { header: 'Actual Qty', key: 'actualQty', render: row => row.actualQty?.toLocaleString() || '0' },
    { header: 'Standard Hours', key: 'standardHours', render: row => row.standardHours?.toLocaleString() || '0' },
    { header: 'Actual Hours', key: 'actualHours', render: row => row.actualHours?.toLocaleString() || '0' },
    { header: 'Manpower', key: 'manpower' },
    { header: 'Units/Man-Hour', key: 'unitsPerManHour', render: row => (row.unitsPerManHour || 0).toFixed(2) },
    { header: 'Achievement %', key: 'achievementPct', render: row => `${(row.achievementPct || 0).toFixed(2)}%` },
    { header: 'Efficiency %', key: 'efficiencyPct', render: row => `${(row.efficiencyPct || 0).toFixed(2)}%` },
    { header: 'Remarks', key: 'remarks' }
  ];

  return (
    <div className="planning-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3>Daily Production Efficiency</h3>
          <p className="section-desc" style={{ color: '#666', marginTop: '5px' }}>Track daily production metrics, efficiency, and manpower utilization.</p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)} icon={<IconPlus size={18} />}>
          Add Efficiency Data
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
          title="Add Daily Production Efficiency"
          onClose={() => setShowModal(false)}
          showClose={false}
        >
          <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>Add Daily Production Efficiency</h2>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <Input
                label="Date"
                id="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
              <Input
                label="Shift"
                id="shift"
                type="text"
                placeholder="Enter Shift"
                value={formData.shift}
                onChange={handleChange}
                required
              />
              <Input
                label="Line/Machine"
                id="lineMachine"
                type="text"
                placeholder="Enter Line/Machine"
                value={formData.lineMachine}
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
                label="Planned Qty"
                id="plannedQty"
                type="number"
                placeholder="Enter Planned Qty"
                value={formData.plannedQty}
                onChange={handleChange}
                required
              />
              <Input
                label="Actual Qty"
                id="actualQty"
                type="number"
                placeholder="Enter Actual Qty"
                value={formData.actualQty}
                onChange={handleChange}
                required
              />
              <Input
                label="Achievement %"
                id="achievementPct"
                type="number"
                step="0.01"
                value={formData.achievementPct}
                onChange={handleChange}
              />
              <Input
                label="Standard Hours"
                id="standardHours"
                type="number"
                step="0.01"
                placeholder="Enter Standard Hours"
                value={formData.standardHours}
                onChange={handleChange}
                required
              />
              <Input
                label="Actual Hours"
                id="actualHours"
                type="number"
                step="0.01"
                placeholder="Enter Actual Hours"
                value={formData.actualHours}
                onChange={handleChange}
                required
              />
              <Input
                label="Efficiency %"
                id="efficiencyPct"
                type="number"
                step="0.01"
                value={formData.efficiencyPct}
                onChange={handleChange}
              />
              <Input
                label="Manpower"
                id="manpower"
                type="number"
                placeholder="Enter Manpower"
                value={formData.manpower}
                onChange={handleChange}
                required
              />
              <Input
                label="Units/Man-Hour"
                id="unitsPerManHour"
                type="number"
                step="0.01"
                value={formData.unitsPerManHour}
                onChange={handleChange}
              />
              <div style={{ gridColumn: '1 / -1' }}>
                <Input
                  label="Remarks"
                  id="remarks"
                  type="text"
                  placeholder="Enter remarks"
                  value={formData.remarks}
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

export default Tab3;
