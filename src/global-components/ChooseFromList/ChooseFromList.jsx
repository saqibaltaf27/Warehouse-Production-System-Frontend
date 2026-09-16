import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { IconSearch, IconX } from '@tabler/icons-react';
import { axiosInstance } from '../../apis/axiosinstance';
import Pagination from '../Pagination/Pagination';
import './ChooseFromList.css';

export default function ChooseFromList({
  value = '',
  displayValue = '',
  onChange,
  title = 'Select Record',
  apiEndpoint,
  columns = [],
  valueKey = 'code',
  labelKey = 'name',
  queryParams = {},
  placeholder = 'Click to select...',
  disabled = false,
  label = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [isBackendPaginated, setIsBackendPaginated] = useState(false);

  const fetchData = useCallback(async () => {
    if (!apiEndpoint) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...queryParams,
        page,
        limit: pageSize,
        ...(search ? { search } : {})
      });

      const response = await axiosInstance.get(`${apiEndpoint}?${params}`);
      const json = response.data;

      if (json.success) {
        if (json.data?.items !== undefined) {
          setData(json.data.items);
          setTotalItems(json.data.total || 0);
          setIsBackendPaginated(true);
        } else {
          let arr = Array.isArray(json.data) ? json.data : (json.data ? [json.data] : []);
          setData(arr);
          setTotalItems(arr.length);
          setIsBackendPaginated(false);
        }
      }
    } catch (err) {
      console.error('CFL fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, search, page, pageSize, JSON.stringify(queryParams)]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== searchInput) {
        setSearch(searchInput);
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  const handleOpen = () => {
    if (disabled) return;
    setSearchInput('');
    setSearch('');
    setIsOpen(true);
  };

  const handleSelect = (row) => {
    onChange?.(row[valueKey], row[labelKey], row);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.('', '', null);
  };

  return (
    <div className="cfl-wrapper">
      {label && <label className="cfl-label">{label}</label>}
      <div
        className={`cfl-input-group ${disabled ? 'disabled' : ''} ${value ? 'has-value' : ''}`}
        onClick={handleOpen}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => e.key === 'Enter' && handleOpen()}
      >
        <input
          type="text"
          className="cfl-display-input"
          value={displayValue || value || ''}
          placeholder={placeholder}
          readOnly
          tabIndex={-1}
        />
        {value && !disabled ? (
          <button type="button" className="cfl-action-btn clear" onClick={handleClear}>
            <IconX size={14} />
          </button>
        ) : (
          <button type="button" className="cfl-action-btn search">
            <IconSearch size={14} />
          </button>
        )}
      </div>

      {isOpen && createPortal(
        <div className="cfl-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="cfl-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="cfl-modal-header">
              <h3>{title}</h3>
              <button type="button" className="cfl-close-btn" onClick={() => setIsOpen(false)}>
                &times;
              </button>
            </div>
            
            <div className="cfl-modal-body">
              <div className="cfl-search-bar">
                <IconSearch size={16} />
                <input
                  type="text"
                  placeholder="Search code, name, etc..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  autoFocus
                />
              </div>
              
              <div className="cfl-table-container">
                {loading ? (
                  <div className="cfl-loading">Loading...</div>
                ) : data.length === 0 ? (
                  <div className="cfl-empty">No records found.</div>
                ) : (
                  <table className="cfl-table">
                    <thead>
                      <tr>
                        {columns.map((col, idx) => (
                          <th key={idx}>{col.header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(isBackendPaginated ? data : data.slice((page - 1) * pageSize, page * pageSize)).map((row, rIdx) => (
                        <tr key={rIdx} onClick={() => handleSelect(row)}>
                          {columns.map((col, cIdx) => (
                            <td key={cIdx}>{row[col.key] || '-'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              
              {!loading && totalItems > 0 && (
                <div className="cfl-pagination-wrapper">
                  <Pagination
                    currentPage={page}
                    totalItems={totalItems}
                    totalPages={Math.ceil(totalItems / pageSize)}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={(size) => {
                      setPageSize(size);
                      setPage(1);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
