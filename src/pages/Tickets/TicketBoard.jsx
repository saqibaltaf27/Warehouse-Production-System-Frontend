import { useEffect, useRef, useState } from "react";
import GlobalPopup from "../../global-components/GlobalPopup/GlobalPopup";
import Button from "../../global-components/Button/Button";
import { ticketsApi } from "../../apis/tickets/tickets";
import { formatDisplayDate } from "../../util/text/datetimeformat";
import { useAuth } from "../../context/AuthContext";
import { IconSearch, IconRefresh, IconSend } from "@tabler/icons-react";
import toast from "react-hot-toast";
import "./TicketBoard.css";
import "./Tickets.css";
import "../ProductionOrders/ProductionOrders.css";

const PAGE_SIZE = 15;
const EMPTY_TOTALS = { Pending: 0, "In Process": 0, Closed: 0 };

const COLUMNS = [
  { status: "Pending", label: "Pending", tone: "pending" },
  { status: "In Process", label: "In-Progress", tone: "progress" },
  { status: "Closed", label: "Closed", tone: "closed" },
];

const normalizeStatus = (status) => {
  const value = String(status || "").toLowerCase().replace(/\s+/g, "");
  if (value === "inprocess" || value === "inprogress") return "In Process";
  if (value === "closed") return "Closed";
  return "Pending";
};

const blankDragImage = new Image();
blankDragImage.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const formatStamp = (value) => {
  const dateText = formatDisplayDate(value);
  if (!dateText) return "—";
  const time = String(value).match(/(\d{2}:\d{2})/);
  return time ? `${dateText} ${time[1]}` : dateText;
};

const TicketBoard = ({ ticketType }) => {
  const { user } = useAuth();
  const employeeName = user?.FirstName || user?.firstName || "";
  const [tickets, setTickets] = useState([]);
  const [totals, setTotals] = useState(EMPTY_TOTALS);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState("");
  const [filters, setFilters] = useState({ search: "", assignedTo: "", createdBy: "" });
  const [selected, setSelected] = useState(null);
  const [remark, setRemark] = useState("");
  const [savingRemark, setSavingRemark] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [savingTicket, setSavingTicket] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [overStatus, setOverStatus] = useState("");
  const skipClick = useRef(false);
  const dragMoved = useRef(false);
  const ghostRef = useRef(null);
  const pendingDrag = useRef(null);

  const loadTickets = async ({ status = "", offset = 0, append = false, nextFilters = filters } = {}) => {
    if (append) setLoadingMore(status);
    else setLoading(true);
    try {
      const response = await ticketsApi.getTickets({
        type: ticketType,
        mine: "0",
        search: nextFilters.search,
        assignedTo: nextFilters.assignedTo,
        createdBy: nextFilters.createdBy,
        status,
        limit: PAGE_SIZE,
        offset,
      });
      const rows = (response?.data || []).map((ticket) => ({ ...ticket, Status: normalizeStatus(ticket.Status) }));
      if (append) {
        setTickets((current) => [...current, ...rows]);
        if (rows[0]) setTotals((current) => ({ ...current, [status]: rows[0].StatusTotal }));
      } else {
        const nextTotals = { ...EMPTY_TOTALS };
        rows.forEach((row) => { nextTotals[row.Status] = row.StatusTotal || 0; });
        setTotals(nextTotals);
        setTickets(rows);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load tickets");
    } finally {
      setLoading(false);
      setLoadingMore("");
    }
  };

  useEffect(() => {
    loadTickets();
    ticketsApi.getEmployees().then((response) => setEmployees(response?.data || [])).catch(() => {});
  }, [ticketType]);

  const updateFilter = (key, value) => {
    const nextFilters = { ...filters, [key]: value };
    setFilters(nextFilters);
    loadTickets({ nextFilters });
  };

  const openTicket = async (ticketId) => {
    const response = await ticketsApi.getTicket(ticketId);
    setSelected(response.data);
    setRemark("");
  };

  const moveTicket = async (ticketId, status) => {
    const current = tickets.find((ticket) => ticket.TicketId === ticketId);
    if (!current || current.Status === status) return;
    const fromStatus = current.Status;
    setTickets((rows) => rows.map((ticket) => (
      ticket.TicketId === ticketId ? { ...ticket, Status: status } : ticket
    )));
    setTotals((previous) => ({
      ...previous,
      [fromStatus]: Math.max((previous[fromStatus] || 0) - 1, 0),
      [status]: (previous[status] || 0) + 1,
    }));
    try {
      await ticketsApi.updateTicket(ticketId, { status });
      toast.success(`Ticket moved to ${status}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update the ticket status. Please try again.");
      loadTickets();
    }
  };

  const changeAssignee = async (assignedTo) => {
    await ticketsApi.updateTicket(selected.TicketId, { assignedTo: assignedTo || null });
    setSelected((current) => ({ ...current, AssignedTo: assignedTo || null }));
    loadTickets();
  };

  const submitRemark = async () => {
    if (!remark.trim()) return;
    setSavingRemark(true);
    try {
      await ticketsApi.addRemark(selected.TicketId, remark.trim());
      await openTicket(selected.TicketId);
    } finally {
      setSavingRemark(false);
    }
  };

  const createTicket = async (event) => {
    event.preventDefault();
    if (!description.trim()) return;
    setSavingTicket(true);
    try {
      await ticketsApi.createTicket({ ticketType, description: description.trim() });
      setShowForm(false);
      setDescription("");
      toast.success("Ticket created");
      loadTickets();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create the ticket");
    } finally {
      setSavingTicket(false);
    }
  };

  const exportRows = async () => {
    const response = await ticketsApi.getTickets({
      type: ticketType,
      mine: "0",
      search: filters.search,
      assignedTo: filters.assignedTo,
      createdBy: filters.createdBy,
      limit: 0,
    });
    return response?.data || [];
  };

  const exportExcel = async () => {
    try {
      const rows = await exportRows();
      const header = ["Ticket No", "Employee", "Description", "Status", "Assigned To", "Created"];
      const body = rows.map((row) => [row.TicketId, row.FirstName || "", row.TicketDescription || "", normalizeStatus(row.Status), row.AssignedName || "", formatStamp(row.CreatedAt)]);
      const csv = [header, ...body].map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      link.download = `${ticketType}-tickets.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not export tickets");
    }
  };

  const exportPdf = async () => {
    try {
      const rows = await exportRows();
      const popup = window.open("", "_blank");
      if (!popup) return;
      const table = rows.map((row) => `<tr><td>${row.TicketId}</td><td>${row.FirstName || ""}</td><td>${row.TicketDescription || ""}</td><td>${normalizeStatus(row.Status)}</td><td>${row.AssignedName || ""}</td><td>${formatStamp(row.CreatedAt)}</td></tr>`).join("");
      popup.document.write(`<html><head><title>${ticketType} Tickets</title></head><body><h1>${ticketType} Tickets</h1><table border="1" cellpadding="6" cellspacing="0"><thead><tr><th>Ticket No</th><th>Employee</th><th>Description</th><th>Status</th><th>Assigned To</th><th>Created</th></tr></thead><tbody>${table}</tbody></table><script>window.print()</` + `script></body></html>`);
      popup.document.close();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not export tickets");
    }
  };

  return (
    <div className="ticket-board">
      <h2 className="ticket-board-title">{ticketType} Tickets</h2>
      <div className="po-filter-toolbar-card">
        <div className="po-filter-toolbar-grid">
          <div className="po-filter-item po-filter-search-box">
            <label className="po-filter-label">Search</label>
            <div style={{ position: "relative" }}>
              <IconSearch size={18} className="po-filter-search-icon" />
              <input
                type="text"
                placeholder="Search by description or ID..."
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
                className="po-filter-search-input"
              />
            </div>
          </div>
          <div className="po-filter-item">
            <label className="po-filter-label">&nbsp;</label>
            <button
              type="button"
              className="po-filter-reset-btn"
              onClick={() => {
                const nextFilters = { search: "", assignedTo: "", createdBy: "" };
                setFilters(nextFilters);
                loadTickets({ nextFilters });
              }}
              disabled={!filters.search}
            >
              <IconRefresh size={16} />
              Reset
            </button>
          </div>
          <div className="ticket-board-filter-actions">
            <Button type="button" variant="danger" onClick={exportPdf}>PDF</Button>
            <Button type="button" variant="success" onClick={exportExcel}>Excel</Button>
            <Button type="button" variant="primary" onClick={() => setShowForm(true)}>Create Ticket</Button>
          </div>
        </div>
      </div>
      {loading ? <p className="ticket-board-empty">Loading tickets...</p> : (
        <div
          className="ticket-board-columns"
          onDragOver={(event) => {
            event.preventDefault();
            const pending = pendingDrag.current;
            if (pending && !dragging) {
              const moved = Math.abs(event.clientX - pending.startX) + Math.abs(event.clientY - pending.startY) > 6;
              if (!moved) return;
              dragMoved.current = true;
              setDragging(pending);
              return;
            }
            if (!ghostRef.current) return;
            dragMoved.current = true;
            const ghost = ghostRef.current;
            ghost.style.left = `${event.clientX - Number(ghost.dataset.offsetX)}px`;
            ghost.style.top = `${event.clientY - Number(ghost.dataset.offsetY)}px`;
          }}
        >
          {COLUMNS.map((column) => {
            const cards = tickets.filter((ticket) => ticket.Status === column.status);
            return (
              <section
                key={column.status}
                className={`ticket-column ticket-column-${column.tone} ${overStatus === column.status ? "ticket-column-over" : ""}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (dragMoved.current && overStatus !== column.status) setOverStatus(column.status);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const ticketId = dragging?.ticket?.TicketId || Number(event.dataTransfer.getData("ticketId"));
                  setDragging(null);
                  setOverStatus("");
                  moveTicket(ticketId, column.status);
                }}
              >
                <header>
                  <span className="ticket-column-label"><i />{column.label}</span>
                  <strong>{totals[column.status] || 0}</strong>
                </header>
                <div className="ticket-column-list">
                  {cards.map((ticket) => (
                    <article
                      key={ticket.TicketId}
                      className={`ticket-card ${dragging?.ticket?.TicketId === ticket.TicketId ? "ticket-card-source" : ""}`}
                      draggable
                      onDragStart={(event) => {
                        dragMoved.current = false;
                        skipClick.current = false;
                        event.dataTransfer.setData("ticketId", String(ticket.TicketId));
                        event.dataTransfer.effectAllowed = "move";
                        if (blankDragImage.complete) event.dataTransfer.setDragImage(blankDragImage, 0, 0);
                        const rect = event.currentTarget.getBoundingClientRect();
                        pendingDrag.current = {
                          ticket,
                          tone: column.tone,
                          label: column.label,
                          x: rect.left,
                          y: rect.top,
                          startX: event.clientX,
                          startY: event.clientY,
                          offsetX: event.clientX - rect.left,
                          offsetY: event.clientY - rect.top,
                          width: rect.width,
                        };
                      }}
                      onDragEnd={() => {
                        pendingDrag.current = null;
                        skipClick.current = dragMoved.current;
                        setDragging(null);
                        setOverStatus("");
                      }}
                      onClick={() => {
                        if (skipClick.current) return;
                        openTicket(ticket.TicketId);
                      }}
                    >
                      <div className="ticket-card-meta">
                        <span className={`ticket-pill ticket-pill-${column.tone}`}>{column.label}</span>
                        <span>{ticket.TicketType}</span>
                      </div>
                      <h3>{ticket.TicketId} - {ticket.FirstName || "Employee"}</h3>
                      <p>{ticket.TicketDescription}</p>
                      <time>{formatStamp(ticket.CreatedAt)}</time>
                    </article>
                  ))}
                </div>
                {cards.length < (totals[column.status] || 0) && (
                  <button
                    type="button"
                    className="ticket-see-more"
                    disabled={loadingMore === column.status}
                    onClick={() => loadTickets({ status: column.status, offset: cards.length, append: true })}
                  >
                    {loadingMore === column.status ? "Loading..." : "See more"}
                  </button>
                )}
              </section>
            );
          })}
        </div>
      )}
      {dragging && (
        <article
          ref={(node) => {
            ghostRef.current = node;
            if (!node || node.dataset.placed) return;
            node.style.left = `${dragging.x}px`;
            node.style.top = `${dragging.y}px`;
            node.style.width = `${dragging.width}px`;
            node.dataset.offsetX = dragging.offsetX;
            node.dataset.offsetY = dragging.offsetY;
            node.dataset.placed = "1";
          }}
          className="ticket-card ticket-card-ghost"
        >
          <div className="ticket-card-meta">
            <span className={`ticket-pill ticket-pill-${dragging.tone}`}>{dragging.label}</span>
            <span>{dragging.ticket.TicketType}</span>
          </div>
          <h3>{dragging.ticket.TicketId} - {dragging.ticket.FirstName || "Employee"}</h3>
          <p>{dragging.ticket.TicketDescription}</p>
          <time>{formatStamp(dragging.ticket.CreatedAt)}</time>
        </article>
      )}
      {selected && (
        <GlobalPopup className="ticket-detail-popup" title={`Ticket ${selected.TicketId}`} onClose={() => setSelected(null)}>
          <div className="ticket-detail">
            <div className="ticket-detail-grid">
              <div>
                <span>Status</span>
                <strong>{selected.Status}</strong>
              </div>
              <div>
                <span>Created Date & Time</span>
                <strong>{formatStamp(selected.CreatedAt)}</strong>
              </div>
            </div>
            <div className="ticket-detail-split">
              <section>
                <h4>Created By</h4>
                <div><span>Employee</span><strong>{selected.FirstName || "—"}</strong></div>
              </section>
              <section>
                <h4>Assignment</h4>
                <label>
                  Assigned To
                  <select
                    value={selected.AssignedTo || ""}
                    onChange={(event) => changeAssignee(event.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {employees.map((employee) => (
                      <option key={employee.EmpID} value={employee.EmpID}>{employee.FirstName}</option>
                    ))}
                  </select>
                </label>
              </section>
            </div>
            <section className="ticket-detail-block">
              <h4>Description</h4>
              <p>{selected.TicketDescription}</p>
            </section>
            <section className="ticket-detail-block">
              <h4>Remarks History</h4>
              {(selected.remarks || []).length === 0 && <p className="ticket-muted">No remarks added yet.</p>}
              {(selected.remarks || []).map((item) => (
                <div key={item.RemarkId} className="ticket-remark">
                  <strong>{item.FirstName || "User"}</strong>
                  <span>{formatStamp(item.CreatedAt)}</span>
                  <p>{item.Remark}</p>
                </div>
              ))}
              <textarea
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                placeholder="Type a new remark here..."
                rows={4}
              />
              <div className="ticket-remark-actions">
                <Button type="button" variant="primary" isLoading={savingRemark} onClick={submitRemark}>
                  Add Remark
                </Button>
              </div>
            </section>
          </div>
        </GlobalPopup>
      )}
      {showForm && (
        <GlobalPopup className="tickets-popup" title="Create IT Support Request" onClose={() => setShowForm(false)} showClose={false}>
          <form className="tickets-form" onSubmit={createTicket}>
            <div className="tickets-form-head">
              <h3>Create IT Support Request</h3>
              <button type="button" className="tickets-form-close" onClick={() => setShowForm(false)} aria-label="Close">×</button>
            </div>
            <div className="tickets-form-body">
              <label className="tickets-field">
                <span>Employee Name</span>
                <input value={employeeName} disabled />
              </label>
              <label className="tickets-field">
                <span>Ticket Type</span>
                <input value={ticketType} disabled />
              </label>
              <label className="tickets-field">
                <span>Description <em>*</em></span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe your issue or request in detail..."
                  rows={6}
                  required
                />
              </label>
            </div>
            <div className="tickets-form-actions">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={savingTicket}>
                <IconSend size={15} />
                Submit Ticket
              </Button>
            </div>
          </form>
        </GlobalPopup>
      )}
    </div>
  );
};

export default TicketBoard;
