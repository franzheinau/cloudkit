export default function PixelScene() {
  return (
    <div className="px-scene" aria-hidden="true">

      {/* ── Sky layers ── */}
      <div className="px-sky" />

      {/* ── Sun ── */}
      <div className="px-sun" />

      {/* ── Mountains ── */}
      <svg className="px-mountains" viewBox="0 0 1400 200" preserveAspectRatio="none">
        <polygon points="0,200 140,60 280,200" fill="#1a2a0a"/>
        <polygon points="100,200 280,30 460,200" fill="#1e300c"/>
        <polygon points="260,200 480,10 700,200" fill="#162408"/>
        <polygon points="560,200 780,20 1000,200" fill="#1a2a0a"/>
        <polygon points="800,200 980,40 1160,200" fill="#1e300c"/>
        <polygon points="1000,200 1160,28 1320,200" fill="#162408"/>
        <polygon points="1200,200 1320,50 1400,120 1400,200" fill="#1a2a0a"/>
      </svg>

      {/* ── Ground ── */}
      <div className="px-ground" />

      {/* ── Road top lane ── */}
      <div className="px-road px-road--top">
        <div className="px-road-line" />
      </div>

      {/* ── Road bottom lane ── */}
      <div className="px-road px-road--bot">
        <div className="px-road-line" />
      </div>

      {/* ── Cars ── */}
      <div className="px-car px-car--red">
        <svg width="80" height="28" viewBox="0 0 20 7" style={{imageRendering:"pixelated"}}>
          <rect x="2" y="3" width="16" height="3" fill="#e03030"/>
          <rect x="4" y="1" width="10" height="3" fill="#e84040"/>
          <rect x="5" y="1" width="3" height="2" fill="#88ddff" opacity="0.8"/>
          <rect x="9" y="1" width="3" height="2" fill="#88ddff" opacity="0.8"/>
          <rect x="1" y="4" width="2" height="1" fill="#ffee44"/>
          <rect x="17" y="4" width="2" height="1" fill="#ff4444" opacity="0.8"/>
          <rect x="3" y="6" width="3" height="2" fill="#222" rx="1"/>
          <rect x="14" y="6" width="3" height="2" fill="#222" rx="1"/>
        </svg>
      </div>

      <div className="px-car px-car--blue">
        <svg width="88" height="32" viewBox="0 0 22 8" style={{imageRendering:"pixelated",transform:"scaleX(-1)"}}>
          <rect x="2" y="3" width="18" height="4" fill="#2060d0"/>
          <rect x="5" y="1" width="10" height="3" fill="#2878e8"/>
          <rect x="6" y="1" width="3" height="2" fill="#aaeeff" opacity="0.8"/>
          <rect x="11" y="1" width="3" height="2" fill="#aaeeff" opacity="0.8"/>
          <rect x="1" y="4" width="2" height="2" fill="#ffee44"/>
          <rect x="19" y="4" width="2" height="2" fill="#ff4444" opacity="0.7"/>
          <rect x="3" y="7" width="4" height="2" fill="#222" rx="1"/>
          <rect x="15" y="7" width="4" height="2" fill="#222" rx="1"/>
        </svg>
      </div>

    </div>
  );
}