import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "./LoadingScreen";
import "../index.css";

export default function AuthPage() {
  const [mode, setMode]         = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showAuth, setShowAuth] = useState(false);
 
  const { login, register } = useAuth();
  const navigate = useNavigate();
 
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") await login(username, password);
      else await register(username, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
 
  if (!showAuth) {
    return <LoadingScreen onDone={() => setShowAuth(true)} />;
  }
 
  const staticClouds = [
    { top:8,  startX:10,  scale:0.7, dur:32, delay:-8,  op:0.8,  tint:"#c7eaff", shadow:"#8bb8d0" },
    { top:18, startX:55,  scale:0.5, dur:44, delay:-20, op:0.7,  tint:"#e0f4ff", shadow:"#8bb8d0" },
    { top:5,  startX:75,  scale:0.6, dur:38, delay:-5,  op:0.75, tint:"#c7eaff", shadow:"#8bb8d0" },
    { top:60, startX:20,  scale:0.5, dur:50, delay:-30, op:0.65, tint:"#e0f4ff", shadow:"#8bb8d0" },
    { top:72, startX:70,  scale:0.4, dur:42, delay:-15, op:0.6,  tint:"#c7eaff", shadow:"#8bb8d0" },
  ];
 
  return (
    <div className="ls-sky">
      <div className="ls-dither" />
      <div className="ls-stars-layer">
        {Array.from({ length: 40 }, (_, i) => (
          <div key={i} className="ls-star" style={{
            width:  i % 3 === 0 ? 3 : 2,
            height: i % 3 === 0 ? 3 : 2,
            top:    `${(i * 37.3) % 70}%`,
            left:   `${(i * 61.7) % 100}%`,
            animationDelay:    `${(i * 0.13) % 2}s`,
            animationDuration: `${0.9 + (i * 0.17) % 1.8}s`,
          }} />
        ))}
      </div>
      <div className="ls-clouds-layer">
        {staticClouds.map((c, i) => (
          <div key={i} className="ls-cloud" style={{
            top:`${c.top}%`, left:`${c.startX}%`,
            transform:`scale(${c.scale})`, transformOrigin:"left top",
            opacity:c.op, animationDuration:`${c.dur}s`, animationDelay:`${c.delay}s`,
          }}>
            <svg width="120" height="64" viewBox="0 0 30 16" xmlns="http://www.w3.org/2000/svg" style={{imageRendering:"pixelated",display:"block"}}>
              <rect x="6"  y="6"  width="18" height="2" fill={c.shadow}/>
              <rect x="4"  y="8"  width="22" height="4" fill={c.shadow}/>
              <rect x="2"  y="10" width="26" height="2" fill={c.shadow}/>
              <rect x="6"  y="4"  width="18" height="2" fill={c.tint}/>
              <rect x="4"  y="6"  width="22" height="4" fill={c.tint}/>
              <rect x="2"  y="8"  width="26" height="4" fill={c.tint}/>
              <rect x="8"  y="2"  width="8"  height="2" fill={c.tint}/>
              <rect x="16" y="3"  width="6"  height="1" fill={c.tint}/>
            </svg>
          </div>
        ))}
      </div>
 
      <div className="auth-page-center">
        <div className="auth-card">
          <div className="px-corner px-corner--tl"/>
          <div className="px-corner px-corner--tr"/>
          <div className="px-corner px-corner--bl"/>
          <div className="px-corner px-corner--br"/>
 
          <div className="auth-logo">
            <div className="auth-logo-icon">☁</div>
            <div>
              <div className="auth-logo-text">CLOUDKIT</div>
              <div className="auth-logo-ver">By.KELOMPOK 3 · v1.0</div>
            </div>
          </div>
 
          <div className="auth-tabs">
            <button className={`auth-tab ${mode==="login"?"auth-tab--active":""}`} onClick={()=>setMode("login")} type="button">[ MASUK ]</button>
            <button className={`auth-tab ${mode==="register"?"auth-tab--active":""}`} onClick={()=>setMode("register")} type="button">[ DAFTAR ]</button>
          </div>
 
          {error && <div className="auth-error">⚠ ERROR: {error}</div>}
 
          <form onSubmit={submit}>
            <div className="auth-field">
              <label className="auth-label">▸ USERNAME</label>
              <input className="auth-input" value={username} onChange={e=>setUsername(e.target.value)} placeholder="MASUKKAN USERNAME..." autoComplete="username" required />
            </div>
            <div className="auth-field">
              <label className="auth-label">▸ PASSWORD</label>
              <input className="auth-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required />
            </div>
            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? "MEMPROSES..." : mode==="login" ? "▶ MASUK" : "▶ BUAT AKUN"}
            </button>
          </form>
          <div className="auth-footer-text">★ SECURE CLOUD STORAGE By.KELOMPOK 3 ★</div>
        </div>
      </div>
    </div>
  );
}
 