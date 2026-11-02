import React, { useState, useEffect, useMemo } from 'react';
import { IconPlus, IconSearch, IconEdit, IconTrash, IconFileSpreadsheet } from '@tabler/icons-react';
import CreatableSelect from 'react-select/creatable';
import Table from '../../global-components/Table/Table';
import Button from '../../global-components/Button/Button';
import GlobalPopup from '../../global-components/GlobalPopup/GlobalPopup';
import { axiosInstance } from '../../apis/axiosinstance';
import { API_ENDPOINTS } from '../../apis/endpoints';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import '../ProductionOrders/ProductionOrders.css';

const formatDisplayDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
};

const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

const RecordDataTab = () => {
  const [tableSearch, setTableSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [yearlySchedule, setYearlySchedule] = useState([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters state for modal
  const [filterOptions, setFilterOptions] = useState({ types: [], families: [] });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [modalData, setModalData] = useState({
    id: null,
    instrument_name: '',
    instrument_sn: '',
    date_of_installation: '',
    type: '',
    family: '',
    maintenanceDates: ['']
  });

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(tableSearch);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [tableSearch]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const tableParams = {
        year: yearFilter,
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch
      };
      const yearlyRes = await axiosInstance.get(API_ENDPOINTS.PREVENTIVE_MAINTENANCE.YEARLY_SCHEDULE, { params: tableParams });
      if (yearlyRes.data?.success) {
        setYearlySchedule(yearlyRes.data.data);
        setTotalEntries(yearlyRes.data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching dashboard data', err);
    }
    setLoading(false);
  };

  const fetchFilters = async () => {
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.PREVENTIVE_MAINTENANCE.FILTERS);
      if (res.data?.success) {
        setFilterOptions(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching PM filters:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [yearFilter, currentPage, pageSize, debouncedSearch]);

  useEffect(() => {
    fetchFilters();
  }, []);

  const activeMonths = useMemo(() => {
    const allMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return allMonths.filter(month => 
      yearlySchedule.some(row => row.schedule && row.schedule[month] && row.schedule[month].length > 0)
    );
  }, [yearlySchedule]);

  const handleOpenAdd = () => {
    setModalData({
      id: null,
      instrument_name: '',
      instrument_sn: '',
      date_of_installation: '',
      type: '',
      family: '',
      maintenanceDates: ['']
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (row) => {
    // Extract all maintenance dates from the schedule object
    const allDates = [];
    if (row.schedule) {
      Object.keys(row.schedule).forEach(month => {
        row.schedule[month].forEach(item => {
          allDates.push(formatDateForInput(item.date));
        });
      });
    }

    setModalData({
      id: row.id,
      instrument_name: row.instrument_name || '',
      instrument_sn: row.instrument_sn || '',
      date_of_installation: formatDateForInput(row.date_of_installation) || '',
      type: row.type || '',
      family: row.family || '',
      maintenanceDates: allDates.length > 0 ? allDates : ['']
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setModalData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (index, value) => {
    const newDates = [...modalData.maintenanceDates];
    newDates[index] = value;
    setModalData(prev => ({ ...prev, maintenanceDates: newDates }));
  };

  const addDateRow = () => {
    setModalData(prev => ({ ...prev, maintenanceDates: [...prev.maintenanceDates, ''] }));
  };

  const removeDateRow = (index) => {
    const newDates = modalData.maintenanceDates.filter((_, i) => i !== index);
    setModalData(prev => ({ ...prev, maintenanceDates: newDates }));
  };

  const handleSave = async () => {
    try {
      const payload = {
        instrument_name: modalData.instrument_name,
        instrument_sn: modalData.instrument_sn,
        date_of_installation: modalData.date_of_installation,
        type: modalData.type,
        family: modalData.family,
        maintenanceDates: modalData.maintenanceDates.filter(d => d.trim() !== '')
      };

      if (isEditing) {
        await axiosInstance.put(`${API_ENDPOINTS.PREVENTIVE_MAINTENANCE.INSTRUMENT_CRUD}/${modalData.id}`, payload);
      } else {
        await axiosInstance.post(API_ENDPOINTS.PREVENTIVE_MAINTENANCE.INSTRUMENT_CRUD, payload);
      }
      setIsModalOpen(false);
      toast.success('Data saved successfully');
      fetchDashboardData();
      fetchFilters(); // refresh filters in case a new type/family was added
    } catch (error) {
      console.error('Error saving instrument data', error);
      toast.error('Failed to save data');
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const res = await axiosInstance.get(API_ENDPOINTS.PREVENTIVE_MAINTENANCE.YEARLY_SCHEDULE, {
        params: {
          year: yearFilter,
          page: 1,
          limit: Math.max(totalEntries || 0, 1000),
          search: debouncedSearch,
        },
      });
      if (!res.data?.success) {
        toast.error(res.data?.message || 'Failed to export schedule');
        return;
      }
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const rows = (res.data.data || []).map((row) => {
        const mapped = {
          'Instrument Name': row.instrument_name ?? '',
          'Instrument S/N': row.instrument_sn ?? '',
          Type: row.type ?? '',
          Family: row.family ?? '',
          'Date of Installation': formatDisplayDate(row.date_of_installation),
        };
        months.forEach((month) => {
          const entries = row.schedule?.[month] || [];
          mapped[month] = entries.map((m) => formatDisplayDate(m.date)).join(', ');
        });
        return mapped;
      });
      if (!rows.length) {
        toast.error('No records to export');
        return;
      }
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `PM ${yearFilter}`);
      XLSX.writeFile(workbook, `Equipment_PM_${yearFilter}.xlsx`);
      toast.success(`Exported ${rows.length} record(s)`);
    } catch (err) {
      console.error('Export Excel failed:', err);
      toast.error(err?.response?.data?.message || err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const matrixColumns = [
    { header: 'Instrument Name', key: 'instrument_name', className: 'sticky-col font-medium' },
    { header: 'Instrument S/N', key: 'instrument_sn' },
    { header: 'Type', key: 'type' },
    { header: 'Family', key: 'family' },
    { header: 'Date of Installation', key: 'date_of_installation', render: (row) => formatDisplayDate(row.date_of_installation) },
    ...activeMonths.map(month => ({
      header: month.toUpperCase(),
      key: month,
      className: 'month-cell',
      render: (row) => {
        const hasSchedule = row.schedule && row.schedule[month] && row.schedule[month].length > 0;
        return hasSchedule ? (
          <div className="date-badges">
            {row.schedule[month].map((maint, i) => (
              <span key={i} className="date-badge" title={maint.status}>
                {formatDisplayDate(maint.date)}
              </span>
            ))}
          </div>
        ) : (
          <span className="empty-dash">-</span>
        );
      }
    })),
    {
      header: 'ACTIONS',
      key: 'actions',
      render: (row) => (
        <button 
          title="Edit"
          onClick={() => handleOpenEdit(row)}
          className="pm-action-edit-btn"
        >
          <IconEdit size={18} stroke={2} />
        </button>
      )
    }
  ];

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      padding: '2px',
      borderRadius: '6px',
      borderColor: state.isFocused ? '#3b82f6' : '#cbd5e1',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
      '&:hover': { borderColor: state.isFocused ? '#3b82f6' : '#cbd5e1' }
    }),
    menu: (base) => ({ ...base, zIndex: 9999 }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 })
  };

  return (
    <div className="tab-content-container">
      <div className="pm-tab-header">
        <h2 className="pm-tab-title">Annual Preventive Maintenance Schedule ({yearFilter})</h2>
        <button onClick={handleOpenAdd} className="pm-add-btn">
          <IconPlus size={16} />
          Add
        </button>
      </div>

      <div className="po-filter-toolbar-card" style={{ marginBottom: 16 }}>
        <div className="po-filter-toolbar-grid">
          <div className="po-filter-item po-filter-search-box">
            <label className="po-filter-label">Search</label>
            <div style={{ position: 'relative' }}>
              <IconSearch size={18} className="po-filter-search-icon" />
              <input
                type="text"
                placeholder="Search Instrument or S/N..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="po-filter-search-input"
              />
            </div>
          </div>
          <div className="po-filter-item">
            <label className="po-filter-label">Year</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(parseInt(e.target.value, 10))}
              className="po-filter-date-input"
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>
          <div className="po-filter-item">
            <label className="po-filter-label">&nbsp;</label>
            <Button
              type="button"
              variant="success"
              className="po-export-btn"
              onClick={handleExportExcel}
              disabled={exporting || loading}
              title="Export Excel"
              icon={<IconFileSpreadsheet size={16} />}
            >
              {exporting ? 'Exporting...' : 'Export Excel'}
            </Button>
          </div>
        </div>
      </div>

      <div className="pm-table-container">
        <Table 
          columns={matrixColumns}
          data={yearlySchedule}
          showActions={false}
          showPagination={true}
          totalEntries={totalEntries}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={(page) => setCurrentPage(page)}
          onItemsPerPageChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          isLoading={loading}
        />
      </div>

      {isModalOpen && (
        <GlobalPopup onClose={() => setIsModalOpen(false)} className="pm-modal">
          <div className="pm-modal-content">
            <h3 className="pm-modal-title">
              {isEditing ? 'Edit Instrument & PM Data' : 'Add Instrument & PM Data'}
            </h3>

            <section>
              <h4 className="pm-section-title">
                Instrument Details
              </h4>
              <div className="pm-form-grid">
                <div className="pm-form-group">
                  <label className="pm-label">Instrument Name <span className="pm-required">*</span></label>
                  <input className="pm-input" name="instrument_name" value={modalData.instrument_name} onChange={handleModalChange} placeholder="Enter name" />
                </div>
                <div className="pm-form-group">
                  <label className="pm-label">Serial Number</label>
                  <input className="pm-input" name="instrument_sn" value={modalData.instrument_sn} onChange={handleModalChange} placeholder="Enter S/N" />
                </div>
                <div className="pm-form-group">
                  <label className="pm-label">Installation Date</label>
                  <input type="date" className="pm-input" name="date_of_installation" value={modalData.date_of_installation} onChange={handleModalChange} />
                </div>
                <div className="pm-form-group">
                  <label className="pm-label">Type</label>
                  <CreatableSelect
                    isClearable
                    options={filterOptions.types?.map(t => ({ value: t, label: t })) || []}
                    value={modalData.type ? { value: modalData.type, label: modalData.type } : null}
                    onChange={(newValue) => setModalData(prev => ({ ...prev, type: newValue ? newValue.value : '' }))}
                    placeholder="Select or type new..."
                    styles={selectStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                </div>
                <div className="pm-form-group full-width">
                  <label className="pm-label">Family</label>
                  <CreatableSelect
                    isClearable
                    options={filterOptions.families?.map(f => ({ value: f, label: f })) || []}
                    value={modalData.family ? { value: modalData.family, label: modalData.family } : null}
                    onChange={(newValue) => setModalData(prev => ({ ...prev, family: newValue ? newValue.value : '' }))}
                    placeholder="Select or type new..."
                    styles={selectStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                </div>
              </div>
            </section>

            <section>
              <div className="pm-section-header">
                <h4 className="pm-section-title">
                  Maintenance Dates
                </h4>
                <button type="button" onClick={addDateRow} className="add-date-btn">
                  <IconPlus size={14} stroke={3} /> Add Date
                </button>
              </div>
              
              <div className="pm-dates-container custom-scrollbar">
                {modalData.maintenanceDates.map((d, idx) => (
                  <div key={idx} className="pm-date-row">
                    <input 
                      type="date" 
                      value={d} 
                      onChange={(e) => handleDateChange(idx, e.target.value)} 
                      className="pm-input pm-date-input"
                    />
                    <button type="button" onClick={() => removeDateRow(idx)} className="remove-date-btn">
                      <IconTrash size={18} stroke={2} />
                    </button>
                  </div>
                ))}
                {modalData.maintenanceDates.length === 0 && (
                  <div className="pm-dates-empty">
                    <p className="pm-empty-text">No maintenance dates scheduled.</p>
                  </div>
                )}
              </div>
            </section>

            <div className="pm-modal-footer">
              <button onClick={() => setIsModalOpen(false)} className="pm-btn-cancel">Cancel</button>
              <button onClick={handleSave} disabled={!modalData.instrument_name} className="pm-btn-save">Save Data</button>
            </div>
          </div>
        </GlobalPopup>
      )}
    </div>
  );
};

export default RecordDataTab;
