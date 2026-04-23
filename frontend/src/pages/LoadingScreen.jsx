import { useState, useEffect, useRef } from "react";
import "../index.css";

export default function LoadingScreen({ onDone }) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [label, setLabel] = useState("MEMUAT DUNIA...");
  const starsRef = useRef([]);
  const cloudsRef = useRef([]);

  const labels = [
    "MEMUAT DUNIA...",
    "MENGINISIALISASI...",
    "MENYIAPKAN CLOUD...",
    "SIAP!",
  ];

  // Generate static stars & clouds once
  useEffect(() => {
    starsRef.current = Array.from({ length: 55 }, (_, i) => ({
      id: i,
      size: Math.random() < 0.6 ? 2 : Math.random() < 0.8 ? 3 : 4,
      top: Math.random() * 65,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 0.8 + Math.random() * 2,
    }));

    const cloudRows = [
      { yMin: 5,  yMax: 12, scaleMin: 0.65, scaleMax: 0.9,  durMin: 25, durMax: 35, count: 4, op: 0.92 },
      { yMin: 14, yMax: 22, scaleMin: 0.5,  scaleMax: 0.7,  durMin: 32, durMax: 44, count: 5, op: 0.82 },
      { yMin: 30, yMax: 42, scaleMin: 0.55, scaleMax: 0.75, durMin: 38, durMax: 50, count: 4, op: 0.75 },
      { yMin: 52, yMax: 62, scaleMin: 0.4,  scaleMax: 0.6,  durMin: 28, durMax: 40, count: 4, op: 0.68 },
      { yMin: 70, yMax: 80, scaleMin: 0.35, scaleMax: 0.5,  durMin: 45, durMax: 58, count: 3, op: 0.6  },
    ];

    let id = 0;
    const clouds = [];
    cloudRows.forEach((row) => {
      for (let i = 0; i < row.count; i++) {
        clouds.push({
          id: id++,
          top: row.yMin + Math.random() * (row.yMax - row.yMin),
          startX: -15 + Math.random() * 120,
          scale: row.scaleMin + Math.random() * (row.scaleMax - row.scaleMin),
          duration: row.durMin + Math.random() * (row.durMax - row.durMin),
          delay: -(Math.random() * (row.durMin + (row.durMax - row.durMin))),
          opacity: row.op,
          tint: Math.random() < 0.5 ? "#c7eaff" : "#e0f4ff",
          shadow: "#8bb8d0",
        });
      }
    });
    cloudsRef.current = clouds;
  }, []);

  // Progress bar
  useEffect(() => {
    let prog = 0;
    const tick = setInterval(() => {
      const speed = prog < 60 ? 1.3 : prog < 85 ? 0.8 : 0.35;
      prog = Math.min(100, prog + speed * (0.5 + Math.random()));
      const p = Math.floor(prog);
      setProgress(p);
      setLabel(labels[Math.min(3, Math.floor(p / 25))]);
      if (p >= 100) clearInterval(tick);
    }, 40);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (progress >= 100) setDone(true);
  }, [progress]);

  const handleStart = () => {
    onDone();
  };

  return (
    <div className="ls-sky">
      {/* Dither overlay */}
      <div className="ls-dither" />

      {/* Stars */}
      <div className="ls-stars-layer">
        {starsRef.current.map((s) => (
          <div
            key={s.id}
            className="ls-star"
            style={{
              width: s.size,
              height: s.size,
              top: `${s.top}%`,
              left: `${s.left}%`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Pixel Clouds */}
      <div className="ls-clouds-layer">
        {cloudsRef.current.map((c) => (
          <div
            key={c.id}
            className="ls-cloud"
            style={{
              top: `${c.top}%`,
              left: `${c.startX}%`,
              transform: `scale(${c.scale})`,
              transformOrigin: "left top",
              opacity: c.opacity,
              animationDuration: `${c.duration}s`,
              animationDelay: `${c.delay}s`,
            }}
          >
            <svg
              width="120"
              height="64"
              viewBox="0 0 30 16"
              xmlns="http://www.w3.org/2000/svg"
              style={{ imageRendering: "pixelated", display: "block" }}
            >
              {/* Shadow layer */}
              <rect x="6"  y="6"  width="18" height="2" fill={c.shadow} />
              <rect x="4"  y="8"  width="22" height="4" fill={c.shadow} />
              <rect x="2"  y="10" width="26" height="2" fill={c.shadow} />
              {/* Main cloud */}
              <rect x="6"  y="4"  width="18" height="2" fill={c.tint} />
              <rect x="4"  y="6"  width="22" height="4" fill={c.tint} />
              <rect x="2"  y="8"  width="26" height="4" fill={c.tint} />
              <rect x="8"  y="2"  width="8"  height="2" fill={c.tint} />
              <rect x="16" y="3"  width="6"  height="1" fill={c.tint} />
            </svg>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="ls-content">
        <div className="ls-title">
          SELAMAT<br />DATANG DI<br />
          <span className="ls-title-accent">CLOUDKIT By.KELOMPOK 3</span>
        </div>

        <div className={`ls-sub ${done ? "ls-sub--done" : ""}`}>{label}</div>

        <div className="ls-bar-wrap">
          <div className="ls-bar" style={{ width: `${progress}%` }} />
        </div>
        <div className="ls-pct">{progress}%</div>

        {done && (
          <button className="ls-start-btn" onClick={handleStart}>
            ▶ PRESS START
          </button>
        )}
      </div>
    </div>
  );
}