import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CraftPage.css";

const BUILDINGS = {
  "automation-lab": {
    name: "Automation Lab", icon: "⚙",
    desc: "Robotics & AI Research Center",
    stats: [{ label: "Active Robots", val: "24" }, { label: "Lab Rooms", val: "8" }, { label: "Researchers", val: "142" }],
    x: 400, y: 180,
  },
  "sharing-hub": {
    name: "Sharing Hub", icon: "✈",
    desc: "Collaboration & Knowledge Exchange",
    stats: [{ label: "Meeting Floors", val: "5" }, { label: "Workspaces", val: "200" }, { label: "Event Rooms", val: "12" }],
    x: 720, y: 180,
  },
  "canvas-studio": {
    name: "Canvas Studio", icon: "🎨",
    desc: "Creative Arts & Design Studio",
    stats: [{ label: "Art Studios", val: "10" }, { label: "Exhibitions", val: "3" }, { label: "Artists", val: "85" }],
    x: 200, y: 380,
  },
  "search-engine": {
    name: "Search Engine", icon: "🔍",
    desc: "Data Processing & Analytics",
    stats: [{ label: "Servers", val: "48" }, { label: "Data Centers", val: "6" }, { label: "Operations", val: "24/7" }],
    x: 920, y: 380,
  },
  "central-vault": {
    name: "Central Vault", icon: "🗝",
    desc: "Secure Storage & Archives",
    stats: [{ label: "Uptime", val: "99.9%" }, { label: "Storage", val: "500TB" }, { label: "Security", val: "Lvl 5" }],
    x: 560, y: 520,
  },
};

const PLAZA = { x: 560, y: 350 };

export default function CraftPage() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const close = (e) => { if (e.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  const building = selected ? BUILDINGS[selected] : null;

  return (
    <div className="craft-page">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&display=swap"/>

      {/* Header */}
      <div className="craft-header">
        <div className="craft-logo">
          <svg viewBox="0 0 44 44" width="30" height="30">
            <rect width="44" height="44" rx="10" fill="#e53935"/>
            <text x="10" y="34" fontFamily="Georgia,serif" fontSize="28" fontWeight="bold" fill="white">S</text>
          </svg>
          <span className="craft-logo-text">
            <span style={{color:"#e53935"}}>Shout</span>Hub
          </span>
        </div>
        <h1 className="craft-main-title">The House</h1>
        <p className="craft-sub">Select a section to explore</p>
      </div>

      {/* SVG Map */}
      <div className="map-wrap">
        <svg
          viewBox="0 0 1120 700"
          preserveAspectRatio="xMidYMid meet"
          className="campus-svg"
          aria-label="Campus map"
        >
          {/* White bg */}
          <rect width="1120" height="700" fill="#ffffff"/>

          {/* ---- PATHS from each building to plaza ---- */}
          {Object.entries(BUILDINGS).map(([id, b]) => (
            <line
              key={id + "-path"}
              x1={b.x} y1={b.y}
              x2={PLAZA.x} y2={PLAZA.y}
              stroke="#e8e0d0"
              strokeWidth="2"
              strokeDasharray="6 5"
            />
          ))}

          {/* ---- FLOW LINES (animated on hover) ---- */}
          {Object.entries(BUILDINGS).map(([id, b]) => (
            <line
              key={id + "-flow"}
              className={`flow${hovered === id ? " flow-on" : ""}`}
              x1={b.x} y1={b.y}
              x2={PLAZA.x} y2={PLAZA.y}
              stroke="#e53935"
              strokeWidth="2"
              strokeDasharray="7 6"
            />
          ))}

          {/* ---- PLAZA CENTER ---- */}
          <circle cx={PLAZA.x} cy={PLAZA.y} r="48" fill="#fff5f5" stroke="#e53935" strokeWidth="1.5"/>
          <circle cx={PLAZA.x} cy={PLAZA.y} r="34" fill="none" stroke="#e53935" strokeWidth="0.8" opacity="0.5"/>
          <circle cx={PLAZA.x} cy={PLAZA.y} r="18" fill="#e53935" opacity="0.12" stroke="#e53935" strokeWidth="1"/>
          <text x={PLAZA.x} y={PLAZA.y + 5} textAnchor="middle" fontFamily="Caveat,cursive" fontSize="13" fill="#e53935" fontWeight="600">Plaza</text>

          {/* ---- BUILDING NODES ---- */}
          {Object.entries(BUILDINGS).map(([id, b]) => {
            const active = hovered === id;
            const isCenter = id === "central-vault";
            return (
              <g
                key={id}
                className={`building-node${active ? " node-active" : ""}`}
                onMouseEnter={() => setHovered(id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => id === "central-vault" ? navigate("/login") : setSelected(id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(id); }}}
                role="button" tabIndex="0"
                aria-label={b.name}
                style={{ cursor: "pointer" }}
              >
                {/* Outer ring */}
                <circle
                  cx={b.x} cy={b.y} r="38"
                  fill={active ? "rgba(229,57,53,0.06)" : "#ffffff"}
                  stroke={active ? "#e53935" : "#e0d8d0"}
                  strokeWidth={active ? "1.8" : "1.2"}
                />
                {/* Inner circle */}
                <circle
                  cx={b.x} cy={b.y} r="26"
                  fill={active ? "rgba(229,57,53,0.1)" : "#fafafa"}
                  stroke={active ? "#e53935" : "#ddd"}
                  strokeWidth={active ? "1.5" : "1"}
                />
                {/* Icon */}
                <text x={b.x} y={b.y + 6} textAnchor="middle" fontSize="18">{b.icon}</text>

                {/* Label */}
                <g>
                  {/* Label background */}
                  <rect
                    x={b.x - 72} y={b.y + 44}
                    width="144" height="26" rx="6"
                    fill={active ? "#fff0ee" : "white"}
                    stroke={active ? "#e53935" : "#ddd"}
                    strokeWidth={active ? "1.5" : "1"}
                  />
                  <text
                    x={b.x} y={b.y + 62}
                    textAnchor="middle"
                    fontFamily="Caveat,cursive"
                    fontSize="14" fontWeight="600"
                    fill={active ? "#e53935" : "#1a1a1a"}
                  >
                    {b.name}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Bottom text */}
          <text x="560" y="682" textAnchor="middle" fontFamily="Caveat,cursive" fontSize="13" fill="#ccc">
            Hover a building · Click to open dashboard
          </text>
        </svg>
      </div>

      {/* Dashboard Modal */}
      {selected && building && (
        <div className="dashboard-panel" onClick={() => setSelected(null)}>
          <div className="panel-inner" onClick={e => e.stopPropagation()}>
            <button className="panel-close" onClick={() => setSelected(null)}>
              <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <h2 className="panel-title">{building.icon} {building.name}</h2>
            <p className="panel-desc">{building.desc}</p>
            <div className="panel-stats">
              {building.stats.map((s, i) => (
                <div key={i} className="stat-card">
                  <span className="stat-val">{s.val}</span>
                  <span className="stat-label">{s.label}</span>
                </div>
              ))}
            </div>
            <p className="panel-body">Dashboard coming soon.</p>
          </div>
        </div>
      )}
    </div>
  );
}