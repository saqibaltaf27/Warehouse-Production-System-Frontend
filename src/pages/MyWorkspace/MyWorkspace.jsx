import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { IconBell, IconCake, IconWorld } from "@tabler/icons-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Skeleton from "../../global-components/Skeleton/Skeleton";
import Table from "../../global-components/Table/Table";
import GlobalPopup from "../../global-components/GlobalPopup/GlobalPopup";
import { axiosInstance } from "../../apis/axiosinstance";
import { API_ENDPOINTS } from "../../apis/endpoints";
import "./MyWorkspace.css";

const DASHBOARD_URL = "https://dome-backend.gms-world.com/api/home/dashboard";
const NOTICE_URL = "https://dome-backend.gms-world.com/api/home/admin/notices";

const STATUS_COLORS = { Planned: "#F59E0B", Released: "#1B47DB" };
const WAREHOUSE_COLORS = ["#1B47DB", "#6997E4", "#10B981", "#F59E0B", "#B26552", "#94B5E3"];

const toNumber = (value) => Number(value) || 0;

const MyWorkspace = () => {
  const [banners, setBanners] = useState([]);
  const [notices, setNotices] = useState([]);
  const [activeBanner, setActiveBanner] = useState(0);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderSearch, setOrderSearch] = useState("");
  const [debouncedOrderSearch, setDebouncedOrderSearch] = useState("");
  const [workingDate, setWorkingDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [workingPlans, setWorkingPlans] = useState([]);
  const [workingLoading, setWorkingLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [dashboardResult, noticesResult] = await Promise.allSettled([
          axios.get(DASHBOARD_URL),
          axios.get(NOTICE_URL),
        ]);
        const data = dashboardResult.status === "fulfilled" ? dashboardResult.value.data?.data || {} : {};
        const noticeRows = noticesResult.status === "fulfilled" && Array.isArray(noticesResult.value.data?.data)
          ? noticesResult.value.data.data
          : [];
        setBanners(Array.isArray(data.banners) ? data.banners : []);

        const board = [];
        (data.birthdays || []).forEach((person) => {
          const name = `${person.FirstName || ""} ${person.LastName || ""}`.trim();
          board.push({
            id: `birthday-${person.EmpID}`,
            title: `Happy Birthday, ${name}`,
            detail: [person.DesignationName, person.DepartmentName].filter(Boolean).join(" · "),
            tone: "info",
            kind: "birthday",
          });
        });
        (data.anniversaries || []).forEach((person) => {
          const name = `${person.FirstName || ""} ${person.LastName || ""}`.trim();
          board.push({
            id: `anniversary-${person.EmpID}`,
            title: `Work anniversary, ${name}`,
            detail: [person.DesignationName, person.DepartmentName].filter(Boolean).join(" · "),
            tone: "info",
            kind: "anniversary",
          });
        });
        noticeRows.forEach((notice) => {
          const description = notice.Description || "";
          const link = description.match(/https?:\/\/\S+/)?.[0] || "";
          board.push({
            id: `notice-${notice.NoticeID}`,
            title: notice.Title || "Notice",
            detail: description.replace(link, "").replace(/:\s*$/, "").trim(),
            link,
            tone: "alert",
            kind: "notice",
          });
        });
        setNotices(board);
      } catch (error) {
        console.error("Workspace dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedOrderSearch(orderSearch.trim()), 400);
    return () => clearTimeout(timer);
  }, [orderSearch]);

  useEffect(() => {
    let cancelled = false;
    const loadOrders = async () => {
      setOrdersLoading(true);
      try {
        const response = await axiosInstance.get(API_ENDPOINTS.PRODUCTION_PLANNING.PLANNED_RELEASED_ORDERS, {
          params: { search: debouncedOrderSearch },
        });
        if (!cancelled) setOrders(response.data?.data || []);
      } catch (error) {
        console.error("Planned and released orders error:", error);
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    };
    loadOrders();
    return () => {
      cancelled = true;
    };
  }, [debouncedOrderSearch]);

  useEffect(() => {
    let cancelled = false;
    const loadWorkingPlans = async () => {
      setWorkingLoading(true);
      try {
        const response = await axiosInstance.get(API_ENDPOINTS.PRODUCTION_PLANNING.TODAY_WORKING_PLANS, {
          params: { date: workingDate },
        });
        if (!cancelled) setWorkingPlans(response.data?.data || []);
      } catch (error) {
        console.error("Today working plans error:", error);
      } finally {
        if (!cancelled) setWorkingLoading(false);
      }
    };
    loadWorkingPlans();
    return () => {
      cancelled = true;
    };
  }, [workingDate]);

  const overview = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const summary = {
      total: orders.length,
      planned: 0,
      released: 0,
      overdue: 0,
      plannedQty: 0,
      completedQty: 0,
      pendingQty: 0,
    };
    const warehouses = {};
    const dueBuckets = { Overdue: 0, "Due in 7 days": 0, "Due in 30 days": 0, Later: 0 };

    orders.forEach((order) => {
      if (order.ProductionOrderStatus === "Planned") summary.planned += 1;
      if (order.ProductionOrderStatus === "Released") summary.released += 1;
      summary.plannedQty += toNumber(order.PlannedQuantity);
      summary.completedQty += toNumber(order.CompletedQuantity);
      summary.pendingQty += toNumber(order.PendingQuantity);

      const warehouseLabel = order.WarehouseName || order.Warehouse || "Unknown";
      warehouses[warehouseLabel] = (warehouses[warehouseLabel] || 0) + 1;

      if (order.DueDate) {
        const due = new Date(order.DueDate);
        due.setHours(0, 0, 0, 0);
        const days = Math.round((due - today) / 86400000);
        if (days < 0) {
          summary.overdue += 1;
          dueBuckets.Overdue += 1;
        } else if (days <= 7) {
          dueBuckets["Due in 7 days"] += 1;
        } else if (days <= 30) {
          dueBuckets["Due in 30 days"] += 1;
        } else {
          dueBuckets.Later += 1;
        }
      }
    });

    const statusData = [
      { name: "Planned", value: summary.planned, color: STATUS_COLORS.Planned },
      { name: "Released", value: summary.released, color: STATUS_COLORS.Released },
    ].filter((item) => item.value > 0);

    const warehouseData = Object.entries(warehouses)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const dueData = Object.entries(dueBuckets).map(([name, value]) => ({ name, value }));

    const topPending = [...orders]
      .sort((a, b) => toNumber(b.PendingQuantity) - toNumber(a.PendingQuantity))
      .slice(0, 5)
      .map((order) => ({
        name: `PO ${order.ProductionOrderNo}`,
        product: order.ProductName,
        value: toNumber(order.PendingQuantity),
      }));

    return { summary, statusData, warehouseData, dueData, topPending };
  }, [orders]);

  const workingOverview = useMemo(() => {
    const summary = { plans: 0, pos: new Set(), lines: new Set(), staff: 0, supervisors: new Set() };
    const lines = {};
    const shifts = {};

    workingPlans.forEach((plan) => {
      summary.plans += 1;
      if (plan.PO) summary.pos.add(String(plan.PO));
      if (plan.Line) summary.lines.add(plan.Line);
      if (plan.Supervisor) summary.supervisors.add(plan.Supervisor);

      const staff = plan.staff || [];
      summary.staff += staff.length;

      const lineLabel = plan.Line || "No line";
      lines[lineLabel] = (lines[lineLabel] || 0) + staff.length;

      const shiftLabel = plan.Shift || "No shift";
      shifts[shiftLabel] = (shifts[shiftLabel] || 0) + 1;
    });

    const lineData = Object.entries(lines)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const shiftData = Object.entries(shifts).map(([name, value], index) => ({
      name,
      value,
      color: WAREHOUSE_COLORS[index % WAREHOUSE_COLORS.length],
    }));

    return {
      summary: {
        plans: summary.plans,
        pos: summary.pos.size,
        lines: summary.lines.size,
        staff: summary.staff,
        supervisors: summary.supervisors.size,
      },
      lineData,
      shiftData,
    };
  }, [workingPlans]);

  const fmtQty = (value) => (value == null || value === "" ? "-" : Number(value).toLocaleString());
  const workingColumns = [
    { header: "PO", key: "PO" },
    { header: "Product Name", key: "ProductName", render: (row) => row.ProductName || "-" },
    { header: "Line", key: "Line" },
    { header: "Shift", key: "Shift", render: (row) => row.Shift || "-" },
    { header: "Supervisor", key: "Supervisor", render: (row) => row.Supervisor || "-" },
    { header: "Staff", key: "staff", align: "right", render: (row) => fmtQty((row.staff || []).length) },
  ];

  const staffColumns = [
    { header: "Name", key: "Name", render: (row) => row.Name || `Staff ${row.StaffID}` },
    { header: "J.D", key: "jd", render: (row) => row.jd || "-" },
    { header: "Hours", key: "hours", render: (row) => row.hours || "-" },
  ];

  const banner = banners[activeBanner];

  useEffect(() => {
    if (banners.length < 2) return undefined;
    const timer = setInterval(() => {
      setActiveBanner((current) => (current + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <div className="workspace-page">
      <div className="workspace-top">
        <section className="workspace-banner">
          <div className="workspace-banner-slide">
            {loading ? (
              <Skeleton className="workspace-banner-skeleton" />
            ) : banner?.ImagePath ? (
              <img className="workspace-banner-image" src={banner.ImagePath} alt={banner.Title || "Banner"} />
            ) : (
              <div className="workspace-banner-placeholder">No banner</div>
            )}
            {banner?.Title && <h2 className="workspace-banner-title">{banner.Title}</h2>}
          </div>

        </section>

        <aside className="workspace-notices">
          <h3 className="workspace-notices-title">Alerts & Notifications</h3>
          {loading ? (
            <ul className="workspace-notice-list">
              {[0, 1, 2].map((item) => (
                <li key={item} className="workspace-notice workspace-notice-row">
                  <Skeleton type="circle" className="workspace-notice-skeleton-icon" />
                  <span className="workspace-notice-skeleton-copy">
                    <Skeleton className="workspace-notice-skeleton-title" />
                    <Skeleton className="workspace-notice-skeleton-detail" />
                  </span>
                </li>
              ))}
            </ul>
          ) : notices.length === 0 ? (
            <p className="workspace-notice-empty">No alerts</p>
          ) : (
            <ul className="workspace-notice-list">
              {notices.map((notice) => {
                const content = (
                  <>
                    <span className="workspace-notice-icon">
                      {notice.link ? (
                        <IconWorld size={16} />
                      ) : notice.kind === "birthday" || notice.kind === "anniversary" ? (
                        <IconCake size={16} />
                      ) : (
                        <IconBell size={16} />
                      )}
                    </span>
                    <span className="workspace-notice-copy">
                      <span className="workspace-notice-heading">{notice.title}</span>
                      {notice.link ? (
                        <span className="workspace-notice-form-link">{notice.detail || "Form link"}</span>
                      ) : (
                        notice.detail && <span className="workspace-notice-detail">{notice.detail}</span>
                      )}
                    </span>
                  </>
                );

                return (
                  <li key={notice.id} className={`workspace-notice workspace-notice-${notice.tone}`}>
                    {notice.link ? (
                      <a className="workspace-notice-row" href={notice.link} target="_blank" rel="noreferrer">
                        {content}
                      </a>
                    ) : (
                      <div className="workspace-notice-row">{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>

      <section className="workspace-overview">
        <div className="workspace-orders-header">
          <h3 className="workspace-orders-title">Production Orders Overview</h3>
          <input
            className="workspace-orders-search"
            type="search"
            value={orderSearch}
            onChange={(event) => setOrderSearch(event.target.value)}
            placeholder="Search order no, item code, or product name"
          />
        </div>

        {ordersLoading ? (
          <Skeleton className="workspace-orders-skeleton" />
        ) : (
          <>
            <div className="workspace-kpi-grid">
              <div className="workspace-kpi-card">
                <span className="workspace-kpi-label">Open Orders</span>
                <span className="workspace-kpi-value">{fmtQty(overview.summary.total)}</span>
                <span className="workspace-kpi-note">{fmtQty(overview.summary.planned)} planned · {fmtQty(overview.summary.released)} released</span>
              </div>
              <div className="workspace-kpi-card">
                <span className="workspace-kpi-label">Overdue</span>
                <span className="workspace-kpi-value workspace-kpi-value-danger">{fmtQty(overview.summary.overdue)}</span>
                <span className="workspace-kpi-note">Past due date</span>
              </div>
              <div className="workspace-kpi-card">
                <span className="workspace-kpi-label">Planned Qty</span>
                <span className="workspace-kpi-value">{fmtQty(overview.summary.plannedQty)}</span>
                <span className="workspace-kpi-note">{fmtQty(overview.summary.completedQty)} completed</span>
              </div>
              <div className="workspace-kpi-card">
                <span className="workspace-kpi-label">Pending Qty</span>
                <span className="workspace-kpi-value">{fmtQty(overview.summary.pendingQty)}</span>
                <span className="workspace-kpi-note">
                  {overview.summary.plannedQty > 0
                    ? `${((overview.summary.completedQty / overview.summary.plannedQty) * 100).toFixed(1)}% complete`
                    : "No planned quantity"}
                </span>
              </div>
            </div>

            <div className="workspace-chart-grid">
              <div className="workspace-chart-card">
                <h4 className="workspace-chart-title">Orders by Status</h4>
                <div className="workspace-chart-donut">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={overview.statusData} innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value">
                        {overview.statusData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="workspace-chart-legend">
                    {overview.statusData.map((entry) => (
                      <li key={entry.name}>
                        <svg className="legend-color" viewBox="0 0 12 12" aria-hidden="true">
                          <circle cx="6" cy="6" r="6" fill={entry.color} />
                        </svg>
                        <span>{entry.name}</span>
                        <strong>{fmtQty(entry.value)}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="workspace-chart-card">
                <h4 className="workspace-chart-title">Top Pending Quantity</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={overview.topPending} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value, name, item) => [fmtQty(value), item?.payload?.product || "Pending"]} />
                    <Bar dataKey="value" name="Pending" fill="#F59E0B" barSize={16} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="workspace-orders">
        <div className="workspace-orders-header">
          <h3 className="workspace-orders-title">Today Working PO</h3>
          <input
            className="workspace-orders-search"
            type="date"
            value={workingDate}
            onChange={(event) => setWorkingDate(event.target.value)}
          />
        </div>
        {workingLoading ? (
          <Skeleton className="workspace-orders-skeleton" />
        ) : (
          <>
            <div className="workspace-kpi-grid workspace-kpi-grid-compact">
              <div className="workspace-kpi-card">
                <span className="workspace-kpi-label">Working POs</span>
                <span className="workspace-kpi-value">{fmtQty(workingOverview.summary.pos)}</span>
                <span className="workspace-kpi-note">{fmtQty(workingOverview.summary.plans)} plan entries</span>
              </div>
              <div className="workspace-kpi-card">
                <span className="workspace-kpi-label">Active Lines</span>
                <span className="workspace-kpi-value">{fmtQty(workingOverview.summary.lines)}</span>
                <span className="workspace-kpi-note">{fmtQty(workingOverview.summary.supervisors)} supervisors</span>
              </div>
              <div className="workspace-kpi-card">
                <span className="workspace-kpi-label">Staff Assigned</span>
                <span className="workspace-kpi-value">{fmtQty(workingOverview.summary.staff)}</span>
                <span className="workspace-kpi-note">Across all lines</span>
              </div>
            </div>

            <div className="workspace-chart-grid">
              <div className="workspace-chart-card">
                <h4 className="workspace-chart-title">Staff by Line</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={workingOverview.lineData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" name="Staff" fill="#10B981" barSize={16} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="workspace-chart-card">
                <h4 className="workspace-chart-title">Plans by Shift</h4>
                <div className="workspace-chart-donut">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={workingOverview.shiftData} innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value">
                        {workingOverview.shiftData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="workspace-chart-legend">
                    {workingOverview.shiftData.map((entry) => (
                      <li key={entry.name}>
                        <svg className="legend-color" viewBox="0 0 12 12" aria-hidden="true">
                          <circle cx="6" cy="6" r="6" fill={entry.color} />
                        </svg>
                        <span>{entry.name}</span>
                        <strong>{fmtQty(entry.value)}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="workspace-working-list">
              <Table
                title="PO Lines"
                data={workingPlans}
                columns={workingColumns}
                totalEntries={workingPlans.length}
                showActions={false}
                showPagination={false}
                onRowClick={setSelectedPlan}
              />
            </div>
          </>
        )}
      </section>

      {selectedPlan && (
        <GlobalPopup
          className="workspace-staff-modal"
          title={`PO ${selectedPlan.PO || ""} staff`}
          onClose={() => setSelectedPlan(null)}
        >
          <div className="workspace-staff-popup">
            <div className="workspace-staff-head">
              <span className="workspace-staff-po">PO {selectedPlan.PO || "-"}</span>
              <h3 className="workspace-staff-product">{selectedPlan.ProductName || "No product name"}</h3>
              <div className="workspace-staff-meta">
                <span className="workspace-staff-chip">{selectedPlan.Line || "No line"}</span>
                <span className="workspace-staff-chip">{selectedPlan.Shift || "No shift"}</span>
                <span className="workspace-staff-chip">{selectedPlan.Supervisor || "No supervisor"}</span>
                <span className="workspace-staff-chip">{(selectedPlan.staff || []).length} staff</span>
              </div>
            </div>
            <div className="workspace-staff-body">
              <Table
                data={selectedPlan.staff || []}
                columns={staffColumns}
                totalEntries={(selectedPlan.staff || []).length}
                showActions={false}
                showPagination={false}
              />
            </div>
          </div>
        </GlobalPopup>
      )}
    </div>
  );
};

export default MyWorkspace;
