import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./LoginPage.css";

const API = "";

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState("");
  const navigate = useNavigate();

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); setSuccess("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    try {
      if (mode === "register") {
        const res = await axios.post(`${API}/user/register`, form);
        if (res.data.msg === "User registered successfully") {
          setSuccess("Account created! You can now log in.");
          setMode("login");
          setForm({ name: "", email: form.email, password: "" });
        } else { setError(res.data.msg); }
      } else {
        const res = await axios.post(`${API}/user/login`, { email: form.email, password: form.password });
        if (res.data.token) {
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("userName", res.data.name || form.email.split("@")[0]);
          localStorage.setItem("userEmail", form.email);
          navigate("/dashboard");
        } else { setError(res.data.msg || "Login failed"); }
      }
    } catch {
      setError("Cannot connect to server. Make sure backend is running.");
    }
    setLoading(false);
  };

  const strengthLevel = (p) => p.length >= 8 ? "strong" : p.length >= 6 ? "medium" : "weak";

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="lb lb-1"></div>
        <div className="lb lb-2"></div>
        <div className="lb lb-3"></div>
      </div>
      <div className="login-wrap">
        <div className="login-left">
          <div className="ll-logo">
            <svg viewBox="0 0 44 44" width="38" height="38">
              <rect width="44" height="44" rx="11" fill="#e53935"/>
              <text x="10" y="34" fontFamily="Georgia,serif" fontSize="28" fontWeight="bold" fill="white">S</text>
            </svg>
            <span className="ll-brand">ShoutHub</span>
          </div>
          <div className="ll-hero">
            <h1 className="ll-title">Welcome to<br/><span>The House</span></h1>
            <p className="ll-sub">Your secure digital workspace. Store, share and build all in one place.</p>
          </div>
          <div className="ll-features">
            {[["lock","JWT Secured","Token-based auth"],["zap","Fast API","Node.js + Express"],["database","MongoDB","Persistent storage"]].map(([ic,lb,ds],i) => (
              <div key={i} className="ll-feat">
                <div className="ll-feat-dot"></div>
                <div>
                  <p className="ll-feat-label">{lb}</p>
                  <p className="ll-feat-desc">{ds}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="ll-back" onClick={() => navigate("/craft")}>
            <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
              <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Campus
          </button>
        </div>

        <div className="login-right">
          <div className="login-card">
            <div className="login-tabs">
              <button className={`login-tab${mode==="login"?" active":""}`} onClick={()=>{setMode("login");setError("");setSuccess("");}}>Sign In</button>
              <button className={`login-tab${mode==="register"?" active":""}`} onClick={()=>{setMode("register");setError("");setSuccess("");}}>Create Account</button>
            </div>
            <h2 className="lc-title">{mode==="login"?"Sign in to your account":"Create a new account"}</h2>
            <p className="lc-sub">{mode==="login"?"Enter your credentials to continue":"Fill in the details to get started"}</p>

            <form onSubmit={submit} className="login-form" noValidate>
              {mode==="register" && (
                <div className={`lf-group${focused==="name"?" lf-focused":""}`}>
                  <label className="lf-label">Full Name</label>
                  <div className="lf-input-wrap">
                    <svg viewBox="0 0 24 24" fill="none" className="lf-icon" width="18" height="18">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.6"/>
                    </svg>
                    <input type="text" name="name" value={form.name} onChange={change} required placeholder="Your full name" onFocus={()=>setFocused("name")} onBlur={()=>setFocused("")} className="lf-input" autoComplete="name"/>
                  </div>
                </div>
              )}

              <div className={`lf-group${focused==="email"?" lf-focused":""}`}>
                <label className="lf-label">Email Address</label>
                <div className="lf-input-wrap">
                  <svg viewBox="0 0 24 24" fill="none" className="lf-icon" width="18" height="18">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.6"/>
                    <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.6"/>
                  </svg>
                  <input type="email" name="email" value={form.email} onChange={change} required placeholder="you@example.com" onFocus={()=>setFocused("email")} onBlur={()=>setFocused("")} className="lf-input" autoComplete="email"/>
                </div>
              </div>

              <div className={`lf-group${focused==="password"?" lf-focused":""}`}>
                <label className="lf-label">Password</label>
                <div className="lf-input-wrap">
                  <svg viewBox="0 0 24 24" fill="none" className="lf-icon" width="18" height="18">
                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                  <input type={showPass?"text":"password"} name="password" value={form.password} onChange={change} required placeholder={mode==="register"?"Min 6 characters":"Your password"} onFocus={()=>setFocused("password")} onBlur={()=>setFocused("")} className="lf-input" autoComplete={mode==="register"?"new-password":"current-password"}/>
                  <button type="button" className="lf-eye" onClick={()=>setShowPass(!showPass)} tabIndex="-1">
                    <svg viewBox="0 0 24 24" fill="none" width="17" height="17">
                      {showPass
                        ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></>
                        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/></>
                      }
                    </svg>
                  </button>
                </div>
                {mode==="register" && form.password && (
                  <div className="pass-strength">
                    <div className="ps-bars">
                      {["weak","medium","strong"].map((l,i)=>(
                        <div key={l} className={`ps-seg ${["weak","medium","strong"].indexOf(strengthLevel(form.password))>=i ? "ps-"+strengthLevel(form.password) : ""}`}></div>
                      ))}
                    </div>
                    <span className="ps-label">{strengthLevel(form.password).charAt(0).toUpperCase()+strengthLevel(form.password).slice(1)}</span>
                  </div>
                )}
              </div>

              {error && <div className="lf-error"><svg viewBox="0 0 24 24" fill="none" width="15" height="15"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg> {error}</div>}
              {success && <div className="lf-success"><svg viewBox="0 0 24 24" fill="none" width="15" height="15"><polyline points="20,6 9,17 4,12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> {success}</div>}

              <button type="submit" className={`lf-submit${loading?" lf-loading":""}`} disabled={loading}>
                {loading ? <span className="lf-spinner"></span> : mode==="login" ? "Sign In" : "Create Account"}
              </button>

              {mode==="register" && <p className="lf-terms">By creating an account you agree to our <span>Terms</span> and <span>Privacy Policy</span>.</p>}

              <p className="lf-switch">
                {mode==="login" ? "Don't have an account?" : "Already have an account?"}
                <button type="button" className="lf-switch-btn" onClick={()=>{setMode(mode==="login"?"register":"login");setError("");setSuccess("");}}>
                  {mode==="login" ? " Create one" : " Sign in"}
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}