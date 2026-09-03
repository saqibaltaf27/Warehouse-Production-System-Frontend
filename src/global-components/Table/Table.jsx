import React, { useState, useMemo } from 'react';
import { IconInfoCircle, IconListDetails, IconCheck, IconTrash, IconChevronUp, IconChevronDown, IconSelector } from '@tabler/icons-react';
import Pagination from '../Pagination/Pagination';
import './Table.css';
import './TableLoader.css';

const Table = ({
  data = [],
  columns = [],
  totalEntries = 0,
  onActionClick,
  showActions = true,
  showPagination = true,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  onItemsPerPageChange,
  onRowClick,
  isLoading = false,
}) => {
  const [sortConfig, setSortConfig] = useState(null);

  const totalPages = Math.ceil(totalEntries / pageSize) || 1;

  const sortedData = useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        
        if (valA === valB) return 0;
        if (valA == null) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valB == null) return sortConfig.direction === 'ascending' ? 1 : -1;

        const parseValue = (val) => {
          if (typeof val === 'number') return val;
          if (typeof val === 'string') {
            const cleanStr = val.replace(/[%$,]/g, '').trim();
            const num = Number(cleanStr);
            if (!isNaN(num) && cleanStr !== '') return num;
          }
          return val;
        };

        const parsedA = parseValue(valA);
        const parsedB = parseValue(valB);

        if (typeof parsedA === 'number' && typeof parsedB === 'number') {
           return sortConfig.direction === 'ascending' ? parsedA - parsedB : parsedB - parsedA;
        }
        
        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        
        if (strA < strB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (strA > strB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const requestSort = (key) => {
    if (!key) return;
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleAction = (action, row) => {
    if (onActionClick) {
      onActionClick(action, row);
    }
  };

  const getColumnAlign = (column) => {
    if (column.align) return column.align;
    const sample = data.find((row) => row?.[column.key] !== null && row?.[column.key] !== undefined)?.[column.key];
    return typeof sample === 'number' ? 'right' : 'left';
  };

  return (
    <div className="dome-table-container">
      <div className="dome-table-wrapper">
        <table className="dome-table">
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  className={`${col.className || ''}`}
                  style={{ textAlign: getColumnAlign(col), width: col.width, cursor: col.key ? 'pointer' : 'default', userSelect: 'none' }}
                  onClick={() => col.key && requestSort(col.key)}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: getColumnAlign(col) === 'right' ? 'flex-end' : getColumnAlign(col) === 'center' ? 'center' : 'flex-start',
                    gap: '4px'
                  }}>
                    {col.header}
                    {col.key && (
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        {sortConfig?.key === col.key ? (
                          sortConfig.direction === 'ascending' ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />
                        ) : (
                          <IconSelector size={16} style={{ opacity: 0.3 }} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {showActions && <th className="dome-table-actions-header">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (showActions ? 1 : 0)} className="dome-table-empty">
                  <div className="table-loader-spinner"></div>
                  Loading data...
                </td>
              </tr>
            ) : sortedData.length > 0 ? (
              sortedData.map((rowItem, rowIndex) => (
                <tr 
                  key={rowIndex}
                  className={onRowClick ? 'dome-table-row--clickable' : ''}
                  onClick={(e) => {
                    if (e.target.closest('.dome-table-actions')) return;
                    if (onRowClick) onRowClick(rowItem, rowIndex);
                  }}
                >
                  {columns.map((col, colIndex) => (
                    <td
                      key={colIndex}
                      className={col.className}
                      style={{ textAlign: getColumnAlign(col), width: col.width }}
                    >
                      {col.render ? col.render(rowItem) : rowItem[col.key]}
                    </td>
                  ))}
                  {showActions && (
                    <td className="dome-table-actions">
                      <button 
                        className="dome-table-action-btn dome-table-action-btn--info"
                        onClick={() => handleAction('info', rowItem)}
                        title="Info"
                      >
                        <IconInfoCircle size={16} stroke={2} />
                      </button>
                      <button 
                        className="dome-table-action-btn dome-table-action-btn--list"
                        onClick={() => handleAction('list', rowItem)}
                        title="List"
                      >
                        <IconListDetails size={16} stroke={2} />
                      </button>
                      <button 
                        className="dome-table-action-btn dome-table-action-btn--check"
                        onClick={() => handleAction('check', rowItem)}
                        title="Check"
                      >
                        <IconCheck size={16} stroke={2} />
                      </button>
                      <button 
                        className="dome-table-action-btn dome-table-action-btn--delete"
                        onClick={() => handleAction('delete', rowItem)}
                        title="Delete"
                      >
                        <IconTrash size={16} stroke={2} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + (showActions ? 1 : 0)} className="dome-table-empty">
                  No data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalEntries}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onItemsPerPageChange}
        />
      )}
    </div>
  );
};

export default Table;
