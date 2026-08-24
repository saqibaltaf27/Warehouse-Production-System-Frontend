import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { axiosInstance } from '../../apis/axiosinstance';
import { API_ENDPOINTS } from '../../apis/endpoints';
import Table from '../../global-components/Table/Table';
import Tabs from '../../global-components/Tabs/Tabs';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import './ItemMasterView.css';

const fmt = (n) => {
  if (n == null || isNaN(n)) return '0';
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
};

const ItemMasterView = () => {
  const { itemCode } = useParams();
  const [searchParams] = useSearchParams();
  const company = searchParams.get('company') || 'GMS';
  const navigate = useNavigate();

  const [itemDetail, setItemDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  // UI States
  const [stockTab, setStockTab] = useState('Warehouse Report');
  const [historyTab, setHistoryTab] = useState('Current Month'); // Current Month, Current Year, All Time, Custom Date
  const [customDate, setCustomDate] = useState({ start: '', end: '' });

  // History Data State
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);

  const fetchItemDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(API_ENDPOINTS.INVENTORY.ITEM_DETAIL(itemCode), { params: { company } });
      if (res.data?.success) {
        setItemDetail(res.data.data);
      }
    } catch (err) {
      console.error('Item detail error:', err);
    } finally {
      setLoading(false);
    }
  }, [itemCode, company]);

  const getDatesFromTab = useCallback((tab) => {
    const today = new Date();
    const formatDate = (d) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    if (tab === 'Current Month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: formatDate(start), endDate: formatDate(today) };
    }
    if (tab === 'Current Year') {
      const start = new Date(today.getFullYear(), 0, 1);
      return { startDate: formatDate(start), endDate: formatDate(today) };
    }
    if (tab === 'All Time') {
      return { startDate: '', endDate: '' };
    }
    return { startDate: customDate.start, endDate: customDate.end };
  }, [customDate]);

  const fetchHistory = useCallback(async () => {
    if (historyTab === 'Custom Date' && (!customDate.start || !customDate.end)) return;
    try {
      setHistoryLoading(true);
      const { startDate, endDate } = getDatesFromTab(historyTab);
      const params = { company };
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      const res = await axiosInstance.get(API_ENDPOINTS.INVENTORY.ITEM_HISTORY(itemCode), { params });
      if (res.data?.success) {
        setHistoryData(res.data.data.history || []);
        setHistoryPage(1);
      }
    } catch (err) {
      console.error('History fetch error:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [itemCode, company, historyTab, customDate, getDatesFromTab]);

  useEffect(() => {
    fetchItemDetail();
  }, [fetchItemDetail]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const breadcrumbs = [
    { label: 'Inventory', href: '/inventory' },
    { label: itemCode, href: `/inventory/item-master/${itemCode}` }
  ];

  const chartData = useMemo(() => {
    if (!historyData || historyData.length === 0) return [];
    
    // Reverse history to show chronological order
    const sorted = [...historyData].sort((a, b) => new Date(a.TransactionDate) - new Date(b.TransactionDate));
    
    // Group by date (day)
    const grouped = {};
    sorted.forEach(t => {
      const date = new Date(t.TransactionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      if (!grouped[date]) {
        grouped[date] = { date, stockIn: 0, stockOut: 0, stockAvailable: 0 };
      }
      grouped[date].stockIn += (t.IncomingQty || 0);
      grouped[date].stockOut += (t.OutgoingQty || 0);
      grouped[date].stockAvailable = t.StockLeft; // Last transaction of the day sets the available stock
    });
    
    return Object.values(grouped);
  }, [historyData]);

  const stats = useMemo(() => {
    if (!historyData || historyData.length === 0) return { in: 0, out: 0, available: 0 };
    let totalIn = 0;
    let totalOut = 0;
    historyData.forEach(t => {
      totalIn += (t.IncomingQty || 0);
      totalOut += (t.OutgoingQty || 0);
    });
    const latestAvailable = historyData.length > 0 ? historyData[0].StockLeft : 0;
    
    return { in: totalIn, out: totalOut, available: latestAvailable };
  }, [historyData]);

  const paginatedHistoryData = useMemo(() => {
    const start = (historyPage - 1) * historyPageSize;
    return historyData.slice(start, start + historyPageSize);
  }, [historyData, historyPage, historyPageSize]);


  if (loading) {
    return <div className="inventory-page p-6">Loading...</div>;
  }

  if (!itemDetail) {
    return <div className="inventory-page p-6">Item not found.</div>;
  }

  return (
    <div className="item-master-page fade-in-up">
      <div className="breadcrumb-wrapper">
         <h1 className="page-title">Item Details: {itemCode}</h1>
      </div>
      
      <div className="item-detail-content mt-6">
        
        {/* ITEM OVERVIEW CARD */}
        <div className="detail-card">
          <div className="detail-card-header">
            <span className="icon">📦</span> Item Overview
          </div>
          <div className="overview-grid">
            <div className="overview-field">
              <label>Item Code</label>
              <span>{itemDetail.itemCode}</span>
            </div>
            <div className="overview-field flex-2">
              <label>Item Name</label>
              <span>{itemDetail.itemName}</span>
            </div>
            <div className="overview-field">
              <label>Manage Items by</label>
              <span>{itemDetail.trackingType || 'None'}</span>
            </div>
            <div className="overview-field">
              <label>Cat No</label>
              <span>{itemDetail.frgnName || '—'}</span>
            </div>
            <div className="overview-field">
              <label>Category</label>
              <span>{itemDetail.category || '—'}</span>
            </div>
            <div className="overview-field">
              <label>Principal</label>
              <span>{itemDetail.principal || '—'}</span>
            </div>
            <div className="overview-field">
              <label>Business Segment</label>
              <span>{itemDetail.businessSegment || '—'}</span>
            </div>
          </div>
        </div>

        {/* WAREHOUSE & EXPIRY STOCK SUMMARY */}
        <div className="detail-card mt-6">
          <div className="detail-card-header flex-between border-b">
            <div><span className="icon">🏢</span> Warehouse & Expiry Stock Summary</div>
            <Tabs 
              tabs={[
                { key: 'Warehouse Report', label: 'Warehouse Report' },
                { key: 'Batch & Serial Expiry', label: 'Batch & Serial Expiry' }
              ]} 
              activeTab={stockTab} 
              onTabChange={setStockTab} 
            />
          </div>
          <div className="table-container p-6">
            {stockTab === 'Warehouse Report' ? (
              <Table
                data={itemDetail.warehouses || []}
                columns={[
                  { header: 'WAREHOUSE CODE', key: 'WarehouseCode' },
                  { header: 'WAREHOUSE NAME', key: 'WarehouseName' },
                  { header: 'IN STOCK', key: 'InStock', render: (r) => fmt(r.InStock) },
                  { header: 'COMMITTED', key: 'Committed', render: (r) => fmt(r.Committed) },
                  { header: 'ORDERED', key: 'Ordered', render: (r) => fmt(r.Ordered) },
                  { header: 'AVAILABLE', key: 'Available', render: (r) => <span className="font-bold text-blue tabular-nums">{fmt(r.Available)}</span> },
                ]}
                totalEntries={itemDetail.warehouses?.length || 0}
                showActions={false}
                showPagination={false}
              />
            ) : (
              <Table
                data={itemDetail.expiryLots || []}
                columns={[
                  { header: 'WAREHOUSE', key: 'WarehouseName', render: (r) => r.WarehouseName || r.WhsCode },
                  { header: 'TYPE', key: 'TrackingType', render: () => itemDetail.trackingType },
                  { header: 'BATCH / SERIAL NO', key: 'BatchNumber' },
                  { header: 'EXPIRY DATE', key: 'ExpiryDate', render: (r) => r.ExpiryDate ? new Date(r.ExpiryDate).toISOString().split('T')[0] : '—' },
                  { header: 'DAYS TO EXPIRY', key: 'DaysToExpiry', render: (r) => {
                      if (r.DaysToExpiry == null) return '—';
                      if (r.DaysToExpiry < 0) return `Expired (${Math.abs(r.DaysToExpiry)}d)`;
                      return `${r.DaysToExpiry} days`;
                  }},
                  { header: 'STOCK QUANTITY', key: 'StockQty', render: (r) => <span className="tabular-nums font-bold">{fmt(r.StockQty)}</span> },
                ]}
                totalEntries={itemDetail.expiryLots?.length || 0}
                showActions={false}
                showPagination={false}
              />
            )}
          </div>
        </div>

        {/* INVENTORY AUDIT MOVEMENT HISTORY */}
        <div className="detail-card mt-6 relative">
          <div className="detail-card-header flex-between border-b" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div><span className="icon">🕒</span> Inventory Audit Movement History & Transaction Log</div>
            <Tabs 
              tabs={[
                { key: 'Current Month', label: 'Current Month' },
                { key: 'Current Year', label: 'Current Year' },
                { key: 'All Time', label: 'All Time' },
                { key: 'Custom Date', label: 'Custom Date' }
              ]} 
              activeTab={historyTab} 
              onTabChange={setHistoryTab} 
            />
          </div>
          
          {historyTab === 'Custom Date' && (
            <div className="p-4 bg-gray-50 flex gap-4 items-end border-b">
               <div>
                  <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                  <input type="date" className="border rounded px-3 py-1.5" value={customDate.start} onChange={(e) => setCustomDate({...customDate, start: e.target.value})} />
               </div>
               <div>
                  <label className="block text-sm text-gray-600 mb-1">End Date</label>
                  <input type="date" className="border rounded px-3 py-1.5" value={customDate.end} onChange={(e) => setCustomDate({...customDate, end: e.target.value})} />
               </div>
            </div>
          )}

          <div className="chart-stats border-b flex-between" style={{ padding: '24px', backgroundColor: '#fff' }}>
            <div className="text-sm font-semibold text-gray-600"></div>
            <div className="flex" style={{ gap: '32px' }}>
              <div className="stat-item text-green" style={{ textAlign: 'center', alignItems: 'center' }}>
                <span className="stat-val" style={{ fontSize: '1.5rem' }}>{fmt(stats.in)}</span>
                <span className="stat-lbl" style={{ color: '#10b981' }}>TOTAL STOCK IN</span>
              </div>
              <div className="stat-item text-red" style={{ textAlign: 'center', alignItems: 'center' }}>
                <span className="stat-val" style={{ fontSize: '1.5rem' }}>{fmt(stats.out)}</span>
                <span className="stat-lbl" style={{ color: '#ef4444' }}>TOTAL STOCK OUT</span>
              </div>
              <div className="stat-item text-blue" style={{ textAlign: 'center', alignItems: 'center' }}>
                <span className="stat-val" style={{ fontSize: '1.5rem' }}>{fmt(stats.available)}</span>
                <span className="stat-lbl" style={{ color: '#3b82f6' }}>STOCK AVAILABLE</span>
              </div>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
             {historyLoading && (
                <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center" style={{ minHeight: '200px' }}>
                   <div className="loader"></div>
                </div>
             )}

             {chartData.length > 0 && !historyLoading ? (
               <div className="chart-wrapper p-6" style={{ height: '350px', width: '100%' }}>
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                     <defs>
                       <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="colorAvail" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                     <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                     <YAxis tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}K` : val} tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                     <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                     <Legend verticalAlign="bottom" height={36} iconType="circle" />
                     <Area type="monotone" dataKey="stockIn" name="Stock In" stroke="#10b981" fillOpacity={1} fill="url(#colorIn)" strokeWidth={2} />
                     <Area type="monotone" dataKey="stockOut" name="Stock Out" stroke="#ef4444" fillOpacity={1} fill="url(#colorOut)" strokeWidth={2} />
                     <Area type="monotone" dataKey="stockAvailable" name="Stock Available" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAvail)" strokeWidth={2} />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
             ) : (
                !historyLoading && <div className="p-6 text-center text-gray-500 py-12">No transactions found for the selected period.</div>
             )}
          </div>
          
          <div className="detail-card-header text-sm font-semibold border-y bg-gray-50">
            Transaction Audit Log Detail
          </div>
          <div className="table-container p-6 relative">
             {historyLoading && (
                <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center"></div>
             )}
            <Table
              data={paginatedHistoryData}
              columns={[
                { header: 'ITEM CODE', key: 'ItemCode' },
                { header: 'TRANSACTION NO', key: 'DocumentNumber' },
                { header: 'TRANSACTION NAME', key: 'TransactionName' },
                { header: 'WAREHOUSE', key: 'WarehouseName' },
                { header: 'IN QTY', key: 'IncomingQty', render: (r) => <span className={`tabular-nums font-bold ${r.IncomingQty > 0 ? 'text-green' : 'text-gray'}`}>{fmt(r.IncomingQty)}</span> },
                { header: 'OUT QTY', key: 'OutgoingQty', render: (r) => <span className={`tabular-nums font-bold ${r.OutgoingQty > 0 ? 'text-red' : 'text-gray'}`}>{fmt(r.OutgoingQty)}</span> },
                { header: 'DATE', key: 'TransactionDate', render: (r) => new Date(r.TransactionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) },
                { header: 'STOCK AVAILABLE', key: 'StockLeft', render: (r) => <span className="text-blue tabular-nums font-bold">{fmt(r.StockLeft)}</span> },
                { header: 'PRICE / UNIT', key: 'PricePerUnit', render: (r) => <span className="tabular-nums">{fmt(r.PricePerUnit)}</span> },
                { header: 'TOTAL VALUE', key: 'TotalValue', render: (r) => <span className="tabular-nums">{fmt(r.TotalValue)}</span> },
              ]}
              totalEntries={historyData.length}
              showActions={false}
              showPagination={true}
              currentPage={historyPage}
              pageSize={historyPageSize}
              onPageChange={setHistoryPage}
              onItemsPerPageChange={(size) => {
                setHistoryPageSize(size);
                setHistoryPage(1);
              }}
            />
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default ItemMasterView;
