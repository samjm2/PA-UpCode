export default function SavedLocations({
  saved,
  onView,
  onDelete,
  onExport,
  onImport,
}) {
  return (
    <>
      {/* Actions */}
      <div className="card">
        <div className="actions">
          <button className="secondary icon-btn" onClick={onExport}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
          <label className="secondary icon-btn import-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Import CSV
            <input
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImport(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      {/* Saved list */}
      <div className="card">
        <div className="card-label">Saved Locations</div>
        <ul className="savedList">
          {saved.length === 0 ? (
            <li className="empty-state">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>No saved locations yet</span>
              <span className="empty-sub">Search an address and save your evaluation</span>
            </li>
          ) : (
            saved.map((s) => (
              <li key={s.id} className="savedItem">
                <div className="savedMeta">
                  <div className="title">{s.label}</div>
                  <div className="sub">
                    <span className={`mini-badge ${s.score >= 75 ? "ok" : s.score >= 65 ? "warn" : "bad"}`}>
                      {s.score}
                    </span>
                    {s.verdict} &bull; {s.radiusMi} mi
                    &bull; {new Date(s.savedAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button className="secondary small-btn" onClick={() => onView(s)}>
                    View
                  </button>
                  <button className="secondary small-btn danger" onClick={() => onDelete(s.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </>
  );
}
