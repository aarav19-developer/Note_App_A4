import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Welcome.css";

const MiniCube = ({ speed, labels, cls }) => (
  <div className={`mini-cube-scene ${cls}`}>
    <div className="mini-cube" style={{ animationDuration: speed }}>
      <div className="mc-face mc-front">{labels[0]}</div>
      <div className="mc-face mc-back">{labels[1]}</div>
      <div className="mc-face mc-left">{labels[2]}</div>
      <div className="mc-face mc-right">{labels[3]}</div>
      <div className="mc-face mc-top">{labels[4]}</div>
      <div className="mc-face mc-bottom">{labels[5]}</div>
    </div>
  </div>
);

const WelcomePage = () => {
  const [step, setStep] = useState("idle");
  const [chairDropped, setChairDropped] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setChairDropped(true), 700);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setStep("visible"), 300);
    return () => clearTimeout(t);
  }, []);

  const handleThankYou = () => {
    setStep("exiting");
    setTimeout(() => setStep("letsgo-drop"), 500);
  };

  return (
    <div className="welcome-container">

      <div className="brand-topleft">
        <svg className="brand-s-svg" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="13" fill="#e53935"/>
          <text x="10" y="36" fontFamily="Georgia, serif" fontSize="30" fontWeight="bold" fill="white">S</text>
        </svg>
        <span className="brand-name-text">
          <span className="brand-shout">Shout</span><span className="brand-hub">Hub</span>
        </span>
      </div>

      <div className="topright-btn">
        {(step === "visible" || step === "exiting") && (
          <button
            className={`btn-thankyou ${step === "visible" ? "btn-slide-in" : "btn-slide-out"}`}
            onClick={handleThankYou}
          >
            Thank You
          </button>
        )}
        {step === "letsgo-drop" && (
          <span className="letsgo-wrap" onClick={() => navigate("/craft")}>
            {"Lets  Go".split("").map((char, i) => (
              <span key={i} className="letsgo-char" style={{ animationDelay: `${i * 0.055}s` }}>
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
          </span>
        )}
      </div>

      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      <div className="hero-wrap">

        <div className="hero-left">
          <div className="eyebrow">
            <span className="eyebrow-dot"></span>
            <span className="eyebrow-text">A digital space for your thoughts</span>
            <span className="eyebrow-dot"></span>
          </div>

          <p className="welcome-small">Welcome to the</p>
          <div className="welcome-big-row">
            <span className={`chair-wrap ${chairDropped ? "chair-dropped" : "chair-hidden"}`}>
              <svg className="chair-svg" viewBox="0 0 64 76" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="4" width="52" height="13" rx="4" fill="#e53935"/>
                <rect x="10" y="15" width="6" height="18" rx="3" fill="#c62828"/>
                <rect x="48" y="15" width="6" height="18" rx="3" fill="#c62828"/>
                <rect x="4" y="28" width="56" height="12" rx="4" fill="#e53935"/>
                <rect x="8" y="40" width="6" height="32" rx="3" fill="#c62828"/>
                <rect x="50" y="40" width="6" height="32" rx="3" fill="#c62828"/>
                <rect x="8" y="58" width="48" height="5" rx="2.5" fill="#ef9a9a" opacity="0.7"/>
                <rect x="10" y="30" width="24" height="4" rx="2" fill="white" opacity="0.2"/>
              </svg>
            </span>
            <span className="big-letter">OUSE</span>
          </div>

          <p className="welcome-tagline">Your notes. Your space.<br/>Beautifully organized.</p>

          <div className="divider">
            <span className="div-line"></span>
            <svg viewBox="0 0 16 16" fill="none" className="div-icon">
              <circle cx="8" cy="8" r="3" fill="#e53935" opacity="0.5"/>
            </svg>
            <span className="div-line"></span>
          </div>

          <div className="feature-row">
            <div className="feature-card">
              <div className="feat-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" className="feat-icon">
                  <rect x="3" y="3" width="8" height="8" rx="2" stroke="#e53935" strokeWidth="1.6"/>
                  <rect x="13" y="3" width="8" height="8" rx="2" stroke="#e53935" strokeWidth="1.6"/>
                  <rect x="3" y="13" width="8" height="8" rx="2" stroke="#e53935" strokeWidth="1.6"/>
                  <rect x="13" y="13" width="8" height="8" rx="2" stroke="#e53935" strokeWidth="1.6"/>
                </svg>
              </div>
              <h4>Organized</h4>
              <p>Keep your notes clean and structured effortlessly</p>
            </div>
            <div className="feature-card featured-card">
              <div className="feat-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" className="feat-icon">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="white" strokeWidth="1.6" strokeLinejoin="round"/>
                </svg>
              </div>
              <h4>Secure</h4>
              <p>JWT protected your data stays yours alone</p>
            </div>
            <div className="feature-card">
              <div className="feat-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" className="feat-icon">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#e53935" strokeWidth="1.6" strokeLinejoin="round"/>
                </svg>
              </div>
              <h4>Instant</h4>
              <p>Access and edit your notes at lightning speed</p>
            </div>
          </div>

          <p className="bottom-quote">"A place for every thought, a thought for every place."</p>
        </div>

        {/* RIGHT — 4 cubes in S pattern */}
        <div className="hero-right">
          <div className="s-pattern">
            {/* S shape: top-right, mid-left, mid-right, bottom-left */}
            <MiniCube cls="cube-pos-1" speed="9s"  labels={["SHOUT","NOTES","BUILD","CRAFT","WRITE","THINK"]} />
            <MiniCube cls="cube-pos-2" speed="13s" labels={["HOUSE","SPACE","STORE","SHARE","FOCUS","GROW"]}  />
            <MiniCube cls="cube-pos-3" speed="8s"  labels={["IDEAS","GOALS","TASKS","PLANS","TRACK","DONE"]}  />
            <MiniCube cls="cube-pos-4" speed="11s" labels={["SMART","CLEAN","QUICK","SAFE","SYNC","FREE"]}    />
          </div>
        </div>

      </div>
    </div>
  );
};

export default WelcomePage;