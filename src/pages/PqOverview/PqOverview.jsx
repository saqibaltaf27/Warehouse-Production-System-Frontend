import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Button from "../../global-components/Button/Button";
import { axiosInstance } from "../../apis/axiosinstance";
import { API_ENDPOINTS } from "../../apis/endpoints";
import { formatDisplayDate } from "../../util/text/datetimeformat";
import "./PqOverview.css";

const STATUS_COLORS = {
  Planned: "#F59E0B",
  "In Progress": "#1B47DB",
  Completed: "#14804A",
  Delayed: "#E11D48",
  Passed: "#14804A",
  Failed: "#E11D48",
  Pending: "#F59E0B",
  A: "#14804A",
  CA: "#0F9F6E",
  UI: "#D97706",
  S: "#1B47DB",
  PR: "#6366F1",
  R: "#E11D48",
  CR: "#BE123C",
};

const QA_LABELS = {
  A: "Approved",
  CA: "Conditionally approved",
  S: "Sampled",
  UI: "Under inspection",
  PR: "Pending review",
  R: "Rejected",
  CR: "Conditionally rejected",
  Pending: "Pending",
};

const monthBounds = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const iso = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return { startDate: iso(start), endDate: iso(end) };
};

const qty = (value) => Number(value || 0).toLocaleString();

const Kpi = ({ label, value, note, tone }) => (
  <article className={`pq-kpi pq-kpi-${tone || "slate"}`}>
    <span className="pq-kpi-label">{label}</span>
    <strong className="pq-kpi-value">{value}</strong>
    {note && <span className="pq-kpi-note">{note}</span>}
  </article>
);

const EmptyChart = ({ text }) => <p className="pq-empty">{text}</p>;

const PqOverview = () => {
  const defaults = useMemo(() => monthBounds(), []);
  const [draft, setDraft] = useState(defaults);
  const [applied, setApplied] = useState(defaults);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (range) => {
    setLoading(true);
    setError("");
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.DASHBOARD.PQ_OVERVIEW, {
        params: range,
        skipGlobalLoading: true,
      });
      setData(response.data?.data || null);
    } catch (err) {
      setData(null);
      setError(err.response?.data?.message || "Could not load the overview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(applied);
  }, [applied]);

  const production = data?.production || {};
  const qa = data?.qa || {};
  const qc = data?.qc || {};
  const materials = data?.materials || {};
  const alerts = data?.alerts || {};
  const statusChart = (production.statusChart || []).filter((item) => item.value > 0);
  const qaBreakdown = (qa.breakdown || []).map((item) => ({
    ...item,
    label: QA_LABELS[item.name] || item.name,
  }));
  const qcChart = (qc.resultChart || []).filter((item) => item.value > 0);

  return (
    <section className="pq-overview">
      <header className="pq-overview-head">
        <div>
          <h2>Production, QA &amp; QC Overview</h2>
          <p>LDS_LIVE management summary for the selected posting period.</p>
        </div>
        <span className="pq-refreshed">
          {data?.refreshedAt ? `Last refresh ${formatDisplayDate(data.refreshedAt)} ${String(data.refreshedAt).slice(11, 16)}` : "Not refreshed"}
        </span>
      </header>

      <div className="pq-filters">
        <label>
          Start Date
          <input type="date" value={draft.startDate} onChange={(event) => setDraft((current) => ({ ...current, startDate: event.target.value }))} />
        </label>
        <label>
          End Date
          <input type="date" value={draft.endDate} onChange={(event) => setDraft((current) => ({ ...current, endDate: event.target.value }))} />
        </label>
        <Button type="button" variant="primary" size="sm" onClick={() => setApplied(draft)}>Apply Filters</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => { setDraft(defaults); setApplied(defaults); }}>Reset</Button>
      </div>

      {error && <p className="pq-error">{error}</p>}
      {loading && <p className="pq-empty">Loading overview...</p>}

      {!loading && data && (
        <>
          <section className="pq-section">
            <h3>Production Overview</h3>
            <div className="pq-kpi-grid">
              <Kpi label="Total Production Orders" value={qty(production.totalOrders)} note="Excludes cancelled" />
              <Kpi label="Planned" value={qty(production.plannedOrders)} note="Status P" tone="amber" />
              <Kpi label="Released / In Progress" value={qty(production.releasedOrders)} note="Status R" tone="blue" />
              <Kpi label="Completed" value={qty(production.completedOrders)} note="Status L" tone="green" />
              <Kpi label="Delayed" value={qty(production.delayedOrders)} note="Open and past due" tone="rose" />
              <Kpi label="Planned vs Actual" value={`${production.plannedVsActualPct || 0}%`} note={`${qty(production.actualQty)} of ${qty(production.plannedQty)}`} tone="mint" />
            </div>
            <div className="pq-chart-row">
              <article className="pq-chart-card">
                <h4>Planned vs Actual Production</h4>
                {(production.planActualChart || []).every((item) => !item.value) ? <EmptyChart text="No production quantity in this range" /> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={production.planActualChart}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        <Cell fill="#1B47DB" />
                        <Cell fill="#14804A" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </article>
              <article className="pq-chart-card">
                <h4>Production Order Status</h4>
                {statusChart.length === 0 ? <EmptyChart text="No production orders in this range" /> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={statusChart} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78}>
                        {statusChart.map((item) => (
                          <Cell key={item.name} fill={STATUS_COLORS[item.name] || "#64748B"} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </article>
            </div>
          </section>

          <section className="pq-section">
            <h3>Quality Assurance Overview</h3>
            <div className="pq-kpi-grid">
              <Kpi label="Total Batches for QA Review" value={qty(qa.totalBatches)} />
              <Kpi label="QA Approved Batches" value={qty(qa.approvedBatches)} tone="green" />
              <Kpi label="Pending QA Approvals" value={qty(qa.pendingBatches)} tone="amber" />
              <Kpi label="Batches on Hold" value={qty(qa.holdBatches)} note="Under inspection" tone="peach" />
              <Kpi label="Rejected Batches" value={qty(qa.rejectedBatches)} tone="rose" />
              <Kpi label="QA Approval Rate" value={`${qa.approvalRate || 0}%`} tone="mint" />
            </div>
            <article className="pq-chart-card">
              <h4>QA Status Breakdown</h4>
              {qaBreakdown.length === 0 ? <EmptyChart text="No QA samples in this range" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={qaBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {qaBreakdown.map((item) => (
                        <Cell key={item.name} fill={STATUS_COLORS[item.name] || "#64748B"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </article>
          </section>

          <section className="pq-section">
            <h3>Quality Control Overview</h3>
            <div className="pq-kpi-grid">
              <Kpi label="Total QC Inspections" value={qty(qc.totalInspections)} />
              <Kpi label="Passed Inspections" value={qty(qc.passedInspections)} tone="green" />
              <Kpi label="Failed Inspections" value={qty(qc.failedInspections)} tone="rose" />
              <Kpi label="Pending Inspections" value={qty(qc.pendingInspections)} tone="amber" />
              <Kpi label="QC Pass Rate" value={`${qc.passRate || 0}%`} tone="mint" />
              <Kpi label="Batches Awaiting QC Clearance" value={qty(qc.batchesAwaiting)} tone="peach" />
            </div>
            <article className="pq-chart-card">
              <h4>QC Pass vs Fail vs Pending</h4>
              {qcChart.length === 0 ? <EmptyChart text="No QC inspections in this range" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={qcChart} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78}>
                      {qcChart.map((item) => (
                        <Cell key={item.name} fill={STATUS_COLORS[item.name] || "#64748B"} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </article>
          </section>

          <section className="pq-section">
            <h3>Material and Purchase Order Overview</h3>
            <div className="pq-kpi-grid">
              <Kpi label="Open Purchase Orders" value={qty(materials.openPurchaseOrders)} note="OPOR documents" />
              <Kpi label="Pending Purchase Order Qty" value={qty(materials.pendingPoQty)} note="Open POR1 quantity" />
              <Kpi label="Raw Material Shortages" value={qty(materials.shortageOrders)} note={`${qty(materials.shortageLines)} component lines`} tone="rose" />
              <Kpi label="Material Availability" value={materials.availability || "Available"} note={`${qty(materials.coveredLines)} covered lines`} tone={materials.availability === "Constrained" ? "amber" : "green"} />
            </div>
          </section>

          <section className="pq-section">
            <h3>Production &amp; Quality Alerts</h3>
            <div className="pq-alert-grid">
              <article className={`pq-alert ${alerts.overdueProductionOrders ? "pq-alert-warn" : ""}`}>
                <span>Overdue Production Orders</span>
                <strong>{qty(alerts.overdueProductionOrders)}</strong>
              </article>
              <article className={`pq-alert ${alerts.materialShortages ? "pq-alert-warn" : ""}`}>
                <span>Material Shortages</span>
                <strong>{qty(alerts.materialShortages)}</strong>
              </article>
              <article className={`pq-alert ${alerts.qaApprovalsPending ? "pq-alert-warn" : ""}`}>
                <span>QA Approvals Pending</span>
                <strong>{qty(alerts.qaApprovalsPending)}</strong>
              </article>
              <article className={`pq-alert ${alerts.qcInspectionsPending ? "pq-alert-warn" : ""}`}>
                <span>QC Inspections Pending</span>
                <strong>{qty(alerts.qcInspectionsPending)}</strong>
              </article>
              <article className={`pq-alert ${alerts.rejectedOrHeldBatches ? "pq-alert-danger" : ""}`}>
                <span>Rejected or Held Batches</span>
                <strong>{qty(alerts.rejectedOrHeldBatches)}</strong>
              </article>
            </div>
          </section>

          {data.notes?.length > 0 && (
            <ul className="pq-notes">
              {data.notes.map((note) => <li key={note}>{note}</li>)}
            </ul>
          )}
        </>
      )}
    </section>
  );
};

export default PqOverview;
