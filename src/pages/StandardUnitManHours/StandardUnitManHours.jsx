import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { IconPlus } from '@tabler/icons-react';
import Button from '../../global-components/Button/Button';
import Table from '../../global-components/Table/Table';
import { standardUnitApi } from '../../apis/Cost Overview/standard-unit';
import '../ProductionOrders/SalesOrderModal.css';
import './StandardUnitManHours.css';

const emptyForm = { itemCode: '', itemDescription: '', manHour: '' };

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
    setForm(emptyForm);
    setShowAdd(true);
  };

  const closeAdd = () => {
    if (saving) return;
    setShowAdd(false);
    setForm(emptyForm);
  };

  const handleItemChange = (selected) => {
    setForm((prev) => ({
      ...prev,
      itemCode: selected?.value || '',
      itemDescription: selected?.description || '',
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!form.itemCode) {
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
      const res = await standardUnitApi.create({
        itemName: form.itemCode,
        manHour,
      });
      if (res?.success) {
        toast.success(res.message || 'Standard unit saved');
        closeAdd();
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
  ];

  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, currentPage, pageSize]);

  return (
    <div className="sumh-page layout-page-padding">
      <div className="sumh-header">
        <Button variant="primary" icon={<IconPlus size={16} />} onClick={openAdd}>
          Add Standard Unit / Man Hours
        </Button>
      </div>

      <div className="sumh-table-wrap">
        <Table
          data={pagedRows}
          columns={columns}
          totalEntries={rows.length}
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
                <h3>Add Standard Unit / Man Hours</h3>
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
                        value={
                          form.itemCode
                            ? itemOptions.find((o) => o.value === form.itemCode) || null
                            : null
                        }
                        onChange={handleItemChange}
                        placeholder={loadingItems ? 'Loading items…' : 'Search Item Code'}
                        isClearable
                        isSearchable
                        isDisabled={saving || loadingItems}
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
                            height: 24,
                            border: 'none',
                            boxShadow: 'none',
                            background: 'transparent',
                          }),
                          valueContainer: (base) => ({
                            ...base,
                            padding: 0,
                            height: 24,
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
                        value={form.itemDescription}
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
                    Save
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
