import React from "react";
import Table from "../../global-components/Table/Table";

const formatDisplayDate = (value) => {
  if (!value) return "";
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return String(value).replace(/T.*$/, "");
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  return `${Number(match[3])} ${months[Number(match[2]) - 1]} ${match[1]}`;
};

const qty = (value) => Number(value || 0).toLocaleString();

const ProductionOrderDetail = ({ detail, error, onClose }) => {
  if (!detail && !error) return null;

  const order = detail?.order || {};

  return (
    <div className="overview-detail-backdrop" onClick={onClose} role="presentation">
      <div className="overview-detail-panel" onClick={(event) => event.stopPropagation()} role="dialog" aria-label="Production order detail">
        <div className="card-header overview-table-header">
          <span>Production order {order.ProductionOrderNo || ""}</span>
          <button type="button" className="cost-comp-remove" onClick={onClose}>Close</button>
        </div>
        {error && <p className="overview-analytics-note">{error}</p>}
        {detail && (
          <>
            <div className="overview-detail-meta">
              <p><strong>Product</strong> {order.ItemCode} {order.ProductName}</p>
              <p><strong>Status</strong> {order.StatusName}</p>
              <p><strong>Warehouse</strong> {order.WarehouseName || order.WarehouseCode}</p>
              <p><strong>Planned</strong> {qty(order.PlannedQty)}</p>
              <p><strong>Completed</strong> {qty(order.CompletedQty)} ({order.CompletionPct == null ? "n/a" : `${order.CompletionPct}%`})</p>
              <p><strong>Remaining</strong> {qty(order.RemainingQty)}</p>
              <p><strong>Rejected</strong> {qty(order.RejectedQty)}</p>
              <p><strong>Start</strong> {formatDisplayDate(order.StartDate)}</p>
              <p><strong>Due</strong> {formatDisplayDate(order.DueDate)}</p>
              <p><strong>Close</strong> {formatDisplayDate(order.CloseDate) || "Open"}</p>
              <p><strong>Age</strong> {qty(order.OrderAgeDays)} days</p>
              <p><strong>Days overdue</strong> {qty(order.DaysOverdue)}</p>
            </div>

            <div className="card-header">Components</div>
            <Table
              data={detail.components || []}
              columns={[
                { header: "Item", key: "ItemCode" },
                { header: "Name", key: "ItemName" },
                { header: "Warehouse", key: "WarehouseCode" },
                { header: "Required", key: "RequiredQty", align: "right" },
                { header: "Issued", key: "IssuedQty", align: "right" },
                { header: "Remaining", key: "RemainingQty", align: "right" },
                { header: "On Hand", key: "OnHandQty", align: "right" },
              ]}
              totalEntries={(detail.components || []).length}
              showActions={false}
              showPagination={false}
            />

            <div className="card-header">Material issues</div>
            <Table
              data={detail.issues || []}
              columns={[
                { header: "Issue No", key: "IssueNo" },
                { header: "Item", key: "ItemCode" },
                { header: "Name", key: "ItemName" },
                { header: "Qty", key: "IssuedQty", align: "right" },
                { header: "Date", key: "PostingDate", render: (row) => formatDisplayDate(row.PostingDate) },
                { header: "Warehouse", key: "WarehouseCode" },
              ]}
              totalEntries={(detail.issues || []).length}
              showActions={false}
              showPagination={false}
            />

            <div className="card-header">Finished goods receipts</div>
            <Table
              data={detail.receipts || []}
              columns={[
                { header: "Receipt No", key: "ReceiptNo" },
                { header: "Item", key: "ItemCode" },
                { header: "Name", key: "ItemName" },
                { header: "Qty", key: "ReceivedQty", align: "right" },
                { header: "Date", key: "PostingDate", render: (row) => formatDisplayDate(row.PostingDate) },
                { header: "Warehouse", key: "WarehouseCode" },
              ]}
              totalEntries={(detail.receipts || []).length}
              showActions={false}
              showPagination={false}
            />

            <div className="card-header">Linked samples</div>
            <p className="overview-analytics-note">Shown when a Receipt From Production sample points at this order or its goods receipt. Other document types are not linked here.</p>
            <Table
              data={detail.samples || []}
              columns={[
                { header: "Sampling No", key: "SamplingNo" },
                { header: "Date", key: "SamplingDate", render: (row) => formatDisplayDate(row.SamplingDate) },
                { header: "Item", key: "ItemCode" },
                { header: "Batch", key: "Batch" },
                { header: "Qty", key: "SampleQty", align: "right" },
                { header: "Status", key: "StatusName" },
              ]}
              totalEntries={(detail.samples || []).length}
              showActions={false}
              showPagination={false}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ProductionOrderDetail;
