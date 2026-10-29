import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Table from "../../global-components/Table/Table";
import { IconRefresh } from "@tabler/icons-react";
import { ldsDxApi } from "../../apis/ldsDx/ldsDx";
import { formatDisplayDate } from "../../util/text/datetimeformat";
import "../ProductionOrders/ProductionOrders.css";
import "./LdsDxForecast.css";

const qty = (value) => Number(value || 0).toLocaleString();
const fiscalStartYear = (date = new Date()) => (date.getMonth() >= 6 ? date.getFullYear() : date.getFullYear() - 1);
const isoDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

function DataLoader({ label = "Loading sales data…" }) {
  return (
    <div className="lds-dx-chart">
      <div className="lds-dx-loading">
        <span className="lds-dx-spinner" />
        {label}
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="lds-dx-tooltip">
      <div className="lds-dx-tooltip-label">{label}</div>
      {payload.map((item) => (
        <div key={item.dataKey} className="lds-dx-tooltip-row">
          {item.name}: {qty(item.value)}
        </div>
      ))}
    </div>
  );
}

const LINE_COLORS = [
  "#1B47DB", "#0F766E", "#C2410C", "#7C3AED", "#BE185D", "#0369A1",
  "#4D7C0F", "#B45309", "#4338CA", "#0E7490", "#9F1239", "#365314",
];

const filterSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "38px",
    fontSize: "13px",
    borderRadius: "2px",
    borderColor: state.isFocused ? "var(--primary-blue)" : "#cbd5e1",
    boxShadow: "none",
    backgroundColor: "#ffffff",
    cursor: "text",
    "&:hover": {
      borderColor: state.isFocused ? "var(--primary-blue)" : "#94a3b8",
    },
  }),
  valueContainer: (base) => ({
    ...base,
    minHeight: "38px",
    padding: "0 8px",
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    position: "relative",
    overflow: "hidden",
  }),
  input: (base) => ({
    ...base,
    margin: "0",
    padding: "0",
    color: "#1e293b",
  }),
  indicatorsContainer: (base) => ({
    ...base,
    height: "38px",
  }),
  dropdownIndicator: (base) => ({
    ...base,
    padding: "4px 6px",
    color: "#64748b",
    "&:hover": {
      color: "#1e293b",
    },
  }),
  clearIndicator: (base) => ({
    ...base,
    padding: "4px",
    color: "#94a3b8",
    "&:hover": {
      color: "#ef4444",
    },
  }),
  menu: (base) => ({
    ...base,
    fontSize: "13px",
    borderRadius: "2px",
    zIndex: 9999,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
    border: "1px solid #e2e8f0",
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  option: (base, state) => ({
    ...base,
    fontSize: "13px",
    padding: "8px 12px",
    backgroundColor: state.isSelected ? "var(--primary-blue)" : state.isFocused ? "#f1f5f9" : "#ffffff",
    color: state.isSelected ? "#ffffff" : "#1e293b",
    cursor: "pointer",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }),
  placeholder: (base) => ({
    ...base,
    position: "absolute",
    left: 8,
    top: "50%",
    transform: "translateY(-50%)",
    margin: 0,
    color: "#94a3b8",
    fontSize: "13px",
    whiteSpace: "nowrap",
  }),
  multiValue: (base) => ({
    ...base,
    fontSize: "12px",
  }),
};

const LdsDxForecast = () => {
  const defaultFrom = `${fiscalStartYear()}-07-01`;
  const defaultTo = isoDate(new Date());
  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    ldsDxApi
      .getDashboard({ fromDate, toDate })
      .then((res) => {
        if (!cancelled) setDashboard(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.response?.data?.message || err.message || "Failed to load LDS Dx data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fromDate, toDate]);

  const customerOptions = (dashboard?.customers || []).map((item) => ({
    value: item.cardCode,
    label: `${item.cardCode} — ${item.cardName}`,
  }));
  const itemOptions = (dashboard?.items || []).map((item) => ({
    value: item.itemCode,
    label: `${item.itemCode} — ${item.itemName}`,
  }));

  const customerCodes = selectedCustomers.map((item) => item.value);
  const itemCodes = selectedItems.map((item) => item.value);

  const chartLines = useMemo(() => {
    if (customerCodes.length) {
      return customerCodes.map((code, index) => ({
        dataKey: `c:${code}`,
        name: selectedCustomers[index]?.label || code,
        color: LINE_COLORS[index % LINE_COLORS.length],
      }));
    }
    if (itemCodes.length) {
      return itemCodes.map((code, index) => ({
        dataKey: `i:${code}`,
        name: selectedItems[index]?.label || code,
        color: LINE_COLORS[index % LINE_COLORS.length],
      }));
    }
    return [{ dataKey: "totalQty", name: "All", color: "#1B47DB" }];
  }, [customerCodes, itemCodes, selectedCustomers, selectedItems]);

  const chartData = useMemo(() => {
    const slots = dashboard?.monthlyTrend || [];
    const points = dashboard?.salesPoints || [];
    return slots.map((slot) => {
      const matched = points.filter((point) => {
        if (point.periodKey !== slot.periodKey) return false;
        if (customerCodes.length && !customerCodes.includes(point.cardCode)) return false;
        if (itemCodes.length && !itemCodes.includes(point.itemCode)) return false;
        return true;
      });
      const row = {
        periodKey: slot.periodKey,
        monthName: slot.monthName,
        totalQty: matched.reduce((sum, point) => sum + Number(point.qty || 0), 0),
      };
      customerCodes.forEach((code) => {
        row[`c:${code}`] = matched
          .filter((point) => point.cardCode === code)
          .reduce((sum, point) => sum + Number(point.qty || 0), 0);
      });
      itemCodes.forEach((code) => {
        row[`i:${code}`] = matched
          .filter((point) => point.itemCode === code)
          .reduce((sum, point) => sum + Number(point.qty || 0), 0);
      });
      return row;
    });
  }, [dashboard, customerCodes, itemCodes]);

  const hasActiveFilters =
    fromDate !== defaultFrom ||
    toDate !== defaultTo ||
    selectedCustomers.length > 0 ||
    selectedItems.length > 0;

  function handleResetFilters() {
    setFromDate(defaultFrom);
    setToDate(defaultTo);
    setSelectedCustomers([]);
    setSelectedItems([]);
  }

  const orders = (dashboard?.orders || [])
    .filter((row) => {
      if (customerCodes.length && !customerCodes.includes(row.CardCode)) return false;
      if (itemCodes.length && !itemCodes.includes(row.ItemCode)) return false;
      return true;
    })
    .sort((a, b) => String(a.DeliveryDate || "").localeCompare(String(b.DeliveryDate || "")));

  return (
    <div className="lds-dx-page">
      <div className="po-filter-toolbar-card">
        <div className="po-filter-toolbar-grid">
          <div className="lds-dx-filter-left">
            <div className="po-filter-item po-filter-search-box">
              <label className="po-filter-label">Customer</label>
              <Select
                isMulti
                isClearable
                isSearchable
                placeholder="All customers"
                options={customerOptions}
                value={selectedCustomers}
                onChange={(value) => setSelectedCustomers(value || [])}
                menuPortalTarget={document.body}
                styles={filterSelectStyles}
              />
            </div>
            <div className="po-filter-item po-filter-search-box">
              <label className="po-filter-label">Item</label>
              <Select
                isMulti
                isClearable
                isSearchable
                placeholder="All items"
                options={itemOptions}
                value={selectedItems}
                onChange={(value) => setSelectedItems(value || [])}
                menuPortalTarget={document.body}
                styles={filterSelectStyles}
              />
            </div>
          </div>
          <div className="lds-dx-filter-right">
            <div className="po-filter-item">
              <label className="po-filter-label">From</label>
              <input
                type="date"
                className="po-filter-date-input"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="po-filter-item">
              <label className="po-filter-label">To</label>
              <input
                type="date"
                className="po-filter-date-input"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="po-filter-item">
              <label className="po-filter-label">&nbsp;</label>
              <button
                type="button"
                className="po-filter-reset-btn"
                onClick={handleResetFilters}
                disabled={!hasActiveFilters}
                title={hasActiveFilters ? "Reset all filters" : "No filters applied"}
              >
                <IconRefresh size={16} />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {error ? <p className="lds-dx-note">{error}</p> : null}

      <div className="lds-dx-card">
        <h3>Monthly sales quantity</h3>
        <p className="lds-dx-note">
          LDS Dx invoices and credit notes. Default is one total line. Select customers or items for individual lines.
          {dashboard?.range ? ` ${formatDisplayDate(dashboard.range.fromDate)} to ${formatDisplayDate(dashboard.range.toDate)}.` : ""}
        </p>
        {loading ? (
          <DataLoader />
        ) : (
        <div className="lds-dx-chart">
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="monthName" interval={0} />
              <YAxis />
              <Tooltip content={<ChartTooltip />} />
              {chartLines.map((line) => (
                <Line
                  key={line.dataKey}
                  type="monotone"
                  dataKey={line.dataKey}
                  name={line.name}
                  stroke={line.color}
                  dot={{ r: 3 }}
                  strokeWidth={2.5}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        )}
      </div>

      <div className="lds-dx-card">
        <h3>Open sales orders</h3>
        {loading ? (
          <DataLoader />
        ) : (
          <Table
            data={orders}
            totalEntries={orders.length}
            showActions={false}
            showPagination={orders.length > 20}
            columns={[
              { header: "SO", key: "SalesOrderNumber" },
              { header: "Customer", key: "CustomerName" },
              { header: "CardCode", key: "CardCode" },
              { header: "Item", key: "ItemCode" },
              { header: "Name", key: "ItemName" },
              { header: "Ordered", key: "OrderedQty", render: (row) => qty(row.OrderedQty) },
              { header: "On Hand", key: "OnHandQty", render: (row) => qty(row.OnHandQty) },
              { header: "Delivery", key: "DeliveryDate", render: (row) => formatDisplayDate(row.DeliveryDate) },
            ]}
          />
        )}
      </div>
    </div>
  );
};

export default LdsDxForecast;
