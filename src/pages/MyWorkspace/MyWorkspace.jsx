import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { IconBell, IconCake, IconPlus, IconWorld } from "@tabler/icons-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import Skeleton from "../../global-components/Skeleton/Skeleton";
import Table from "../../global-components/Table/Table";
import GlobalPopup from "../../global-components/GlobalPopup/GlobalPopup";
import { workspaceApi } from "../../apis/workspace/workspace";
import { formatDisplayDate } from "../../util/text/datetimeformat";
import "./MyWorkspace.css";

const DASHBOARD_URL = "https://dome.visole.net/api/home/dashboard";
const NOTICE_URL = "https://dome.visole.net/api/home/admin/notices";

const STATUS_COLORS = { Planned: "#F59E0B", Released: "#1B47DB" };

const toNumber = (value) => Number(value) || 0;

const MyWorkspace = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [notices, setNotices] = useState([]);
  const [activeBanner, setActiveBanner] = useState(0);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [openSummary, setOpenSummary] = useState({
    total: 0,
    planned: 0,
    released: 0,
    overdue: 0,
    plannedQty: 0,
    completedQty: 0,
    remainingQty: 0,
    nextDueDate: "",
    nextDueStatus: "",
  });
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderSearch, setOrderSearch] = useState("");
  const [debouncedOrderSearch, setDebouncedOrderSearch] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState(10);
  const [orderTotal, setOrderTotal] = useState(0);
  const [workingDate, setWorkingDate] = useState(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${month}-${day}`;
  });
  const [workingPlans, setWorkingPlans] = useState([]);
  const [workingLoading, setWorkingLoading] = useState(true);
  const [workingKpis, setWorkingKpis] = useState({
    workingPOs: 0,
    scheduledLines: 0,
    assignedStaff: 0,
    assignmentRecords: 0,
    blockedOrders: 0,
  });
  const [blockers, setBlockers] = useState([]);
  const [overlapWarnings, setOverlapWarnings] = useState([]);
  const [sapMonthLoading, setSapMonthLoading] = useState(true);
  const [sapMonthRows, setSapMonthRows] = useState([]);
  const [sapMonthStart, setSapMonthStart] = useState("");
  const [detailPopup, setDetailPopup] = useState(null);
  const [grnLoading, setGrnLoading] = useState(true);
  const [grnSummary, setGrnSummary] = useState({
    posted: 0,
    sampled: 0,
    notSampled: 0,
    underInspection: 0,
    pendingDisposition: 0,
    rows: [],
  });

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
    setOrderPage(1);
  }, [debouncedOrderSearch]);

  useEffect(() => {
    let cancelled = false;
    const loadOrders = async () => {
      setOrdersLoading(true);
      try {
        const response = await workspaceApi.getOpenProductionOrders({
          search: debouncedOrderSearch,
          page: orderPage,
          limit: orderPageSize,
        });
        if (!cancelled) {
          setOrders(response?.data?.orders || []);
          setOpenSummary({
            total: response?.data?.total || 0,
            planned: response?.data?.planned || 0,
            released: response?.data?.released || 0,
            overdue: response?.data?.overdue || 0,
            plannedQty: response?.data?.plannedQty || 0,
            completedQty: response?.data?.completedQty || 0,
            remainingQty: response?.data?.remainingQty || 0,
            nextDueDate: response?.data?.nextDueDate || "",
            nextDueStatus: response?.data?.nextDueStatus || "",
          });
          setOrderTotal(response?.pagination?.total || 0);
        }
      } catch (error) {
        console.error("Open production orders error:", error);
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    };
    loadOrders();
    return () => {
      cancelled = true;
    };
  }, [debouncedOrderSearch, orderPage, orderPageSize]);

  useEffect(() => {
    let cancelled = false;
    const loadWorkingPlans = async () => {
      setWorkingLoading(true);
      try {
        const response = await workspaceApi.getTodayWorkingPlans({ date: workingDate });
        if (!cancelled) {
          setWorkingPlans(response?.data || []);
          setWorkingKpis({
            workingPOs: response?.kpis?.workingPOs || 0,
            scheduledLines: response?.kpis?.scheduledLines || 0,
            assignedStaff: response?.kpis?.assignedStaff || 0,
            assignmentRecords: response?.kpis?.assignmentRecords || 0,
            blockedOrders: response?.kpis?.blockedOrders || 0,
          });
          setBlockers(response?.blockers || []);
          setOverlapWarnings(response?.overlapWarnings || []);
        }
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

  useEffect(() => {
    let cancelled = false;
    const loadMonthWorkingPos = async () => {
      setSapMonthLoading(true);
      try {
        const response = await workspaceApi.getMonthWorkingPos({ date: workingDate });
        if (!cancelled) {
          setSapMonthRows(response?.data || []);
          setSapMonthStart(response?.monthStart || "");
        }
      } catch (error) {
        console.error("Month working POs error:", error);
      } finally {
        if (!cancelled) setSapMonthLoading(false);
      }
    };
    loadMonthWorkingPos();
    return () => {
      cancelled = true;
    };
  }, [workingDate]);

  useEffect(() => {
    let cancelled = false;
    const loadPostedGrns = async () => {
      setGrnLoading(true);
      try {
        const response = await workspaceApi.getPostedGrns({ date: workingDate });
        if (!cancelled) {
          setGrnSummary({
            posted: response?.data?.posted || 0,
            sampled: response?.data?.sampled || 0,
            notSampled: response?.data?.notSampled || 0,
            underInspection: response?.data?.underInspection || 0,
            pendingDisposition: response?.data?.pendingDisposition || 0,
            rows: response?.data?.rows || [],
          });
        }
      } catch (error) {
        console.error("Posted GRNs error:", error);
      } finally {
        if (!cancelled) setGrnLoading(false);
      }
    };
    loadPostedGrns();
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
      if (order.ProductionStatus === "Planned" || order.ProductionOrderStatus === "Planned") summary.planned += 1;
      if (order.ProductionStatus === "Released" || order.ProductionOrderStatus === "Released") summary.released += 1;
      if (order.DueStatus === "Overdue") summary.overdue += 1;
      summary.plannedQty += toNumber(order.PlannedQty ?? order.PlannedQuantity);
      summary.completedQty += toNumber(order.CompletedQty ?? order.CompletedQuantity);
      summary.pendingQty += toNumber(order.RemainingQty ?? order.PendingQuantity);

      const warehouseLabel = order.WarehouseName || order.Warehouse || "Unknown";
      warehouses[warehouseLabel] = (warehouses[warehouseLabel] || 0) + 1;

      if (order.DueDate) {
        const due = new Date(order.DueDate);
        due.setHours(0, 0, 0, 0);
        const days = Math.round((due - today) / 86400000);
        if (days < 0) {
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
      .sort((a, b) => toNumber(b.RemainingQty ?? b.PendingQuantity) - toNumber(a.RemainingQty ?? a.PendingQuantity))
      .slice(0, 5)
      .map((order) => ({
        name: `PO ${order.ProductionOrderNo}`,
        product: order.ItemName || order.ProductName,
        value: toNumber(order.RemainingQty ?? order.PendingQuantity),
      }));

    return { summary, statusData, warehouseData, dueData, topPending };
  }, [orders]);

  const workingOverview = useMemo(() => {
    const summary = { plans: 0, pos: new Set(), lines: new Set(), staff: new Set(), supervisors: new Set() };
    const lines = {};

    workingPlans.forEach((plan) => {
      summary.plans += 1;
      if (plan.PO) summary.pos.add(String(plan.PO));
      if (plan.Line) summary.lines.add(plan.Line);
      if (plan.Supervisor) summary.supervisors.add(plan.Supervisor);
      (plan.staff || []).forEach((person) => {
        if (person.StaffID) summary.staff.add(person.StaffID);
      });

      const lineLabel = plan.Line || "No line";
      if (!lines[lineLabel]) {
        lines[lineLabel] = {
          staff: new Set(),
          pos: new Set(),
          products: [],
          supervisors: new Set(),
          shifts: new Set(),
        };
      }
      if (plan.PO) lines[lineLabel].pos.add(String(plan.PO));
      if (plan.ProductName) {
        lines[lineLabel].products.push({
          PO: plan.PO,
          ProductName: plan.ProductName,
        });
      }
      if (plan.Supervisor) lines[lineLabel].supervisors.add(plan.Supervisor);
      if (plan.Shift) lines[lineLabel].shifts.add(plan.Shift);
      (plan.staff || []).forEach((person) => {
        if (person.StaffID) lines[lineLabel].staff.add(person.StaffID);
      });
    });

    const lineData = Object.entries(lines)
      .map(([name, info]) => ({
        name,
        staff: info.staff.size,
        pos: [...info.pos],
        products: info.products,
        supervisors: [...info.supervisors],
        shifts: [...info.shifts],
      }))
      .sort((a, b) => b.staff - a.staff);

    return {
      summary: {
        plans: summary.plans,
        pos: summary.pos.size,
        lines: summary.lines.size,
        staff: summary.staff.size,
        supervisors: summary.supervisors.size,
      },
      lineData,
    };
  }, [workingPlans]);

  const sapDailyChart = useMemo(() => {
    const producedByDate = {};
    const plannedByDate = {};
    const plannedPosByDate = {};
    const itemsByDate = {};
    sapMonthRows.forEach((row) => {
      const qty = toNumber(row.postedProduction);
      if (!row.actualDate || qty <= 0) return;
      producedByDate[row.actualDate] = (producedByDate[row.actualDate] || 0) + qty;
      if (!plannedPosByDate[row.actualDate]) plannedPosByDate[row.actualDate] = {};
      const poKey = String(row.PO);
      if (!plannedPosByDate[row.actualDate][poKey]) {
        plannedPosByDate[row.actualDate][poKey] = toNumber(row.plannedQty);
        plannedByDate[row.actualDate] = (plannedByDate[row.actualDate] || 0) + toNumber(row.plannedQty);
      }
      if (!itemsByDate[row.actualDate]) itemsByDate[row.actualDate] = [];
      itemsByDate[row.actualDate].push({
        PO: row.PO,
        ItemCode: row.ItemCode || "-",
        ItemName: row.ItemName || "",
        plannedQty: toNumber(row.plannedQty),
        qty,
      });
    });
    const toDayPoint = (date) => ({
      date,
      plannedQty: plannedByDate[date] || 0,
      producedQty: producedByDate[date] || 0,
      items: (itemsByDate[date] || []).sort((a, b) => b.qty - a.qty),
    });
    if (!sapMonthStart) {
      return [...new Set([...Object.keys(producedByDate), ...Object.keys(plannedByDate)])]
        .sort()
        .map(toDayPoint);
    }
    const days = [];
    const cursor = new Date(`${sapMonthStart}T00:00:00`);
    const month = cursor.getMonth();
    while (cursor.getMonth() === month) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
      days.push(toDayPoint(key));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [sapMonthRows, sapMonthStart]);

  const fmtQty = (value) => (value == null || value === "" ? "-" : Number(value).toLocaleString());
  const renderLineStaffTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const point = payload[0]?.payload || {};
    const products = point.products || [];
    return (
      <div className="workspace-chart-tooltip">
        <p className="workspace-chart-tooltip-date">{point.name}</p>
        <p>Staff : {fmtQty(point.staff)}</p>
        <p>POs : {fmtQty((point.pos || []).length)}</p>
        {(point.supervisors || []).length > 0 && <p>Supervisor : {point.supervisors.join(", ")}</p>}
        {(point.shifts || []).length > 0 && <p>Shift : {point.shifts.join(", ")}</p>}
        {products.length > 0 && (
          <ul className="workspace-chart-tooltip-items">
            {products.slice(0, 6).map((item) => (
              <li key={`${item.PO}-${item.ProductName}`}>
                <span className="workspace-chart-tooltip-item">
                  {item.PO ? <strong>PO {item.PO}</strong> : null}
                  {item.ProductName ? ` ${item.ProductName}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };
  const renderSapTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const point = payload[0]?.payload || {};
    const items = point.items || [];
    return (
      <div className="workspace-chart-tooltip">
        <p className="workspace-chart-tooltip-date">{formatDisplayDate(label)}</p>
        <p>Planned Qty : {fmtQty(point.plannedQty)}</p>
        <p>Produced Qty : {fmtQty(point.producedQty)}</p>
        {items.length > 0 && (
          <ul className="workspace-chart-tooltip-items">
            {items.slice(0, 8).map((item) => (
              <li key={`${item.PO}-${item.ItemCode}`}>
                <span className="workspace-chart-tooltip-item">
                  <strong>{item.ItemCode}</strong>
                  {item.ItemName ? ` ${item.ItemName}` : ""}
                  {item.PO ? ` · PO ${item.PO}` : ""}
                </span>
                <span>{fmtQty(item.qty)}</span>
              </li>
            ))}
            {items.length > 8 && <li>+{items.length - 8} more</li>}
          </ul>
        )}
      </div>
    );
  };
  const completionPct = (completed, planned) => {
    const plannedQty = toNumber(planned);
    if (plannedQty <= 0) return 0;
    return Math.min(100, (toNumber(completed) / plannedQty) * 100);
  };
  const fmtPct = (value) => `${toNumber(value).toFixed(1)}%`;
  const overallCompletePct = completionPct(openSummary.completedQty, openSummary.plannedQty);
  const flattenStaff = (plans) => {
    const byId = {};
    plans.forEach((plan) => {
      (plan.staff || []).forEach((person) => {
        if (!person.StaffID) return;
        if (!byId[person.StaffID]) {
          byId[person.StaffID] = {
            StaffID: person.StaffID,
            Name: person.Name || `Staff ${person.StaffID}`,
            jd: person.jd || "-",
            hours: 0,
            pos: new Set(),
            lines: new Set(),
          };
        }
        byId[person.StaffID].hours += toNumber(person.hours);
        if (plan.PO) byId[person.StaffID].pos.add(String(plan.PO));
        if (plan.Line) byId[person.StaffID].lines.add(plan.Line);
      });
    });
    return Object.values(byId).map((row) => ({
      ...row,
      pos: [...row.pos].join(", ") || "-",
      lines: [...row.lines].join(", ") || "-",
    }));
  };

  const openStaffPopup = (plans, title, chips = []) => {
    const rows = flattenStaff(plans);
    setDetailPopup({
      title,
      chips: [...chips, `${rows.length} assigned`],
      note: overlapWarnings.length
        ? `${overlapWarnings.length} employee${overlapWarnings.length === 1 ? "" : "s"} assigned to more than one PO`
        : "",
      columns: [
        { header: "Name", key: "Name" },
        { header: "J.D", key: "jd", render: (row) => row.jd || "-" },
        { header: "Planned Hours", key: "hours", align: "right", render: (row) => fmtQty(row.hours) },
        { header: "PO", key: "pos" },
        { header: "Line", key: "lines" },
      ],
      rows,
    });
  };

  const openPlanStaff = (plan) => {
    openStaffPopup(
      [plan],
      `PO ${plan.PO || ""} staff`,
      [plan.ProductName, plan.Line, plan.Shift, plan.Supervisor].filter(Boolean)
    );
  };

  const openBlockersPopup = () => {
    setDetailPopup({
      title: "Production blockers",
      chips: [`${workingKpis.blockedOrders} orders`],
      note: "All Planned and Released POs. Shortage uses outstanding WOR1 quantity above warehouse OnHand.",
      columns: [
        { header: "PO", key: "po" },
        { header: "Product", key: "product", render: (row) => row.product || "-" },
        { header: "Item", key: "itemCode" },
        { header: "Material", key: "itemName", render: (row) => row.itemName || "-" },
        { header: "Shortage Qty", key: "shortageQty", align: "right", render: (row) => fmtQty(row.shortageQty) },
        { header: "On Hand", key: "onHand", align: "right", render: (row) => fmtQty(row.onHand) },
      ],
      rows: blockers,
    });
  };

  const workingColumns = [
    { header: "PO", key: "PO" },
    { header: "Product Name", key: "ProductName", render: (row) => row.ProductName || "-" },
    { header: "Line", key: "Line" },
    { header: "Shift", key: "Shift", render: (row) => row.Shift || "-" },
    { header: "Supervisor", key: "Supervisor", render: (row) => row.Supervisor || "-" },
    { header: "Staff", key: "staff", align: "right", render: (row) => fmtQty((row.staff || []).length) },
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

      <section className="workspace-quick-actions">
        <h3 className="workspace-quick-title">Quick Actions</h3>
        <button
          type="button"
          className="workspace-quick-btn"
          onClick={() => navigate("/workspace/ticket")}
        >
          <IconPlus size={16} />
          Create Ticket
        </button>
      </section>

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
            <div className="workspace-kpi-grid workspace-kpi-grid-five">
              <div className="workspace-kpi-card">
                <span className="workspace-kpi-label">Open Orders</span>
                <span className="workspace-kpi-value">{fmtQty(openSummary.total)}</span>
                <span className="workspace-kpi-note">{fmtQty(openSummary.planned)} planned · {fmtQty(openSummary.released)} released</span>
                {openSummary.nextDueDate && (
                  <span className="workspace-kpi-note">
                    Next due {formatDisplayDate(openSummary.nextDueDate)}
                    {openSummary.nextDueStatus ? ` · ${openSummary.nextDueStatus}` : ""}
                  </span>
                )}
              </div>
              <div className="workspace-kpi-card">
                <span className="workspace-kpi-label">Overdue</span>
                <span className="workspace-kpi-value workspace-kpi-value-danger">{fmtQty(openSummary.overdue)}</span>
                <span className="workspace-kpi-note">Past due date</span>
              </div>
              <div className="workspace-kpi-card">
                <span className="workspace-kpi-label">Planned Qty</span>
                <span className="workspace-kpi-value">{fmtQty(openSummary.plannedQty)}</span>
                <span className="workspace-kpi-note">{fmtQty(openSummary.completedQty)} completed</span>
              </div>
              <div className="workspace-kpi-card">
                <span className="workspace-kpi-label">Pending Qty</span>
                <span className="workspace-kpi-value">{fmtQty(openSummary.remainingQty)}</span>
                <span className="workspace-kpi-note">Still to complete</span>
              </div>
              <div className="workspace-kpi-card">
                <span className="workspace-kpi-label">Completed</span>
                <span className="workspace-kpi-value">{fmtPct(overallCompletePct)}</span>
                <span className="workspace-kpi-note">{fmtQty(openSummary.completedQty)} of {fmtQty(openSummary.plannedQty)}</span>
              </div>
            </div>

            <Table
              data={orders}
              columns={[
                { header: "PO No", key: "ProductionOrderNo" },
                { header: "Item", key: "ItemCode" },
                { header: "Product", key: "ItemName" },
                { header: "Status", key: "ProductionStatus" },
                { header: "Work Status", key: "WorkStatus" },
                {
                  header: "Due Date",
                  key: "DueDate",
                  render: (row) => formatDisplayDate(row.DueDate),
                },
                {
                  header: "Due Status",
                  key: "DueStatus",
                  render: (row) => (
                    <span className={`overview-due-status ${String(row.DueStatus || "").toLowerCase().replace(/\s+/g, "-")}`}>
                      {row.DueStatus}
                    </span>
                  ),
                },
                { header: "Days Remaining", key: "DaysRemaining", align: "right" },
                { header: "Planned Qty", key: "PlannedQty", align: "right", render: (row) => fmtQty(row.PlannedQty) },
                { header: "Completed Qty", key: "CompletedQty", align: "right", render: (row) => fmtQty(row.CompletedQty) },
                { header: "Pending Qty", key: "RemainingQty", align: "right", render: (row) => fmtQty(row.RemainingQty) },
                {
                  header: "Completed %",
                  key: "CompletedPct",
                  align: "right",
                  render: (row) => {
                    const pct = completionPct(row.CompletedQty, row.PlannedQty);
                    return (
                      <span className="workspace-complete-cell">
                        <span className="workspace-complete-track" aria-hidden="true">
                          <span
                            className={`workspace-complete-fill${pct >= 100 ? " is-complete" : ""}`}
                            style={{ width: `${pct}%` }}
                          />
                        </span>
                        <span>{fmtPct(pct)}</span>
                      </span>
                    );
                  },
                },
              ]}
              totalEntries={orderTotal}
              showActions={false}
              showPagination={true}
              currentPage={orderPage}
              pageSize={orderPageSize}
              onPageChange={setOrderPage}
              onItemsPerPageChange={(size) => {
                setOrderPageSize(size);
                setOrderPage(1);
              }}
            />
          </>
        )}
      </section>

      <section className="workspace-orders">
        <div className="workspace-orders-header">
          <h3 className="workspace-orders-title">Today's Production</h3>
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
            <div className="workspace-kpi-grid">
              <button
                type="button"
                className="workspace-kpi-card is-clickable"
                onClick={() => openStaffPopup(workingPlans, "Working POs", [`${workingKpis.workingPOs} POs`])}
              >
                <span className="workspace-kpi-label">Working POs</span>
                <span className="workspace-kpi-value">{fmtQty(workingKpis.workingPOs)}</span>
                <span className="workspace-kpi-note">{fmtQty(workingOverview.summary.plans)} plan entries</span>
              </button>
              <button
                type="button"
                className="workspace-kpi-card is-clickable"
                onClick={() => openStaffPopup(workingPlans, "Scheduled lines", [`${workingKpis.scheduledLines} lines`])}
              >
                <span className="workspace-kpi-label">Scheduled Lines</span>
                <span className="workspace-kpi-value">{fmtQty(workingKpis.scheduledLines)}</span>
                <span className="workspace-kpi-note">{fmtQty(workingOverview.summary.supervisors)} supervisors</span>
              </button>
              <button
                type="button"
                className="workspace-kpi-card is-clickable"
                onClick={() => openStaffPopup(workingPlans, "Assigned staff", [`${workingKpis.assignedStaff} employees`])}
              >
                <span className="workspace-kpi-label">Assigned Staff</span>
                <span className="workspace-kpi-value">{fmtQty(workingKpis.assignedStaff)}</span>
                <span className="workspace-kpi-note">{fmtQty(workingKpis.assignmentRecords)} assignment records</span>
              </button>
              <button
                type="button"
                className={`workspace-kpi-card is-clickable${workingKpis.blockedOrders ? " is-alert" : ""}`}
                onClick={openBlockersPopup}
              >
                <span className="workspace-kpi-label">Production Blockers</span>
                <span className={`workspace-kpi-value${workingKpis.blockedOrders ? " workspace-kpi-value-danger" : ""}`}>
                  {fmtQty(workingKpis.blockedOrders)}
                </span>
                <span className="workspace-kpi-note">Material shortage on Planned and Released POs</span>
              </button>
            </div>

            {workingOverview.lineData.length > 0 && (
              <div className="workspace-chart-card workspace-chart-wide">
                <h4 className="workspace-chart-title">Staff by Line</h4>
                <p className="workspace-kpi-note">Hover a line for PO and product. Click to open assigned staff.</p>
                <ResponsiveContainer width="100%" height={Math.max(180, workingOverview.lineData.length * 56)}>
                  <BarChart
                    data={workingOverview.lineData}
                    layout="vertical"
                    margin={{ top: 8, right: 48, left: 4, bottom: 4 }}
                    barCategoryGap="28%"
                    onClick={(state) => {
                      const lineName = state?.activeLabel;
                      if (!lineName) return;
                      openStaffPopup(
                        workingPlans.filter((plan) => (plan.Line || "No line") === lineName),
                        `${lineName} staff`,
                        [lineName]
                      );
                    }}
                  >
                    <CartesianGrid stroke="#E5EAF2" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={148}
                      tick={{ fontSize: 12, fill: "#334155" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip cursor={{ fill: "rgba(27, 71, 219, 0.06)" }} content={renderLineStaffTooltip} />
                    <Bar dataKey="staff" name="Staff" fill="#1B47DB" barSize={28} radius={[0, 6, 6, 0]} cursor="pointer">
                      <LabelList dataKey="staff" position="right" className="workspace-chart-bar-label" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="workspace-working-list">
              <Table
                title="PO Lines"
                data={workingPlans}
                columns={workingColumns}
                totalEntries={workingPlans.length}
                showActions={false}
                showPagination={false}
                onRowClick={openPlanStaff}
              />
            </div>
          </>
        )}
      </section>

      <section className="workspace-orders">
        <div className="workspace-orders-header">
          <h3 className="workspace-orders-title">SAP Working POs this month</h3>
        </div>
        {sapMonthLoading ? (
          <Skeleton className="workspace-orders-skeleton" />
        ) : (
            <div className="workspace-chart-card workspace-chart-wide">
              <h4 className="workspace-chart-title">Planned vs produced this month</h4>
              <p className="workspace-kpi-note">Hover a day for item and product. Click a day to set the date filter.</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={sapDailyChart}
                  margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
                  onClick={(state) => {
                    const nextDate = state?.activePayload?.[0]?.payload?.date;
                    if (nextDate) setWorkingDate(nextDate);
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => String(value).slice(8, 10)}
                    interval={0}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip content={renderSapTooltip} />
                  <Legend />
                  <Bar dataKey="plannedQty" name="Planned Qty" fill="#94B5E3" cursor="pointer" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="producedQty" name="Produced Qty" fill="#1B47DB" cursor="pointer" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
        )}
      </section>

      <section className="workspace-orders">
        <div className="workspace-orders-header">
          <h3 className="workspace-orders-title">Incoming Material QC</h3>
        </div>
        {grnLoading ? (
          <Skeleton className="workspace-orders-skeleton" />
        ) : (
          <>
            <div className="workspace-kpi-grid">
              <div className="workspace-kpi-card">
                <span className="workspace-kpi-label">Posted GRNs</span>
                <span className="workspace-kpi-value">{fmtQty(grnSummary.posted)}</span>
                <span className="workspace-kpi-note">QC GRNs posted </span>
              </div>
              <div className="workspace-kpi-card">
                <span className="workspace-kpi-label">Sampled</span>
                <span className="workspace-kpi-value">{fmtQty(grnSummary.sampled)}</span>
                <span className="workspace-kpi-note">{fmtQty(grnSummary.notSampled)} posted  still unsampled</span>
              </div>
              <div className="workspace-kpi-card">
                <span className="workspace-kpi-label">Under Inspection</span>
                <span className="workspace-kpi-value">{fmtQty(grnSummary.underInspection)}</span>
                <span className="workspace-kpi-note">Sample or QC status UI</span>
              </div>
              <div className="workspace-kpi-card">
                <span className="workspace-kpi-label">Pending Disposition</span>
                <span className="workspace-kpi-value">{fmtQty(grnSummary.pendingDisposition)}</span>
                <span className="workspace-kpi-note">Item lines awaiting a QC decision</span>
              </div>
            </div>
            <div className="workspace-working-list">
              <Table
                data={grnSummary.rows}
                columns={[
                  { header: "GRN No", key: "GrnNo" },
                  { header: "Supplier", key: "SupplierName" },
                  { header: "GRN Date", key: "GrnDate", render: (row) => formatDisplayDate(row.GrnDate) || "-" },
                  { header: "Item", key: "ItemCode" },
                  { header: "Item Name", key: "ItemName", render: (row) => row.ItemName || "-" },
                  { header: "Sample Status", key: "SampleStatus", render: (row) => row.SampleStatus || (row.Sampled ? "Sampled" : "Not sampled") },
                  { header: "Sampling No", key: "SamplingNo", render: (row) => row.SamplingNo || "-" },
                ]}
                totalEntries={grnSummary.rows.length}
                showActions={false}
                showPagination={false}
              />
            </div>
          </>
        )}
      </section>

      {detailPopup && (
        <GlobalPopup
          className="workspace-staff-modal"
          title={detailPopup.title}
          onClose={() => setDetailPopup(null)}
        >
          <div className="workspace-staff-popup">
            <div className="workspace-staff-head">
              <h3 className="workspace-staff-product">{detailPopup.title}</h3>
              {detailPopup.chips?.length > 0 && (
                <div className="workspace-staff-meta">
                  {detailPopup.chips.map((chip) => (
                    <span key={chip} className="workspace-staff-chip">{chip}</span>
                  ))}
                </div>
              )}
              {detailPopup.note && <p className="workspace-kpi-note">{detailPopup.note}</p>}
            </div>
            <div className="workspace-staff-body">
              <Table
                data={detailPopup.rows || []}
                columns={detailPopup.columns || []}
                totalEntries={(detailPopup.rows || []).length}
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
