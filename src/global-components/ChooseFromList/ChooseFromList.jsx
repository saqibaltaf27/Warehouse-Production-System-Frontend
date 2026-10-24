import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { IconChevronDown, IconChevronRight, IconSearch, IconX } from '@tabler/icons-react';
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
  drillDown = null,
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
  const [expandedKey, setExpandedKey] = useState(null);
  const [drillLines, setDrillLines] = useState([]);
  const [drillLoading, setDrillLoading] = useState(false);

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
    setExpandedKey(null);
  };

  const toggleDrill = async (row) => {
    if (!drillDown) return;

    const key = row[drillDown.entryKey || valueKey];
    if (expandedKey === key) {
      setExpandedKey(null);
      setDrillLines([]);
      return;
    }

    setExpandedKey(key);
    setDrillLines([]);
    setDrillLoading(true);
    try {
      const response = await axiosInstance.get(drillDown.endpoint, {
        params: { ...(drillDown.extraParams || {}), docEntry: key },
      });
      const lines = response.data?.data?.lines || [];
      const byLine = new Map();
      lines.forEach((line) => {
        const lineKey = `${line.ItemCode || ''}::${line.BaseLine ?? ''}`;
        if (byLine.has(lineKey)) return;
        byLine.set(lineKey, {
          ItemCode: line.ItemCode || '',
          ItemName: line.ItemName || '',
          Quantity: Number(line.ActualQty) || 0,
        });
      });
      const grouped = new Map();
      byLine.forEach((line) => {
        const current = grouped.get(line.ItemCode) || {
          ItemCode: line.ItemCode,
          ItemName: line.ItemName,
          Quantity: 0,
        };
        current.Quantity += line.Quantity;
        grouped.set(line.ItemCode, current);
      });
      setDrillLines([...grouped.values()]);
    } catch (err) {
      console.error('CFL drill-down error:', err);
      setDrillLines([]);
    } finally {
      setDrillLoading(false);
    }
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
                        {drillDown && <th className="cfl-expand-col" />}
                        {columns.map((col, idx) => (
                          <th key={idx}>{col.header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(isBackendPaginated ? data : data.slice((page - 1) * pageSize, page * pageSize)).map((row, rIdx) => {
                        const rowKey = row[drillDown?.entryKey || valueKey];
                        const isExpanded = drillDown && expandedKey === rowKey;
                        return (
                          <React.Fragment key={rIdx}>
                            <tr className={isExpanded ? 'cfl-row-expanded' : ''} onClick={() => handleSelect(row)}>
                              {drillDown && (
                                <td className="cfl-expand-col">
                                  <button
                                    type="button"
                                    className="cfl-expand-btn"
                                    title={isExpanded ? 'Hide items' : 'Show items'}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleDrill(row);
                                    }}
                                  >
                                    {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
                                  </button>
                                </td>
                              )}
                              {columns.map((col, cIdx) => (
                                <td key={cIdx}>{col.render ? col.render(row) : (row[col.key] ?? '-')}</td>
                              ))}
                            </tr>
                            {isExpanded && (
                              <tr className="cfl-drill-row">
                                <td colSpan={columns.length + 1}>
                                  <div className="cfl-drill">
                                    <div className="cfl-drill-head">
                                      <span>
                                        {drillLoading
                                          ? 'Loading items...'
                                          :''}
                                      </span>
                                    </div>
                                    {drillLoading ? null : drillLines.length === 0 ? (
                                      <div className="cfl-drill-loading">No items on this document.</div>
                                    ) : (
                                      <table className="cfl-drill-table">
                                        <thead>
                                          <tr>
                                            <th>Item Code</th>
                                            <th>Item Name</th>
                                            <th>Quantity</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {drillLines.map((line) => (
                                            <tr key={line.ItemCode}>
                                              <td>{line.ItemCode || '-'}</td>
                                              <td>{line.ItemName || '-'}</td>
                                              <td>{Number.isInteger(line.Quantity) ? line.Quantity : line.Quantity.toLocaleString()}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
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
