import { IconInfoCircle, IconListDetails, IconCheck, IconTrash } from '@tabler/icons-react';
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
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;

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
                  className={col.className}
                  style={{ textAlign: getColumnAlign(col), width: col.width }}
                >
                  {col.header}
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
            ) : data.length > 0 ? (
              data.map((rowItem, rowIndex) => (
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
