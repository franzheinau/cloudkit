import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth, API } from "../context/AuthContext";
import { useUploadQueue } from "../hooks/useUploadQueue";
import "../index.css";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};
 
const fileEmoji = (type, mime = "") => {
  if (type === "image" || mime.startsWith("image/")) return "🖼";
  if (mime.startsWith("video/")) return "🎬";
  if (mime.startsWith("audio/")) return "🎵";
  if (mime.includes("pdf")) return "📄";
  return "📁";
};
 
const fileTypeLabel = (type, mime = "") => {
  if (type === "image" || mime.startsWith("image/")) return "IMG";
  if (mime.startsWith("video/")) return "VID";
  if (mime.startsWith("audio/")) return "AUD";
  if (mime.includes("pdf")) return "PDF";
  return "FILE";
};
 
const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};
 
// ── Cloud decoration (small, for dashboard) ───────────────────────────────────
function MiniClouds() {
  const clouds = [
    { top:2,  startX:15,  scale:0.45, dur:40, delay:-10, op:0.5,  tint:"#c7eaff", shadow:"#8bb8d0" },
    { top:8,  startX:60,  scale:0.35, dur:52, delay:-25, op:0.45, tint:"#e0f4ff", shadow:"#8bb8d0" },
    { top:1,  startX:82,  scale:0.4,  dur:36, delay:-5,  op:0.5,  tint:"#c7eaff", shadow:"#8bb8d0" },
  ];
  return (
    <div className="ls-clouds-layer" style={{ pointerEvents:"none" }}>
      {clouds.map((c, i) => (
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
  );
}
 
// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ view, setView, user, logout }) {
  return (
    <div className="px-sidebar">
      <div className="px-sidebar-logo">
        <div className="auth-logo-icon" style={{ width:26, height:26, fontSize:12 }}>☁</div>
        <div>
          <div className="auth-logo-text" style={{ fontSize:8 }}>CLOUDKIT</div>
          <div className="auth-logo-ver">By.KELOMPOK 3 · v1.0</div>
        </div>
      </div>
      <nav className="px-nav">
        <div className={`px-nav-item ${view==="files"?"px-nav-item--active":""}`} onClick={()=>setView("files")}>
          <svg className="px-nav-icon" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="2" width="6" height="5"/><rect x="1" y="9" width="14" height="5"/><rect x="7" y="2" width="8" height="5"/>
          </svg>
          FILE SAYA
        </div>
        <div className={`px-nav-item ${view==="upload"?"px-nav-item--active":""}`} onClick={()=>setView("upload")}>
          <svg className="px-nav-icon" viewBox="0 0 16 16" fill="currentColor">
            <rect x="7" y="1" width="2" height="9"/><polygon points="4,5 8,1 12,5 10,5 10,7 6,7 6,5"/><rect x="1" y="12" width="14" height="3"/>
          </svg>
          UPLOAD
        </div>
      </nav>
      <div className="px-sidebar-footer">
        <div className="px-user-row">
          <div className="px-avatar">{user?.[0]?.toUpperCase()}</div>
          <span className="px-username">{user}</span>
        </div>
        <div className="px-hp-label">
          HP {"█".repeat(Math.round(67 / 15))}{"░".repeat(7 - Math.round(67 / 15))} 67%
        </div>
        <div className="px-hp-bg"><div className="px-hp-fill" style={{ width:"67%" }} /></div>
        <button className="px-logout-btn" onClick={logout}>⬛ KELUAR</button>
      </div>
    </div>
  );
}
 
// ── Rename Modal ──────────────────────────────────────────────────────────────
function RenameModal({ file, onConfirm, onCancel, loading }) {
  const [name, setName] = useState(file.name);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);
  const submit = (e) => { e.preventDefault(); if (name.trim() && name.trim() !== file.name) onConfirm(name.trim()); };
  return (
    <div className="px-modal-overlay" onClick={e=>e.target===e.currentTarget&&onCancel()}>
      <div className="px-modal-box">
        <div className="px-corner px-corner--tl"/><div className="px-corner px-corner--tr"/>
        <div className="px-corner px-corner--bl"/><div className="px-corner px-corner--br"/>
        <div className="px-modal-title">▶ RENAME FILE</div>
        <form onSubmit={submit}>
          <div className="px-mb-4">
            <label className="auth-label">▸ NAMA BARU</label>
            <input ref={inputRef} className="auth-input" value={name} onChange={e=>setName(e.target.value)} placeholder="NAMA BARU..." />
          </div>
          <div className="px-modal-actions">
            <button type="button" className="px-btn px-btn--ghost" onClick={onCancel}>✕ BATAL</button>
            <button type="submit" className="px-btn" disabled={loading||!name.trim()||name.trim()===file.name}>
              {loading?"MENYIMPAN...":"✓ SIMPAN"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
 
// ── Delete Modal ──────────────────────────────────────────────────────────────
function DeleteModal({ file, onConfirm, onCancel, loading }) {
  return (
    <div className="px-modal-overlay" onClick={e=>e.target===e.currentTarget&&onCancel()}>
      <div className="px-modal-box">
        <div className="px-corner px-corner--tl"/><div className="px-corner px-corner--tr"/>
        <div className="px-corner px-corner--bl"/><div className="px-corner px-corner--br"/>
        <div className="px-modal-title" style={{color:"var(--px-red)"}}>⚠ HAPUS FILE?</div>
        <div className="px-modal-sub">"{file.name}" akan dihapus permanen. Tidak bisa dikembalikan!</div>
        <div className="px-modal-actions">
          <button className="px-btn px-btn--ghost" onClick={onCancel}>✕ BATAL</button>
          <button className="px-btn px-btn--danger" onClick={onConfirm} disabled={loading}>{loading?"MENGHAPUS...":"🗑 HAPUS"}</button>
        </div>
      </div>
    </div>
  );
}
 
// ── File Card ─────────────────────────────────────────────────────────────────
function FileCard({ file, onDelete, onRename }) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
 
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
 
  const copy = () => { navigator.clipboard.writeText(file.url); setCopied(true); setTimeout(()=>setCopied(false),2000); };
 
  return (
    <div className="px-file-card">
      <div className="px-file-thumb">
        {file.fileType === "image"
          ? <img src={file.thumbnail} alt={file.name} className="px-file-thumb-img" loading="lazy" />
          : <span className="px-file-thumb-icon">{fileEmoji(file.fileType, file.mimeType)}</span>
        }
        <span className="px-file-type-badge">{fileTypeLabel(file.fileType, file.mimeType)}</span>
      </div>
      <div className="px-file-body">
        <div className="px-file-name" title={file.name}>{file.name}</div>
        <div className="px-file-meta">{fmt(file.size)} · {new Date(file.createdAt).toLocaleDateString("id-ID")}</div>
        <div className="px-file-actions">
          <button className={`px-btn-sm ${copied?"px-btn-sm--copied":""}`} style={{flex:1}} onClick={copy}>{copied?"✓ OK!":"SALIN"}</button>
          <a href={`${file.url}?ik-attachment=true`} download={file.name} target="_blank" rel="noreferrer">
            <button className="px-btn-sm px-btn-sm--accent" title="Download">↓</button>
          </a>
          <div ref={menuRef} style={{position:"relative"}}>
            <button className="px-btn-sm" onClick={()=>setMenuOpen(v=>!v)}>···</button>
            {menuOpen && (
              <div className="px-dropdown">
                <button className="px-dropdown-item" onClick={()=>{setMenuOpen(false);onRename(file);}}>✏ RENAME</button>
                <button className="px-dropdown-item px-dropdown-item--danger" onClick={()=>{setMenuOpen(false);onDelete(file);}}>🗑 HAPUS</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
 
// ── Upload Row ────────────────────────────────────────────────────────────────
function UploadRow({ file, onRemove }) {
  const barColor = {uploading:"var(--px-purple-l)",done:"var(--px-green)",error:"var(--px-red)"}[file.status]||"#334155";
  const badge = {
    pending:   ["px-badge--pending",   "MENUNGGU"],
    uploading: ["px-badge--uploading", "UPLOAD..."],
    done:      ["px-badge--done",      "SELESAI"],
    error:     ["px-badge--error",     "GAGAL"],
  }[file.status]||["px-badge--pending","—"];
  return (
    <div className="px-upload-row">
      <span style={{fontSize:22,flexShrink:0}}>{fileEmoji("",file.type)}</span>
      <div style={{flex:1,minWidth:0}}>
        <div className="px-upload-name">{file.name}</div>
        <div className="px-upload-meta">
          {fmt(file.size)}{file.error&&` · ${file.error}`}
          {file.url&&<> · <a href={file.url} target="_blank" rel="noreferrer" className="px-link">BUKA ↗</a></>}
        </div>
        {["uploading","done","error"].includes(file.status)&&(
          <div className="px-hp-bg" style={{marginTop:4}}>
            <div className="px-hp-fill" style={{width:`${file.progress}%`,background:barColor}}/>
          </div>
        )}
      </div>
      <span className={`px-badge ${badge[0]}`}>{badge[1]}</span>
      <button className="px-remove-btn" onClick={()=>onRemove(file.id)}>✕</button>
    </div>
  );
}
 
// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { token, user, logout } = useAuth();
  const [view, setView]               = useState("files");
  const [cloudFiles, setCloudFiles]   = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [concurrent, setConcurrent]   = useState(3);
  const [dragging, setDragging]       = useState(false);
  const [search, setSearch]           = useState("");
  const [sortBy, setSortBy]           = useState("DESC_CREATED");
  const [filterType, setFilterType]   = useState("");
  const debouncedSearch = useDebounce(search);
  const [renameTarget, setRenameTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
 
  const { files, paused, stats, addFiles, startUpload, togglePause, retryFailed, removeFile, clearAll } =
    useUploadQueue(token, concurrent);
 
  const fetchFiles = useCallback(async () => {
    setLoadingFiles(true);
    try {
      const params = new URLSearchParams({ sort: sortBy });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (filterType) params.set("file_type", filterType);
      const res = await fetch(`${API}/files?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setCloudFiles(data.files || []);
    } catch {}
    setLoadingFiles(false);
  }, [token, debouncedSearch, sortBy, filterType]);
 
  useEffect(() => { if (view === "files") fetchFiles(); }, [view, fetchFiles]);
 
  const prevDone = useRef(0);
  useEffect(() => {
    if (stats.done > prevDone.current) { prevDone.current = stats.done; if (view==="files") fetchFiles(); }
  }, [stats.done]);
 
  const onDrop = (e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); setView("upload"); };
 
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setModalLoading(true);
    try {
      const res = await fetch(`${API}/files/${deleteTarget.fileId}`, { method:"DELETE", headers:{ Authorization:`Bearer ${token}` } });
      if (!res.ok) throw new Error((await res.json()).detail || "Gagal menghapus");
      setCloudFiles(prev => prev.filter(f => f.fileId !== deleteTarget.fileId));
      setDeleteTarget(null);
    } catch (err) { alert(err.message); }
    setModalLoading(false);
  };
 
  const handleRename = async (newName) => {
    if (!renameTarget) return;
    setModalLoading(true);
    try {
      const res = await fetch(`${API}/files/${renameTarget.fileId}/rename`, {
        method:"PATCH",
        headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
        body: JSON.stringify({ file_id: renameTarget.fileId, new_name: newName }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Gagal rename");
      const updated = await res.json();
      setCloudFiles(prev => prev.map(f => f.fileId===renameTarget.fileId ? {...f, name:updated.name, url:updated.url||f.url} : f));
      setRenameTarget(null);
    } catch (err) { alert(err.message); }
    setModalLoading(false);
  };
 
  return (
    <div
      className="px-dashboard"
      onDragOver={e=>{e.preventDefault();setDragging(true);}}
      onDragLeave={()=>setDragging(false)}
      onDrop={onDrop}
    >
      <div className="ls-dither" />
      <MiniClouds />
 
      <Sidebar view={view} setView={setView} user={user} logout={logout} />
 
      <div className="px-main">
        {/* Topbar */}
        <div className="px-topbar">
          <span className="px-topbar-title">▶ {view==="files"?"FILE SAYA":"UPLOAD"}</span>
          {view === "files" && (
            <div className="px-topbar-controls">
              <div className="px-search-bar">
                <span className="px-search-icon">🔍</span>
                <input className="px-search-input" placeholder="CARI FILE..." value={search} onChange={e=>setSearch(e.target.value)} />
              </div>
              <select className="px-select" value={filterType} onChange={e=>setFilterType(e.target.value)}>
                <option value="">SEMUA TIPE</option>
                <option value="image">GAMBAR</option>
                <option value="non-image">NON-GAMBAR</option>
              </select>
              <select className="px-select" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
                <option value="DESC_CREATED">TERBARU</option>
                <option value="ASC_CREATED">TERLAMA</option>
                <option value="ASC_NAME">NAMA A–Z</option>
                <option value="DESC_NAME">NAMA Z–A</option>
              </select>
              <button className="px-btn-sm" onClick={fetchFiles}>↻</button>
            </div>
          )}
        </div>
 
        {/* Content */}
        <div className="px-content">
          {view === "upload" && (
            <>
              <div className={`px-drop-zone ${dragging?"px-drop-zone--active":""}`} style={{marginBottom:16}}>
                <div className="px-corner px-corner--tl"/><div className="px-corner px-corner--tr"/>
                <div className="px-corner px-corner--bl"/><div className="px-corner px-corner--br"/>
                <span className="px-drop-icon">☁</span>
                <div className="px-drop-text">SERET FILE KE SINI</div>
                <div className="px-drop-sub">ATAU KLIK UNTUK MEMILIH · SEMUA TIPE FILE</div>
                <input type="file" multiple className="px-drop-input" onChange={e=>addFiles(e.target.files)} />
              </div>
              {files.length > 0 && (
                <>
                  <div className="px-stats-grid" style={{marginBottom:14}}>
                    {[["TOTAL",stats.total,"var(--px-yellow)"],["SELESAI",stats.done,"var(--px-green)"],["BERJALAN",stats.active,"var(--px-purple-l)"],["GAGAL",stats.failed,"var(--px-red)"]].map(([lbl,val,col])=>(
                      <div key={lbl} className="px-stat-box">
                        <span className="px-stat-num" style={{color:col}}>{val}</span>
                        <span className="px-stat-lbl">{lbl}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{marginBottom:12}}>
                    <div className="px-upload-prog-label">PROGRESS DUNGEON</div>
                    <div className="px-hp-bg" style={{height:14}}>
                      <div className="px-hp-fill" style={{width:`${stats.progress}%`,background:"var(--px-purple-l)"}}/>
                    </div>
                  </div>
                  <div className="px-upload-controls" style={{marginBottom:16}}>
                    <button className="px-btn" onClick={startUpload} disabled={stats.pending===0&&stats.active===0}>▶ MULAI UPLOAD</button>
                    <button className="px-btn px-btn--ghost" onClick={togglePause} disabled={stats.active===0}>{paused?"▶ LANJUTKAN":"⏸ JEDA"}</button>
                    {stats.failed>0&&<button className="px-btn px-btn--ghost" onClick={retryFailed}>↺ COBA ULANG ({stats.failed})</button>}
                    <button className="px-btn px-btn--danger" onClick={clearAll}>✕ BERSIHKAN</button>
                    <div className="px-concurrent">
                      <span>PARALEL:</span>
                      <input type="range" min="1" max="6" value={concurrent} onChange={e=>setConcurrent(+e.target.value)} className="px-range" />
                      <strong style={{color:"var(--px-yellow)"}}>{concurrent}</strong>
                    </div>
                  </div>
                  <div className="px-upload-list">
                    {files.map(f=><UploadRow key={f.id} file={f} onRemove={removeFile}/>)}
                  </div>
                  {stats.done>0&&(
                    <button className="px-btn" style={{marginTop:14}} onClick={()=>setView("files")}>LIHAT FILE SAYA →</button>
                  )}
                </>
              )}
            </>
          )}
 
          {view === "files" && (
            <>
              {!loadingFiles && cloudFiles.length > 0 && (
                <div className="px-file-count">
                  {debouncedSearch||filterType ? `${cloudFiles.length} HASIL DITEMUKAN` : `${cloudFiles.length} FILE`}
                </div>
              )}
              {loadingFiles ? (
                <div className="px-empty-state">
                  <div className="px-empty-icon">⏳</div>
                  <div>MEMUAT FILE...<span className="ls-blink">█</span></div>
                </div>
              ) : cloudFiles.length === 0 ? (
                <div className="px-empty-state">
                  <div className="px-empty-icon">{debouncedSearch||filterType?"🔍":"📂"}</div>
                  <div style={{marginBottom:16}}>
                    {debouncedSearch||filterType?"TIDAK ADA FILE YANG COCOK.":"BELUM ADA FILE. MULAI UPLOAD!"}
                  </div>
                  {!debouncedSearch&&!filterType&&(
                    <button className="px-btn" onClick={()=>setView("upload")}>▶ UPLOAD SEKARANG</button>
                  )}
                </div>
              ) : (
                <div className="px-file-grid">
                  {cloudFiles.map(f=>(
                    <FileCard key={f.fileId} file={f} onDelete={setDeleteTarget} onRename={setRenameTarget}/>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
 
      {renameTarget && <RenameModal file={renameTarget} onConfirm={handleRename} onCancel={()=>setRenameTarget(null)} loading={modalLoading}/>}
      {deleteTarget && <DeleteModal file={deleteTarget} onConfirm={handleDelete} onCancel={()=>setDeleteTarget(null)} loading={modalLoading}/>}
    </div>
  );
}