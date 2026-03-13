import { useState, useCallback } from "react";
import MapView from "./components/MapView";
import AddressInput from "./components/AddressInput";
import FactorPanel, { FACTOR_DEFAULTS } from "./components/FactorPanel";
import ScoreCard, { getVerdict } from "./components/ScoreCard";
import SavedLocations from "./components/SavedLocations";
import "./App.css";
import supabase from "./utils/supabase";
const DEFAULT_CENTER = [41.9, -87.7];
const DEFAULT_ZOOM = 10;
function buildInitialFactors() {
  const out = {};
  FACTOR_DEFAULTS.forEach(({ key, defaultValue }) => {
    out[key] = { value: defaultValue, enabled: true };
  });
  return out;
}

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem("savedLocationsV2")) || [];
  } catch {
    return [];
  }
}

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && line[i + 1] === '"' && inQuotes) {
      cur += '"';
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out.map((s) => s.replace(/^"|"$/g, ""));
}

export default function App() {
  const [location, setLocation] = useState("");
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [radiusMi, setRadiusMi] = useState(5);
  const [popupText, setPopupText] = useState("Chicago (default)");
  const [factors, setFactors] = useState(buildInitialFactors);
  const [saved, setSaved] = useState(loadSaved);
  const [locationSet, setLocationSet] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const persistSaved = (list) => {
    setSaved(list);
    localStorage.setItem("savedLocationsV2", JSON.stringify(list));
  };
  
  const handleFactorChange = useCallback((key, value) => {
    setFactors((prev) => ({
      ...prev,
      [key]: { ...prev[key], value },
    }));
  }, []);

  const handleToggle = useCallback((key) => {
    setFactors((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled },
    }));
  }, []);

  const handleSelect = (item) => {
    setLocation(item.fullName);
    setCenter([item.lat, item.lng]);
    setZoom(12);
    setPopupText(item.fullName);
    setLocationSet(true);
  };

  const computeScore = () => {
    const enabled = Object.values(factors).filter((f) => f.enabled);
    if (enabled.length === 0) return null;
    return Math.round(enabled.reduce((sum, f) => sum + f.value, 0) / enabled.length);
  };

  const handleAnalyze = async () => {
    const enabled = Object.entries(factors).filter(([, f]) => f.enabled);
    if (enabled.length === 0) return;

    setAnalyzing(true);
    setAnalyzed(false);
    setAnalysisResult(null);

    // Mock analysis with a fake delay
    setTimeout(() => {
      const mockScores = {};
      enabled.forEach(([key, f]) => {
        // Add slight random variance (-8 to +5) around user's slider value to simulate real data
        const noise = Math.floor(Math.random() * 14) - 8;
        mockScores[key] = Math.max(0, Math.min(100, f.value + noise));
      });

      const avg = Math.round(
        Object.values(mockScores).reduce((s, v) => s + v, 0) / enabled.length
      );

      setAnalysisResult({ factorScores: mockScores, overall: avg });
      setAnalyzing(false);
      setAnalyzed(true);
    }, 1500);
    const {data} = await supabase.rpc("tracts_within_radius", {center_lat: 41.8781, center_lon: -87.7, radius_meters: 5 * 1609.34});
    console.log(data)
  };

  const handleSave = () => {
    const score = computeScore();
    if (score === null) return;

    const verdict = getVerdict(score);
    const entry = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
      label: location.trim() || "Unnamed Location",
      lat: center[0],
      lng: center[1],
      radiusMi,
      score,
      verdict: verdict.text,
      savedAt: new Date().toISOString(),
    };

    persistSaved([entry, ...saved]);
  };

  const handleView = (s) => {
    setCenter([s.lat, s.lng]);
    setZoom(12);
    setRadiusMi(s.radiusMi);
    setPopupText(s.label);
    setLocation(s.label);
    setLocationSet(true);
  };

  const handleDelete = (id) => {
    persistSaved(saved.filter((s) => s.id !== id));
  };

  const handleExport = () => {
    const header = "label,lat,lng,radiusMi,score,verdict,savedAt\n";
    const rows = saved.map((s) => {
      const safeLabel = `"${String(s.label).replaceAll('"', '""')}"`;
      return [
        safeLabel,
        s.lat,
        s.lng,
        s.radiusMi,
        s.score,
        `"${String(s.verdict).replaceAll('"', '""')}"`,
        s.savedAt,
      ].join(",");
    });

    const csv = header + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "franchisefit_saved_locations.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const lines = text.split("\n").filter(Boolean);
      const rows = lines.slice(1);
      const newEntries = [];

      rows.forEach((line) => {
        const parts = parseCsvLine(line);
        if (!parts || parts.length < 7) return;
        const [label, lat, lng, rMi, score, verdict, savedAt] = parts;
        newEntries.push({
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
          label: label || "Imported Location",
          lat: Number(lat),
          lng: Number(lng),
          radiusMi: Number(rMi),
          score: Number(score),
          verdict: verdict || "Imported",
          savedAt: savedAt || new Date().toISOString(),
        });
      });

      persistSaved([...newEntries, ...saved]);
    };
    reader.readAsText(file);
  };

  const enabledCount = Object.values(factors).filter((f) => f.enabled).length;

  return (
    <div className="app">
      <MapView
        center={center}
        zoom={zoom}
        radiusMi={radiusMi}
        popupText={popupText}
      />

      <div className="panel">
        {/* Header */}
        <div className="header">
          <div className="brand">
            <h1>FranchiseFit</h1>
            <p>Fast location scoring for franchise & SMB decisions.</p>
          </div>
          <div className="pill">
            <span className="pulse-dot" />
            Live Map
          </div>
        </div>

        {/* Location Controls */}
        <div className="card">
          <div className="card-label">Location</div>
          <div className="controls">
            <AddressInput
              value={location}
              onChange={(val) => {
                setLocation(val);
                if (!val.trim()) setLocationSet(false);
              }}
              onSelect={handleSelect}
            />
            <select
              value={radiusMi}
              onChange={(e) => setRadiusMi(Number(e.target.value))}
            >
              <option value={3}>3 mi</option>
              <option value={5}>5 mi</option>
              <option value={6}>6 mi</option>
            </select>
          </div>
          {locationSet && (
            <div className="location-confirmed">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>Location pinned on map</span>
            </div>
          )}
        </div>

        {/* Toggleable Factors */}
        <FactorPanel
          factors={factors}
          onFactorChange={handleFactorChange}
          onToggle={handleToggle}
        />

        {/* Analyze button */}
        <div className="card">
          <button
            className="save-btn analyze-btn"
            onClick={handleAnalyze}
            disabled={enabledCount === 0 || analyzing}
          >
            {analyzing ? (
              <>
                <span className="spinner" />
                Analyzing...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Analyze Location
              </>
            )}
          </button>
        </div>

        {/* Score — only after analysis */}
        {analyzed && analysisResult && (
          <ScoreCard factors={factors} analysisResult={analysisResult} />
        )}

        {/* Save button — only after analysis */}
        {analyzed && analysisResult && (
          <div className="card">
            <button
              className="save-btn"
              onClick={handleSave}
              disabled={enabledCount === 0}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Save Location
            </button>
          </div>
        )}

        {/* Saved Locations */}
        <SavedLocations
          saved={saved}
          onView={handleView}
          onDelete={handleDelete}
          onExport={handleExport}
          onImport={handleImport}
        />

        {/* Footer */}
        <div className="panel-footer">
          <span>FranchiseFit MVP</span>
          <span className="footer-dot" />
          <span>{enabledCount} of 5 factors active</span>
        </div>
      </div>
    </div>
  );
}
