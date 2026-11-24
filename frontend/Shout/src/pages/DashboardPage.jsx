import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./DashboardPage.css";

const NOTE_COLORS = ["#ffffff","#fff0f0","#fff8e1","#f0fff4","#f0f4ff","#fdf0ff"];
const COLOR_LABELS = ["White","Rose","Yellow","Mint","Sky","Lavender"];

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

function salutation(name) {
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : "there";
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(false);
  const [userName, setUserName] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [editNote, setEditNote] = useState(null);
  const [form, setForm] = useState({ title: "", content: "", color: "#ffffff" });
  const [saving, setSaving] = useState(false);
  const [greeting, setGreeting] = useState("Good morning");

  const token = localStorage.getItem("token");

  // Block browser back button — logout on back
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePop = () => {
      localStorage.clear();
      navigate("/login", { replace: true });
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [navigate]);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    setUserName(localStorage.getItem("userName") || "");
    const h = new Date().getHours();
    if (h >= 12 && h < 17) setGreeting("Good afternoon");
    else if (h >= 17) setGreeting("Good evening");
    fetchNotes();
  }, []);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/notes", { headers: { authorization: token } });
      setNotes(res.data.notes || []);
    } catch { setNotes([]); }
    setLoading(false);
  }, [token]);

  const openNew = () => {
    setEditNote(null);
    setForm({ title: "", content: "", color: "#ffffff" });
    setShowEditor(true);
  };

  const openEdit = (note) => {
    setEditNote(note);
    setForm({ title: note.title, content: note.content, color: note.color || "#ffffff" });
    setShowEditor(true);
  };

  const saveNote = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (editNote) {
        await axios.put(`/notes/${editNote._id}`, form, { headers: { authorization: token } });
      } else {
        await axios.post("/notes", form, { headers: { authorization: token } });
      }
      await fetchNotes();
      setShowEditor(false);
    } catch {}
    setSaving(false);
  };

  const deleteNote = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`/notes/${id}`, { headers: { authorization: token } });
      setNotes(prev => prev.filter(n => n._id !== id));
    } catch {}
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <div className={`dash-page${dark ? " dark" : ""}`}>

      <div className="dash-blobs">
        <div className="db db-1"></div>
        <div className="db db-2"></div>
        <div className="db db-3"></div>
      </div>

      <nav className="dash-nav">
        <div className="dash-logo">
          <svg viewBox="0 0 44 44" width="34" height="34">
            <rect width="44" height="44" rx="10" fill="#e53935"/>
            <text x="10" y="34" fontFamily="Georgia,serif" fontSize="28" fontWeight="bold" fill="white">S</text>
          </svg>
          <span className="dash-logo-name"><span style={{color:"#e53935"}}>Shout</span>Hub</span>
        </div>
        <div className="dash-nav-right">
          <button className="theme-toggle" onClick={() => setDark(!dark)} aria-label="Toggle theme">
            {dark ? (
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.8"/>
                <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          <div className="dash-avatar">{userName.charAt(0).toUpperCase() || "U"}</div>
          <button className="dash-logout" onClick={logout}>Sign out</button>
        </div>
      </nav>

      <div className="dash-content">
        <div className="dash-welcome-block">
          <p className="dash-greeting">{greeting},</p>
          <h1 className="dash-username">Mr. <span>{salutation(userName)}</span></h1>
          <p className="dash-tagline">Here are your notes. Pick up where you left off.</p>
        </div>

        <div className="dash-stats">
          <div className="dash-stat">
            <span className="ds-val">{notes.length}</span>
            <span className="ds-label">Total Notes</span>
          </div>
          <div className="dash-stat">
            <span className="ds-val">{notes.filter(n => (Date.now() - new Date(n.updatedAt)) < 86400000).length}</span>
            <span className="ds-label">Updated Today</span>
          </div>
          <div className="dash-stat">
            <span className="ds-val">{notes.length > 0 ? timeAgo(notes[0].updatedAt) : "—"}</span>
            <span className="ds-label">Last Activity</span>
          </div>
        </div>

        <div className="notes-header">
          <h2 className="notes-title">Your Notes</h2>
          <button className="new-note-btn" onClick={openNew}>
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
              <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            New Note
          </button>
        </div>

        {loading ? (
          <div className="notes-loading">
            <div className="nl-spinner"></div>
            <p>Loading your notes...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="notes-empty">
            <svg viewBox="0 0 64 64" fill="none" width="56" height="56">
              <rect x="8" y="8" width="48" height="56" rx="6" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="18" y1="24" x2="46" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="18" y1="32" x2="46" y2="32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="18" y1="40" x2="34" y2="40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p>No notes yet. Create your first one!</p>
            <button className="new-note-btn" onClick={openNew}>Start Writing</button>
          </div>
        ) : (
          <div className="notes-grid">
            {notes.map(note => (
              <div
                key={note._id}
                className="note-card"
                style={{ backgroundColor: note.color || "#ffffff" }}
                onClick={() => openEdit(note)}
              >
                <div className="nc-top">
                  <h3 className="nc-title">{note.title}</h3>
                  <button className="nc-delete" onClick={(e) => deleteNote(note._id, e)}>
                    <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
                      <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                      <path d="M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                      <path d="M9 6V4h6v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                <p className="nc-content">{note.content || "No content"}</p>
                <span className="nc-time">{timeAgo(note.updatedAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showEditor && (
        <div className="editor-overlay" onClick={() => setShowEditor(false)}>
          <div className="editor-modal" style={{ backgroundColor: form.color }} onClick={e => e.stopPropagation()}>
            <div className="editor-top">
              <h3 className="editor-heading">{editNote ? "Edit Note" : "New Note"}</h3>
              <button className="editor-close" onClick={() => setShowEditor(false)}>
                <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <input
              className="editor-title-input"
              placeholder="Note title..."
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              autoFocus
            />

            <textarea
              className="editor-body"
              placeholder="Start writing your thoughts here..."
              value={form.content}
              onChange={e => setForm({...form, content: e.target.value})}
              rows={10}
            />

            <div className="editor-colors">
              <span className="ec-label">Note Color:</span>
              {NOTE_COLORS.map((c, i) => (
                <button
                  key={c}
                  className={`ec-dot${form.color === c ? " ec-active" : ""}`}
                  style={{ backgroundColor: c, border: form.color === c ? "2.5px solid #e53935" : "2px solid #ddd" }}
                  onClick={() => setForm({...form, color: c})}
                  title={COLOR_LABELS[i]}
                />
              ))}
            </div>

            <div className="editor-actions">
              <button className="editor-cancel" onClick={() => setShowEditor(false)}>Cancel</button>
              <button className="editor-save" onClick={saveNote} disabled={saving || !form.title.trim()}>
                {saving ? <span className="lf-spinner"></span> : editNote ? "Update Note" : "Save Note"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}