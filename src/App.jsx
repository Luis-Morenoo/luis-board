import { useState, useEffect } from "react";
import { auth, provider, db, OWNER_EMAIL } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
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

// ─── Badges ───────────────────────────────────────────────────────────────────

function PriorityBadge({ priority }) {
  const p = PRIORITIES.find((x) => x.id === priority) || PRIORITIES[1];
  return (
    <span style={{
      fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
      textTransform: "uppercase", color: p.color,
      border: `1px solid ${p.color}`, borderRadius: "4px", padding: "1px 6px",
    }}>
      {p.label}
    </span>
  );
}

function TagBadge({ tag }) {
  return (
    <span style={{
      fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em",
      color: "#94A3B8", background: "#1E293B", borderRadius: "4px", padding: "2px 7px",
    }}>
      {tag}
    </span>
  );
}

function VisibilityBadge({ visibility }) {
  const isPublic = visibility === "public";
  return (
    <span style={{
      fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em",
      color: isPublic ? "#10B981" : "#F59E0B",
      background: isPublic ? "#052e16" : "#1c1007",
      border: `1px solid ${isPublic ? "#10B981" : "#F59E0B"}`,
      borderRadius: "4px", padding: "2px 7px",
    }}>
      {isPublic ? "🌐 Public" : "🔒 Private"}
    </span>
  );
}

// ─── Ticket Card ──────────────────────────────────────────────────────────────

function TicketCard({ ticket, onEdit, onDelete, onMove, readOnly }) {
  const currentIdx = COLUMNS.findIndex((c) => c.id === ticket.status);
  return (
    <div
      style={{
        background: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px",
        padding: "14px", marginBottom: "10px", transition: "border-color 0.15s, transform 0.1s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1E293B"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: "13.5px", color: "#E2E8F0", lineHeight: 1.4, flex: 1 }}>
          {ticket.title}
        </p>
        {!readOnly && (
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            <button onClick={() => onEdit(ticket)} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", fontSize: "13px", padding: "2px 4px" }} title="Edit">✏️</button>
            <button onClick={() => onDelete(ticket.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", fontSize: "13px", padding: "2px 4px" }} title="Delete">🗑️</button>
          </div>
        )}
      </div>

      {ticket.description && (
        <p style={{ margin: "6px 0 10px", fontSize: "12px", color: "#64748B", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
          {ticket.description}
        </p>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <PriorityBadge priority={ticket.priority} />
        {ticket.tag && <TagBadge tag={ticket.tag} />}
        {!readOnly && <VisibilityBadge visibility={ticket.visibility || "private"} />}
      </div>

      {!readOnly && (
        <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
          {currentIdx > 0 && (
            <button onClick={() => onMove(ticket.id, COLUMNS[currentIdx - 1].id)}
              style={{ fontSize: "10px", padding: "3px 8px", background: "#1E293B", border: "1px solid #334155", borderRadius: "5px", color: "#94A3B8", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              ← {COLUMNS[currentIdx - 1].label}
            </button>
          )}
          {currentIdx < COLUMNS.length - 1 && (
            <button onClick={() => onMove(ticket.id, COLUMNS[currentIdx + 1].id)}
              style={{ fontSize: "10px", padding: "3px 8px", background: "#1E293B", border: "1px solid #334155", borderRadius: "5px", color: "#94A3B8", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
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

  const textField = (label, key, type, placeholder) => (
    <div key={key} style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748B", marginBottom: 5, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </label>
      {type === "textarea" ? (
        <textarea value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={placeholder} rows={3}
          style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: "8px", color: "#E2E8F0", padding: "10px 12px", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", resize: "vertical", boxSizing: "border-box", outline: "none" }} />
      ) : (
        <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={placeholder}
          style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: "8px", color: "#E2E8F0", padding: "10px 12px", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", outline: "none" }} />
      )}
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: "14px", padding: "28px", width: "100%", maxWidth: "480px", fontFamily: "'DM Sans', sans-serif" }}>
        <h2 style={{ margin: "0 0 20px", color: "#E2E8F0", fontSize: "18px", fontWeight: 700 }}>
          {ticket?.id ? "Edit Ticket" : "New Ticket"}
        </h2>

        {textField("Title *", "title", "text", "What needs to be done?")}
        {textField("Description", "description", "textarea", "Optional details...")}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
          {[
            { label: "Status",   key: "status",   options: COLUMNS.map((c) => ({ value: c.id, label: c.label })) },
            { label: "Priority", key: "priority", options: PRIORITIES.map((p) => ({ value: p.id, label: p.label })) },
            { label: "Tag",      key: "tag",      options: TAGS.map((t) => ({ value: t, label: t })) },
          ].map(({ label, key, options }) => (
            <div key={key}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748B", marginBottom: 5, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {label}
              </label>
              <select value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: "8px", color: "#E2E8F0", padding: "9px 10px", fontSize: "12px", fontFamily: "'DM Sans', sans-serif", outline: "none" }}>
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* Visibility Toggle */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748B", marginBottom: 8, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Visibility
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { value: "private", label: "🔒 Private", desc: "Only you can see this" },
              { value: "public",  label: "🌐 Public",  desc: "Visible on read-only link" },
            ].map((opt) => (
              <button key={opt.value} onClick={() => setForm({ ...form, visibility: opt.value })}
                style={{
                  flex: 1, padding: "10px 12px", borderRadius: "8px", cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", textAlign: "left", transition: "all 0.15s",
                  background: form.visibility === opt.value ? "#1E293B" : "transparent",
                  border: `1px solid ${form.visibility === opt.value ? (opt.value === "public" ? "#10B981" : "#F59E0B") : "#334155"}`,
                }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#E2E8F0", marginBottom: 2 }}>{opt.label}</div>
                <div style={{ fontSize: "10px", color: "#64748B" }}>{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", background: "none", border: "1px solid #334155", borderRadius: "8px", color: "#94A3B8", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "13px" }}>
            Cancel
          </button>
          <button onClick={() => form.title.trim() && onSave(form)} disabled={saving}
            style={{ padding: "9px 18px", background: saving ? "#1D4ED8" : "#3B82F6", border: "none", borderRadius: "8px", color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "13px", fontWeight: 600 }}>
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

  const byTag = filter === "all" ? tickets : tickets.filter((t) => t.tag === filter);
  const visible = readOnly ? byTag.filter((t) => (t.visibility || "private") === "public") : byTag;
  const totalPublic = tickets.filter((t) => (t.visibility || "private") === "public").length;

  return (
    <div style={{ minHeight: "100vh", background: "#020617", fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1E293B", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#020617", zIndex: 100 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#E2E8F0", letterSpacing: "-0.3px" }}>
            📋 Luis's Board
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#475569" }}>
            {loading
              ? "Connecting..."
              : readOnly
              ? `${totalPublic} public ticket${totalPublic !== 1 ? "s" : ""} · 👁 Read-only view`
              : `${tickets.length} ticket${tickets.length !== 1 ? "s" : ""} · ✏️ Owner view`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {!readOnly && (
            <button onClick={() => setModal("new")}
              style={{ background: "#3B82F6", border: "none", borderRadius: "9px", color: "#fff", padding: "10px 18px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
              + New Ticket
            </button>
          )}
          {user && (
            <button onClick={onSignOut}
              style={{ background: "none", border: "1px solid #1E293B", borderRadius: "9px", color: "#64748B", padding: "9px 14px", fontSize: "12px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Sign out
            </button>
          )}
        </div>
      </div>

      {/* Read-only banner */}
      {readOnly && (
        <div style={{ background: "#0F172A", borderBottom: "1px solid #1E293B", padding: "10px 24px", textAlign: "center", fontSize: "12px", color: "#475569" }}>
          👁 You're viewing a read-only snapshot of Luis's board · Only public tickets are shown
        </div>
      )}

      {/* Tag Filter */}
      <div style={{ padding: "14px 24px 0", display: "flex", gap: 8, overflowX: "auto" }}>
        {["all", ...TAGS].map((tag) => (
          <button key={tag} onClick={() => setFilter(tag)}
            style={{ padding: "5px 12px", borderRadius: "20px", border: "1px solid", borderColor: filter === tag ? "#3B82F6" : "#1E293B", background: filter === tag ? "#1D4ED8" : "transparent", color: filter === tag ? "#fff" : "#64748B", fontSize: "11px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif" }}>
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

      {!loading && (!readOnly || totalPublic > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(220px, 1fr))", gap: "16px", padding: "20px 24px 40px", overflowX: "auto" }}>
          {COLUMNS.map((col) => {
            const colTickets = visible
              .filter((t) => t.status === col.id)
              .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]));
            return (
              <div key={col.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "12px" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.color, flexShrink: 0 }} />
                  <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748B" }}>
                    {col.label}
                  </span>
                  <span style={{ marginLeft: "auto", background: "#1E293B", color: "#64748B", borderRadius: "10px", padding: "1px 7px", fontSize: "11px", fontWeight: 700 }}>
                    {colTickets.length}
                  </span>
                </div>
                <div style={{ minHeight: "100px" }}>
                  {colTickets.length === 0 ? (
                    <div style={{ border: "1px dashed #1E293B", borderRadius: "10px", padding: "28px 16px", textAlign: "center", color: "#334155", fontSize: "12px" }}>
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
    <div style={{ minHeight: "100vh", background: "#020617", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: "48px", marginBottom: 16 }}>📋</div>
        <h1 style={{ color: "#E2E8F0", fontSize: "28px", fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.5px" }}>
          Luis's Board
        </h1>
        <p style={{ color: "#475569", fontSize: "14px", marginBottom: 32 }}>
          Sign in to manage your tickets
        </p>
        {error && (
          <p style={{ color: "#EF4444", fontSize: "13px", marginBottom: 16, background: "#1E293B", padding: "10px 16px", borderRadius: 8 }}>
            {error}
          </p>
        )}
        <button onClick={onLogin}
          style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#fff", border: "none", borderRadius: "10px", padding: "13px 24px", fontSize: "14px", fontWeight: 600, cursor: "pointer", color: "#1E293B", fontFamily: "'DM Sans', sans-serif" }}>
          <img src="https://www.google.com/favicon.ico" width={18} height={18} alt="Google" />
          Continue with Google
        </button>
        <p style={{ color: "#334155", fontSize: "11px", marginTop: 20 }}>
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

  const handleSignOut = () => signOut(auth);

  if (isReadOnly) return <Board readOnly={true} user={null} onSignOut={null} />;

  if (user === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: "#020617", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#475569", fontFamily: "'DM Sans', sans-serif" }}>Loading...</p>
      </div>
    );
  }

  if (!user) return <LoginScreen onLogin={handleLogin} error={authError} />;
  if (user.email !== OWNER_EMAIL) return <LoginScreen onLogin={handleLogin} error="Access restricted to the board owner." />;

  return <Board readOnly={false} user={user} onSignOut={handleSignOut} />;
}