import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { IconPlus, IconEdit, IconSearch, IconRefresh } from '@tabler/icons-react';
import Button from '../../global-components/Button/Button';
import Table from '../../global-components/Table/Table';
import { standardUnitApi } from '../../apis/Cost Overview/standard-unit';
import '../ProductionOrders/SalesOrderModal.css';
import '../ProductionOrders/ProductionOrders.css';
import './StandardUnitManHours.css';

const emptyForm = { itemCodes: [], manHour: '' };

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const StandardUnitManHours = () => {
  const [rows, setRows] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await standardUnitApi.list();
      if (res?.success) {
        setRows(res.data || []);
      } else {
        toast.error(res?.message || 'Failed to load standards');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load standards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchItems = async () => {
      setLoadingItems(true);
      try {
        const res = await standardUnitApi.getItems();
        if (res?.success) {
          setItems(res.data || []);
        } else {
          toast.error(res?.message || 'Failed to load items');
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load items');
      } finally {
        setLoadingItems(false);
      }
    };
    fetchList();
    fetchItems();
  }, []);

  const itemOptions = useMemo(
    () =>
      items.map((item) => {
        const code = item.ItemCode || '';
        const name = item.ProdName || '';
        return {
          value: code,
          label: name ? `${code} — ${name}` : code,
          description: name,
        };
      }),
    [items],
  );

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowAdd(true);
  };

  const openEdit = (row) => {
    setEditingId(row.Id);
    setForm({
      itemCodes: [row.ItemName],
      manHour: row.ManHour ?? '',
    });
    setShowAdd(true);
  };

  const closeAdd = () => {
    if (saving) return;
    setShowAdd(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const selectedOptions = itemOptions.filter((option) => form.itemCodes.includes(option.value));

  const handleItemChange = (selected) => {
    const next = Array.isArray(selected) ? selected : selected ? [selected] : [];
    setForm((prev) => ({
      ...prev,
      itemCodes: next.map((option) => option.value),
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!form.itemCodes.length) {
      toast.error('Item name is required');
      return;
    }
    if (!form.manHour && form.manHour !== 0) {
      toast.error('Man hour is required');
      return;
    }
    const manHour = Number(form.manHour);
    if (Number.isNaN(manHour) || manHour < 0) {
      toast.error('Enter a valid man hour value');
      return;
    }

    setSaving(true);
    try {
      const res = editingId
        ? await standardUnitApi.update(editingId, { manHour })
        : await standardUnitApi.create({
            itemNames: form.itemCodes,
            manHour,
          });
      if (res?.success) {
        toast.success(res.message || 'Standard unit saved');
        setShowAdd(false);
        setEditingId(null);
        setForm(emptyForm);
        setCurrentPage(1);
        fetchList();
      } else {
        toast.error(res?.message || 'Save failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'ItemName', header: 'Item Name' },
    {
      key: 'ItemDescription',
      header: 'Item Description',
      render: (row) => row.ItemDescription || '—',
    },
    {
      key: 'ManHour',
      header: 'Man Hour',
      width: '120px',
      render: (row) => row.ManHour,
    },
    {
      key: 'CreatedByName',
      header: 'Created By',
      width: '140px',
      render: (row) => row.CreatedByName || row.CreatedBy || '—',
    },
    {
      key: 'CreatedAt',
      header: 'Created At',
      width: '130px',
      render: (row) => formatDate(row.CreatedAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '80px',
      render: (row) => (
        <button
          type="button"
          className="dome-table-action-btn dome-table-action-btn--info"
          title="Edit"
          onClick={(event) => {
            event.stopPropagation();
            openEdit(row);
          }}
        >
          <IconEdit size={16} stroke={2} />
        </button>
      ),
    },
  ];

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      [row.ItemName, row.ItemDescription, row.ManHour, row.CreatedByName]
        .filter((value) => value !== undefined && value !== null)
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [rows, searchQuery]);

  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  return (
    <div className="sumh-page layout-page-padding">
      <div className="sumh-header">
        <Button variant="primary" icon={<IconPlus size={16} />} onClick={openAdd}>
          Add Standard Unit / Man Hours
        </Button>
      </div>

      <div className="po-filter-toolbar-card">
        <div className="po-filter-toolbar-grid">
          <div className="po-filter-item po-filter-search-box">
            <label className="po-filter-label">Search</label>
            <div style={{ position: 'relative' }}>
              <IconSearch size={18} className="po-filter-search-icon" />
              <input
                type="text"
                placeholder="Item, description, man hour..."
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setCurrentPage(1);
                }}
                className="po-filter-search-input"
              />
            </div>
          </div>
          <div className="po-filter-item">
            <label className="po-filter-label">&nbsp;</label>
            <button
              type="button"
              className="po-filter-reset-btn"
              disabled={!searchQuery}
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
            >
              <IconRefresh size={16} />
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="sumh-table-wrap">
        <Table
          data={pagedRows}
          columns={columns}
          totalEntries={filteredRows.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          isLoading={loading}
          showActions={false}
          showPagination={true}
        />
      </div>

      {showAdd &&
        createPortal(
          <div className="so-modal-overlay" onMouseDown={closeAdd}>
            <div
              className="so-modal-content sumh-modal"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="so-modal-header">
                <h3>{editingId ? 'Edit Standard Unit / Man Hours' : 'Add Standard Unit / Man Hours'}</h3>
                <button type="button" className="so-modal-close" onClick={closeAdd} disabled={saving}>
                  &times;
                </button>
              </div>

              <form className="so-modal-body sumh-modal-body" onSubmit={handleSave}>
                <div className="po-header-details sumh-form-grid">
                  <div className="po-detail-item sumh-full-row">
                    <strong>Item Name:</strong>
                    <span className="sumh-select-span">
                      <Select
                        options={itemOptions}
                        isMulti={!editingId}
                        closeMenuOnSelect={Boolean(editingId)}
                        hideSelectedOptions={false}
                        value={editingId ? (selectedOptions[0] || null) : selectedOptions}
                        onChange={handleItemChange}
                        placeholder={loadingItems ? 'Loading items…' : 'Search Item Code'}
                        isClearable
                        isSearchable
                        isDisabled={saving || loadingItems || Boolean(editingId)}
                        formatOptionLabel={(option, { context }) => {
                          if (editingId || context === 'value') return option.label;
                          const checked = form.itemCodes.includes(option.value);
                          return (
                            <span className="sumh-option">
                              <input type="checkbox" checked={checked} readOnly />
                              <span>{option.label}</span>
                            </span>
                          );
                        }}
                        filterOption={(option, input) => {
                          const q = String(input || '').toLowerCase();
                          if (!q) return true;
                          const label = String(option.label || '').toLowerCase();
                          const value = String(option.value || '').toLowerCase();
                          const desc = String(option.data?.description || '').toLowerCase();
                          return label.includes(q) || value.includes(q) || desc.includes(q);
                        }}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        components={{ IndicatorSeparator: () => null }}
                        styles={{
                          container: (base) => ({ ...base, width: '100%' }),
                          control: (base) => ({
                            ...base,
                            minHeight: 24,
                            height: editingId ? 24 : 'auto',
                            border: 'none',
                            boxShadow: 'none',
                            background: 'transparent',
                          }),
                          valueContainer: (base) => ({
                            ...base,
                            padding: 0,
                            height: editingId ? 24 : 'auto',
                          }),
                          multiValue: (base) => ({
                            ...base,
                            fontSize: 12,
                          }),
                          input: (base) => ({
                            ...base,
                            margin: 0,
                            padding: 0,
                            fontSize: 13,
                          }),
                          singleValue: (base) => ({
                            ...base,
                            fontSize: 13,
                            margin: 0,
                          }),
                          placeholder: (base) => ({
                            ...base,
                            fontSize: 13,
                            margin: 0,
                          }),
                          indicatorsContainer: (base) => ({
                            ...base,
                            padding: 0,
                            height: 24,
                          }),
                          clearIndicator: (base) => ({
                            ...base,
                            padding: 2,
                          }),
                          dropdownIndicator: (base) => ({
                            ...base,
                            padding: 2,
                          }),
                          menuPortal: (base) => ({ ...base, zIndex: 10001 }),
                        }}
                      />
                    </span>
                  </div>

                  <div className="po-detail-item sumh-full-row">
                    <strong>Item Description:</strong>
                    <span>
                      <input
                        type="text"
                        className="sumh-detail-input"
                        value={selectedOptions.map((option) => option.description || option.value).filter(Boolean).join(', ')}
                        readOnly
                        placeholder="Auto-filled from ProdName"
                      />
                    </span>
                  </div>

                  <div className="po-detail-item sumh-full-row">
                    <strong>Man Hour:</strong>
                    <span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className="sumh-detail-input"
                        value={form.manHour}
                        onChange={(e) => setForm((prev) => ({ ...prev, manHour: e.target.value }))}
                        placeholder="Enter man hour"
                        disabled={saving}
                        required
                      />
                    </span>
                  </div>
                </div>

                <div className="sumh-modal-actions">
                  <Button type="button" variant="outline" onClick={closeAdd} disabled={saving}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={saving} isLoading={saving}>
                    {editingId ? 'Update' : 'Save'}
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default StandardUnitManHours;
