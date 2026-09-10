import React, { useState, useEffect } from 'react';
import Table from '../../global-components/Table/Table';
import Button from '../../global-components/Button/Button';
import { purchaseOrderApi } from '../../apis/purchase-order/purchaseOrderApi';
import toast from 'react-hot-toast';
import { useLoading } from '../../context/LoadingContext';
import { IconSearch } from '@tabler/icons-react';
import PurchaseOrderModal from './PurchaseOrderModal';
import './PurchaseOrder.css';

const PurchaseOrder = () => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedPO, setSelectedPO] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchPurchaseRequests = async (page = 1, limit = 10, search = '') => {
    try {
      showLoading();
      const response = await purchaseOrderApi.getPurchaseRequests({ page, limit, search });
      if (response && response.success) {
        setData(response.data.data);
        setPagination(response.data.pagination);
      } else {
        toast.error(response?.message || 'Failed to fetch purchase requests');
      }
    } catch (error) {
      console.error('Error fetching purchase requests:', error);
      toast.error(error.message || 'Error fetching purchase requests');
    } finally {
      hideLoading();
    }
  };

  useEffect(() => {
    fetchPurchaseRequests(1, pagination.limit, debouncedSearch);
  }, [debouncedSearch]);

  const handlePageChange = (newPage) => {
    fetchPurchaseRequests(newPage, pagination.limit, debouncedSearch);
  };

  const handleRowsPerPageChange = (newLimit) => {
    fetchPurchaseRequests(1, newLimit, debouncedSearch);
  };

  const handleRowClick = async (row) => {
    try {
      showLoading();
      const response = await purchaseOrderApi.getPurchaseRequestDetails(row.DocEntry);
      if (response && response.success) {
        setSelectedPO(response.data);
        setIsModalOpen(true);
      } else {
        toast.error(response?.message || 'Failed to fetch details');
      }
    } catch (error) {
      console.error('Error fetching details:', error);
      toast.error(error.message || 'Failed to fetch details');
    } finally {
      hideLoading();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const columns = [
    { key: 'DocEntry', header: 'DocEntry', width: 100 },
    { key: 'DocNum', header: 'DocNum', width: 100 },
    { key: 'DocStatus', header: 'DocStatus', width: 100 },
    { 
      key: 'DocDate', 
      header: 'DocDate', 
      width: 120,
      render: (row) => formatDate(row.DocDate)
    },
    { 
      key: 'ReqDate', 
      header: 'ReqDate', 
      width: 120,
      render: (row) => formatDate(row.ReqDate)
    },
    { key: 'Requester', header: 'Requester', width: 150 },
    { key: 'ReqName', header: 'ReqName', width: 200 },
    { key: 'Branch', header: 'Branch (Remarks)', width: 150 },
    { key: 'Comments', header: 'Comments', width: 250 }
  ];

  return (
    <div className="purchase-order-page">
      <div className="purchase-order-header">
        <h1>Purchase Order</h1>
        <div className="purchase-order-header-actions">
          <div className="purchase-order-search-wrapper">
            <IconSearch size={18} className="purchase-order-search-icon" />
            <input
              type="text"
              placeholder="Search by DocNum, ReqName..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="purchase-order-search-input"
            />
          </div>
          <Button 
            variant="primary" 
            onClick={() => toast('New Purchase Request Clicked')}
          >
            New purchase request
          </Button>
        </div>
      </div>

      <div className="purchase-order-content">
        <Table
          data={data}
          columns={columns}
          totalEntries={pagination.total}
          currentPage={pagination.page}
          pageSize={pagination.limit}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleRowsPerPageChange}
          showActions={false}
          showPagination={true}
          isLoading={false}
          onRowClick={handleRowClick}
        />
      </div>

      <PurchaseOrderModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        data={selectedPO} 
      />
    </div>
  );
};

export default PurchaseOrder;
