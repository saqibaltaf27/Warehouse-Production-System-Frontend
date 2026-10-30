import { useEffect, useState } from "react";
import Table from "../../global-components/Table/Table";
import Button from "../../global-components/Button/Button";
import GlobalPopup from "../../global-components/GlobalPopup/GlobalPopup";
import { IconSend } from "@tabler/icons-react";
import { useAuth } from "../../context/AuthContext";
import { ticketsApi } from "../../apis/tickets/tickets";
import { formatDisplayDate } from "../../util/text/datetimeformat";
import "./Tickets.css";

const ExpandableText = ({ text = "", maxLength = 40 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!text || text.length <= maxLength) return <span className="tickets-desc">{text}</span>;
  return (
    <span className="tickets-desc">
      {isExpanded ? text : `${text.slice(0, maxLength)}...`}
      <button
        type="button"
        className="tickets-see-toggle"
        onClick={() => setIsExpanded((current) => !current)}
      >
        {isExpanded ? "See Less" : "See More"}
      </button>
    </span>
  );
};

const statusClass = (status) => {
  const value = String(status || "").toLowerCase().replace(/\s+/g, "");
  if (value === "inprocess") return "tickets-status tickets-status-progress";
  if (value === "closed") return "tickets-status tickets-status-closed";
  return "tickets-status tickets-status-pending";
};

const Tickets = () => {
  const { user } = useAuth();
  const employeeName = user?.FirstName || user?.firstName || "";
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ department: "Quality", description: "" });

  const columns = [
    { header: "Ticket No", key: "ticketNo" },
    { header: "Employee", key: "employeeName" },
    {
      header: "Description",
      key: "description",
      className: "tickets-desc-col",
      width: "320px",
      render: (row) => <ExpandableText text={row.description} />,
    },
    {
      header: "Status",
      key: "status",
      render: (row) => <span className={statusClass(row.status)}>{row.status}</span>,
    },
    { header: "Date", key: "date", render: (row) => formatDisplayDate(row.date) },
  ];

  const loadTickets = async () => {
    setLoading(true);
    try {
      const response = await ticketsApi.getTickets();
      const rows = (response?.data || []).map((row) => ({
        ticketNo: row.TicketId,
        employeeName: row.FirstName || "",
        empId: row.EmpId,
        department: row.TicketType,
        description: row.TicketDescription || "",
        status: row.Status,
        date: row.CreatedAt,
      }));
      setTickets(rows);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const closeForm = () => {
    setShowForm(false);
    setForm({ department: "Quality", description: "" });
  };

  const createTicket = async (event) => {
    event.preventDefault();
    if (!form.description.trim()) return;
    setSaving(true);
    setError("");
    try {
      await ticketsApi.createTicket({
        ticketType: form.department,
        description: form.description.trim(),
      });
      closeForm();
      await loadTickets();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create ticket");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tickets-page">
      <div className="tickets-toolbar">
        <h2 className="tickets-title">Tickets</h2>
        <Button variant="primary" onClick={() => setShowForm(true)}>Create</Button>
      </div>
      <Table
        data={tickets}
        columns={columns}
        totalEntries={tickets.length}
        isLoading={loading}
        showActions={false}
        showPagination={false}
      />
      {error && <p className="tickets-error">{error}</p>}
      {showForm && (
        <GlobalPopup className="tickets-popup" title="Create IT Support Request" onClose={closeForm} showClose={false}>
          <form className="tickets-form" onSubmit={createTicket}>
            <div className="tickets-form-head">
              <h3>Create IT Support Request</h3>
              <button type="button" className="tickets-form-close" onClick={closeForm} aria-label="Close">×</button>
            </div>
            <div className="tickets-form-body">
              <label className="tickets-field">
                <span>Employee Name</span>
                <input value={employeeName} disabled />
              </label>
              <label className="tickets-field">
                <span>Department <em>*</em></span>
                <select
                  value={form.department}
                  onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}
                >
                  <option value="Quality">Quality</option>
                  <option value="Production">Production</option>
                  <option value="Engineering">Engineering</option>
                </select>
              </label>
              <label className="tickets-field">
                <span>Description <em>*</em></span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Describe your issue or request in detail..."
                  rows={6}
                  required
                />
              </label>
            </div>
            <div className="tickets-form-actions">
              <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={saving}>
                <IconSend size={15} />
                {saving ? "Saving..." : "Submit Ticket"}
              </Button>
            </div>
          </form>
        </GlobalPopup>
      )}
    </div>
  );
};

export default Tickets;
