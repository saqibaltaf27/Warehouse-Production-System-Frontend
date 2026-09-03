
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from '@tabler/icons-react';
import './Pagination.css';

const PAGE_SIZES = [5, 10, 20, 50, 100];

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
}) => {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  if (totalItems <= 0) return null;

  const startEntry = (safeCurrentPage - 1) * pageSize + 1;
  const endEntry = Math.min(safeCurrentPage * pageSize, totalItems);

  const pageNumbers = Array.from(
    { length: Math.min(5, safeTotalPages) },
    (_, index) => Math.max(1, Math.min(safeTotalPages - 4, safeCurrentPage - 2)) + index,
  );

  const goToPage = (page) => {
    if (onPageChange) onPageChange(Math.min(Math.max(1, page), safeTotalPages));
  };

  const handlePageSizeChange = (event) => {
    if (onPageSizeChange) onPageSizeChange(Number(event.target.value));
    goToPage(1);
  };

  return (
    <footer className="global-pagination" aria-label="Pagination">
      <div className="global-pagination-summary">
        <span>Showing</span>
        <strong>{startEntry}-{endEntry}</strong>
        <span>of {totalItems.toLocaleString()} entries</span>
      </div>

      <div className="global-pagination-controls">
        <div className="global-pagination-pages" aria-label="Page navigation">
          <button type="button" onClick={() => goToPage(1)} disabled={safeCurrentPage === 1} aria-label="First page">
            <IconChevronsLeft size={16} />
          </button>
          <button type="button" onClick={() => goToPage(safeCurrentPage - 1)} disabled={safeCurrentPage === 1} aria-label="Previous page">
            <IconChevronLeft size={16} />
          </button>
          {pageNumbers.map((page) => (
            <button
              type="button"
              key={page}
              className={safeCurrentPage === page ? 'is-active' : ''}
              onClick={() => goToPage(page)}
              aria-current={safeCurrentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          ))}
          <button type="button" onClick={() => goToPage(safeCurrentPage + 1)} disabled={safeCurrentPage === safeTotalPages} aria-label="Next page">
            <IconChevronRight size={16} />
          </button>
          <button type="button" onClick={() => goToPage(safeTotalPages)} disabled={safeCurrentPage === safeTotalPages} aria-label="Last page">
            <IconChevronsRight size={16} />
          </button>
        </div>

        <label className="global-pagination-size">
          <span>Rows</span>
          <select value={pageSize} onChange={handlePageSizeChange} aria-label="Rows per page">
            {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
      </div>
    </footer>
  );
};

export default Pagination;
