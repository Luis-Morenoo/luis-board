import { useState, useEffect } from "react";
import { auth, provider, db, OWNER_EMAIL } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, serverTimestamp,
} from "firebase/firestore";

// ─── Constants ────────────────────────────────────────────────────────────────

const COLUMNS = [
  { id: "backlog",     label: "Backlog",     color: "#6B7280" },
  { id: "todo",       label: "To Do",        color: "#3B82F6" },
  { id: "inprogress", label: "In Progress",  color: "#F59E0B" },
  { id: "done",       label: "Done",         color: "#10B981" },
];

const PRIORITIES = [
  { id: "low",    label: "Low",    color: "#6B7280" },
  { id: "medium", label: "Medium", color: "#F59E0B" },
  { id: "high",   label: "High",   color: "#EF4444" },
];

const TAGS = ["Job Search", "Study", "Personal", "ASU", "Finance", "Other"];
const ticketsCol = collection(db, "tickets");

// ─── Hook: screen size ────────────────────────────────────────────────────────

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function PriorityBadge({ priority }) {
  const p = PRIORITIES.find((x) => x.id === priority) || PRIORITIES[1];
  return (
    <span style={{
      fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em",
      textTransform: "uppercase", color: p.color,
      border: `1px solid ${p.color}`, borderRadius: "4px", padding: "2px 7px",
    }}>
      {p.label}
    </span>
  );
}

function TagBadge({ tag }) {
  return (
    <span style={{
      fontSize: "11px", fontWeight: 600, color: "#94A3B8",
      background: "#1E293B", borderRadius: "4px", padding: "2px 8px",
    }}>
      {tag}
    </span>
  );
}

function VisibilityBadge({ visibility }) {
  const isPublic = visibility === "public";
  return (
    <span style={{
      fontSize: "11px", fontWeight: 600,
      color: isPublic ? "#10B981" : "#F59E0B",
      background: isPublic ? "#052e16" : "#1c1007",
      border: `1px solid ${isPublic ? "#10B981" : "#F59E0B"}`,
      borderRadius: "4px", padding: "2px 8px",
    }}>
      {isPublic ? "🌐 Public" : "🔒 Private"}
    </span>
  );
}

// ─── Ticket Card ──────────────────────────────────────────────────────────────

function TicketCard({ ticket, onEdit, onDelete, onMove, readOnly }) {
  const currentIdx = COLUMNS.findIndex((c) => c.id === ticket.status);
  return (
    <div style={{
      background: "#0F172A", border: "1px solid #1E293B", borderRadius: "12px",
      padding: "16px", marginBottom: "12px",
      transition: "border-color 0.15s",
    }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = "#334155"}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = "#1E293B"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <p style={{
          margin: 0, fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
          fontSize: "15px", color: "#E2E8F0", lineHeight: 1.4, flex: 1,
        }}>
          {ticket.title}
        </p>
        {!readOnly && (
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button onClick={() => onEdit(ticket)}
              style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "8px", cursor: "pointer", color: "#94A3B8", fontSize: "16px", padding: "6px 10px", lineHeight: 1 }}>
              ✏️
            </button>
            <button onClick={() => onDelete(ticket.id)}
              style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "8px", cursor: "pointer", color: "#94A3B8", fontSize: "16px", padding: "6px 10px", lineHeight: 1 }}>
              🗑️
            </button>
          </div>
        )}
      </div>

      {ticket.description && (
        <p style={{ margin: "8px 0 12px", fontSize: "13px", color: "#64748B", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
          {ticket.description}
        </p>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        <PriorityBadge priority={ticket.priority} />
        {ticket.tag && <TagBadge tag={ticket.tag} />}
        {!readOnly && <VisibilityBadge visibility={ticket.visibility || "private"} />}
      </div>

      {!readOnly && (
        <div style={{ display: "flex", gap: 8 }}>
          {currentIdx > 0 && (
            <button onClick={() => onMove(ticket.id, COLUMNS[currentIdx - 1].id)}
              style={{ flex: 1, padding: "8px", background: "#1E293B", border: "1px solid #334155", borderRadius: "8px", color: "#94A3B8", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "12px" }}>
              ← {COLUMNS[currentIdx - 1].label}
            </button>
          )}
          {currentIdx < COLUMNS.length - 1 && (
            <button onClick={() => onMove(ticket.id, COLUMNS[currentIdx + 1].id)}
              style={{ flex: 1, padding: "8px", background: "#1E293B", border: "1px solid #334155", borderRadius: "8px", color: "#94A3B8", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "12px" }}>
              {COLUMNS[currentIdx + 1].label} →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ ticket, onSave, onClose, saving }) {
  const [form, setForm] = useState(
    ticket || { title: "", description: "", status: "todo", priority: "medium", tag: "Personal", visibility: "private" }
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000, padding: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#0F172A", border: "1px solid #1E293B",
        borderRadius: "20px 20px 0 0", padding: "24px 20px 36px",
        width: "100%", maxWidth: "600px", fontFamily: "'DM Sans', sans-serif",
        maxHeight: "92vh", overflowY: "auto",
      }}>
        {/* Drag handle */}
        <div style={{ width: 40, height: 4, background: "#334155", borderRadius: 2, margin: "0 auto 20px" }} />

        <h2 style={{ margin: "0 0 20px", color: "#E2E8F0", fontSize: "20px", fontWeight: 700 }}>
          {ticket?.id ? "Edit Ticket" : "New Ticket"}
        </h2>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748B", marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>Title *</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="What needs to be done?"
            style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: "10px", color: "#E2E8F0", padding: "12px 14px", fontSize: "15px", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", outline: "none" }} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748B", marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional details..." rows={3}
            style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: "10px", color: "#E2E8F0", padding: "12px 14px", fontSize: "15px", fontFamily: "'DM Sans', sans-serif", resize: "vertical", boxSizing: "border-box", outline: "none" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Status",   key: "status",   options: COLUMNS.map((c) => ({ value: c.id, label: c.label })) },
            { label: "Priority", key: "priority", options: PRIORITIES.map((p) => ({ value: p.id, label: p.label })) },
            { label: "Tag",      key: "tag",      options: TAGS.map((t) => ({ value: t, label: t })) },
          ].map(({ label, key, options }) => (
            <div key={key}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748B", marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</label>
              <select value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: "10px", color: "#E2E8F0", padding: "10px 8px", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", outline: "none" }}>
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* Visibility Toggle */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748B", marginBottom: 8, letterSpacing: "0.08em", textTransform: "uppercase" }}>Visibility</label>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { value: "private", label: "🔒 Private", desc: "Only you can see this" },
              { value: "public",  label: "🌐 Public",  desc: "Visible on read-only link" },
            ].map((opt) => (
              <button key={opt.value} onClick={() => setForm({ ...form, visibility: opt.value })}
                style={{
                  flex: 1, padding: "12px", borderRadius: "10px", cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", textAlign: "left",
                  background: form.visibility === opt.value ? "#1E293B" : "transparent",
                  border: `1px solid ${form.visibility === opt.value ? (opt.value === "public" ? "#10B981" : "#F59E0B") : "#334155"}`,
                }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#E2E8F0", marginBottom: 2 }}>{opt.label}</div>
                <div style={{ fontSize: "11px", color: "#64748B" }}>{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: "14px", background: "none", border: "1px solid #334155", borderRadius: "10px", color: "#94A3B8", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "15px" }}>
            Cancel
          </button>
          <button onClick={() => form.title.trim() && onSave(form)} disabled={saving}
            style={{ flex: 2, padding: "14px", background: saving ? "#1D4ED8" : "#3B82F6", border: "none", borderRadius: "10px", color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "15px", fontWeight: 700 }}>
            {saving ? "Saving..." : ticket?.id ? "Save Changes" : "Create Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Board ────────────────────────────────────────────────────────────────────

function Board({ readOnly, user, onSignOut }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null);
  const [filter, setFilter] = useState("all");
  const [collapsed, setCollapsed] = useState({});
  const isMobile = useIsMobile();

  useEffect(() => {
    const unsub = onSnapshot(ticketsCol, (snap) => {
      setTickets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const saveTicket = async (form) => {
    setSaving(true);
    try {
      if (form.id) {
        const { id, ...rest } = form;
        await updateDoc(doc(db, "tickets", id), { ...rest, updatedAt: serverTimestamp() });
      } else {
        await addDoc(ticketsCol, { ...form, createdAt: serverTimestamp() });
      }
      setModal(null);
    } catch (err) {
      alert("Error saving: " + err.message);
    }
    setSaving(false);
  };

  const deleteTicket = async (id) => {
    if (!window.confirm("Delete this ticket?")) return;
    await deleteDoc(doc(db, "tickets", id));
  };

  const moveTicket = async (id, newStatus) => {
    await updateDoc(doc(db, "tickets", id), { status: newStatus, updatedAt: serverTimestamp() });
  };

  const toggleCollapse = (colId) => {
    setCollapsed((prev) => ({ ...prev, [colId]: !prev[colId] }));
  };

  const byTag = filter === "all" ? tickets : tickets.filter((t) => t.tag === filter);
  const visible = readOnly ? byTag.filter((t) => (t.visibility || "private") === "public") : byTag;
  const totalPublic = tickets.filter((t) => (t.visibility || "private") === "public").length;

  return (
    <div style={{ minHeight: "100vh", background: "#020617", fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1E293B", padding: isMobile ? "14px 16px" : "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#020617", zIndex: 100 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: isMobile ? "18px" : "20px", fontWeight: 700, color: "#E2E8F0", letterSpacing: "-0.3px" }}>
            📋 Luis's Board
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#475569" }}>
            {loading ? "Connecting..." : readOnly
              ? `${totalPublic} public ticket${totalPublic !== 1 ? "s" : ""} · 👁 Read-only`
              : `${tickets.length} ticket${tickets.length !== 1 ? "s" : ""} · ✏️ Owner`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {!readOnly && (
            <button onClick={() => setModal("new")}
              style={{ background: "#3B82F6", border: "none", borderRadius: "10px", color: "#fff", padding: isMobile ? "10px 14px" : "10px 18px", fontSize: isMobile ? "13px" : "14px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
              + New
            </button>
          )}
          {user && (
            <button onClick={onSignOut}
              style={{ background: "none", border: "1px solid #1E293B", borderRadius: "10px", color: "#64748B", padding: "9px 12px", fontSize: "12px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>
              Sign out
            </button>
          )}
        </div>
      </div>

      {/* Read-only banner */}
      {readOnly && (
        <div style={{ background: "#0F172A", borderBottom: "1px solid #1E293B", padding: "10px 16px", textAlign: "center", fontSize: "12px", color: "#475569" }}>
          👁 Read-only view · Only public tickets shown
        </div>
      )}

      {/* Tag Filter */}
      <div style={{ padding: isMobile ? "12px 16px 0" : "14px 24px 0", display: "flex", gap: 8, overflowX: "auto", paddingBottom: 0 }}>
        {["all", ...TAGS].map((tag) => (
          <button key={tag} onClick={() => setFilter(tag)}
            style={{ padding: "6px 14px", borderRadius: "20px", border: "1px solid", borderColor: filter === tag ? "#3B82F6" : "#1E293B", background: filter === tag ? "#1D4ED8" : "transparent", color: filter === tag ? "#fff" : "#64748B", fontSize: "12px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif" }}>
            {tag === "all" ? "All" : tag}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "80px 24px", color: "#475569", fontSize: "14px" }}>
          Loading your board...
        </div>
      )}

      {!loading && readOnly && totalPublic === 0 && (
        <div style={{ textAlign: "center", padding: "80px 24px", color: "#475569", fontSize: "14px" }}>
          No public tickets yet.
        </div>
      )}

      {/* Board — single column on mobile, 4-col grid on desktop */}
      {!loading && (!readOnly || totalPublic > 0) && (
        <div style={{
          display: isMobile ? "flex" : "grid",
          flexDirection: isMobile ? "column" : undefined,
          gridTemplateColumns: isMobile ? undefined : "repeat(4, minmax(220px, 1fr))",
          gap: "12px",
          padding: isMobile ? "16px" : "20px 24px 40px",
        }}>
          {COLUMNS.map((col) => {
            const colTickets = visible
              .filter((t) => t.status === col.id)
              .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]));
            const isCollapsed = collapsed[col.id];

            return (
              <div key={col.id} style={{
                background: isMobile ? "#080F1E" : "transparent",
                borderRadius: isMobile ? "14px" : 0,
                border: isMobile ? "1px solid #1E293B" : "none",
                overflow: "hidden",
              }}>
                {/* Column Header — tappable on mobile */}
                <div
                  onClick={() => isMobile && toggleCollapse(col.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: isMobile ? "14px 16px" : "0 2px 12px",
                    cursor: isMobile ? "pointer" : "default",
                    borderBottom: isMobile && !isCollapsed ? "1px solid #1E293B" : "none",
                  }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.color, flexShrink: 0 }} />
                  <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748B", flex: 1 }}>
                    {col.label}
                  </span>
                  <span style={{ background: "#1E293B", color: "#64748B", borderRadius: "10px", padding: "2px 8px", fontSize: "12px", fontWeight: 700 }}>
                    {colTickets.length}
                  </span>
                  {isMobile && (
                    <span style={{ color: "#475569", fontSize: "14px", marginLeft: 4 }}>
                      {isCollapsed ? "▶" : "▼"}
                    </span>
                  )}
                </div>

                {/* Tickets */}
                {!isCollapsed && (
                  <div style={{ padding: isMobile ? "12px" : 0, minHeight: isMobile ? 0 : "80px" }}>
                    {colTickets.length === 0 ? (
                      <div style={{ border: "1px dashed #1E293B", borderRadius: "10px", padding: "20px 16px", textAlign: "center", color: "#334155", fontSize: "12px" }}>
                        No tickets
                      </div>
                    ) : (
                      colTickets.map((ticket) => (
                        <TicketCard key={ticket.id} ticket={ticket}
                          onEdit={setModal} onDelete={deleteTicket} onMove={moveTicket}
                          readOnly={readOnly} />
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal && !readOnly && (
        <Modal ticket={modal === "new" ? null : modal} onSave={saveTicket} onClose={() => setModal(null)} saving={saving} />
      )}
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin, error }) {
  return (
    <div style={{ minHeight: "100vh", background: "#020617", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", padding: 24 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center", width: "100%", maxWidth: 400 }}>
        <div style={{ fontSize: "56px", marginBottom: 16 }}>📋</div>
        <h1 style={{ color: "#E2E8F0", fontSize: "32px", fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.5px" }}>
          Luis's Board
        </h1>
        <p style={{ color: "#475569", fontSize: "15px", marginBottom: 36 }}>
          Sign in to manage your tickets
        </p>
        {error && (
          <p style={{ color: "#EF4444", fontSize: "13px", marginBottom: 16, background: "#1E293B", padding: "12px 16px", borderRadius: 10 }}>
            {error}
          </p>
        )}
        <button onClick={onLogin}
          style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#fff", border: "none", borderRadius: "12px", padding: "15px 28px", fontSize: "16px", fontWeight: 600, cursor: "pointer", color: "#1E293B", fontFamily: "'DM Sans', sans-serif", width: "100%", justifyContent: "center" }}>
          <img src="https://www.google.com/favicon.ico" width={20} height={20} alt="Google" />
          Continue with Google
        </button>
        <p style={{ color: "#334155", fontSize: "12px", marginTop: 20 }}>
          Only authorized accounts can sign in
        </p>
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState(undefined);
  const [authError, setAuthError] = useState("");
  const isReadOnly = window.location.hash === "#/view";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    setAuthError("");
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user.email !== OWNER_EMAIL) {
        await signOut(auth);
        setAuthError("Access restricted to the board owner.");
      }
    } catch (err) {
      setAuthError("Sign-in failed. Please try again.");
    }
  };

  if (isReadOnly) return <Board readOnly={true} user={null} onSignOut={null} />;

  if (user === undefined) return (
    <div style={{ minHeight: "100vh", background: "#020617", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#475569", fontFamily: "'DM Sans', sans-serif" }}>Loading...</p>
    </div>
  );

  if (!user) return <LoginScreen onLogin={handleLogin} error={authError} />;
  if (user.email !== OWNER_EMAIL) return <LoginScreen onLogin={handleLogin} error="Access restricted to the board owner." />;

  return <Board readOnly={false} user={user} onSignOut={() => signOut(auth)} />;
}