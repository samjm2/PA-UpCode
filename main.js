// ---------- MAP ----------
const map = L.map("map", { zoomControl: true }).setView([41.9, -87.7], 10);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap',
}).addTo(map);

let radiusCircle = null;
let marker = null;

// ---------- STATE ----------
let saved = JSON.parse(localStorage.getItem("savedLocationsV2")) || [];
let lastResult = null;
let lastCenter = map.getCenter();

// ---------- ELEMENTS ----------
const analyzeBtn = document.getElementById("analyzeBtn");
const locationInput = document.getElementById("locationInput");
const radiusSelect = document.getElementById("radius");
const scoreEl = document.getElementById("score");
const verdictEl = document.getElementById("verdict");
const factorsEl = document.getElementById("factors");
const saveBtn = document.getElementById("saveBtn");
const savedList = document.getElementById("savedList");
const exportBtn = document.getElementById("exportBtn");
const importInput = document.getElementById("importInput");

// ---------- HELPERS ----------
function milesToMeters(mi) {
  return Number(mi) * 1609.344;
}

function verdictBadge(score) {
  if (score >= 85) return { text: "Excellent", cls: "ok" };
  if (score >= 75) return { text: "Strong", cls: "ok" };
  if (score >= 65) return { text: "Moderate", cls: "warn" };
  return { text: "Risky", cls: "bad" };
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// ---------- GEOCODING (FREE) ----------
async function geocode(query) {
  // Nominatim: free OpenStreetMap geocoder (light usage)
  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" +
    encodeURIComponent(query);

  const res = await fetch(url, {
    headers: {
      // Helps avoid blocking; browsers set a default UA but header is fine to include
      "Accept": "application/json",
    },
  });

  if (!res.ok) throw new Error("Geocoding failed");
  const data = await res.json();
  if (!data || !data.length) return null;

  const item = data[0];
  return {
    name: item.display_name,
    lat: Number(item.lat),
    lng: Number(item.lon),
  };
}

// ---------- MOCK ANALYSIS ----------
function analyzeMock() {
  const score = Math.floor(Math.random() * 41) + 60;

  // mock factors that feel a bit more “real”
  const factors = {
    "Median Income": rand(),
    "Rent Pressure": rand(),
    "Home Prices": rand(),
    "Competition": rand(),
    "School Quality": rand(),
  };

  const v = verdictBadge(score);
  return { score, factors, verdict: v.text, verdictClass: v.cls };
}

function rand() {
  return Math.floor(Math.random() * 41) + 60;
}

// ---------- UI UPDATE ----------
function setCircle(center) {
  const meters = milesToMeters(radiusSelect.value);

  if (radiusCircle) map.removeLayer(radiusCircle);
  radiusCircle = L.circle(center, {
    radius: meters,
    color: "#2563eb",
    weight: 2,
    fillOpacity: 0.14,
  }).addTo(map);
}

function setMarker(center, label) {
  if (marker) map.removeLayer(marker);
  marker = L.marker(center).addTo(map);
  if (label) marker.bindPopup(label).openPopup();
}

function updateUI(result) {
  lastResult = result;

  scoreEl.textContent = result.score;

  // verdict styling (badge)
  verdictEl.innerHTML = "";
  const badge = document.createElement("span");
  badge.className = `badge ${result.verdictClass}`;
  badge.textContent = result.verdict;
  verdictEl.appendChild(badge);

  // factors progress bars
  factorsEl.innerHTML = "";
  Object.entries(result.factors).forEach(([name, val]) => {
    const row = document.createElement("div");
    row.className = "factor";

    const left = document.createElement("div");
    left.innerHTML = `<div class="name">${name}</div>`;

    const right = document.createElement("div");
    right.className = "val";
    right.textContent = String(val);

    const bar = document.createElement("div");
    bar.className = "bar";
    const fill = document.createElement("div");
    // map 60–100 -> 0–100% visually
    const pct = clamp(((val - 60) / 40) * 100, 0, 100);
    fill.style.width = pct.toFixed(0) + "%";
    bar.appendChild(fill);

    const wrap = document.createElement("div");
    wrap.style.width = "100%";
    wrap.appendChild(row);
    wrap.appendChild(bar);

    // row children
    row.appendChild(left);
    row.appendChild(right);

    factorsEl.appendChild(wrap);
  });

  // map visuals
  setCircle(lastCenter);
}

// ---------- EVENTS ----------
analyzeBtn.onclick = async () => {
  const query = locationInput.value.trim();

  try {
    if (query) {
      analyzeBtn.disabled = true;
      analyzeBtn.textContent = "Analyzing...";

      const geo = await geocode(query);
      if (!geo) {
        alert("Couldn’t find that location. Try a more specific address/city.");
        return;
      }

      lastCenter = L.latLng(geo.lat, geo.lng);
      map.setView(lastCenter, 12);
      setMarker(lastCenter, geo.name);
    } else {
      // if blank, just use current map center
      lastCenter = map.getCenter();
      setMarker(lastCenter, "Map center");
    }

    const result = analyzeMock();
    updateUI(result);
  } catch (e) {
    console.error(e);
    alert("Analysis failed. Check your internet connection and try again.");
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = "Analyze";
  }
};

saveBtn.onclick = () => {
  if (!lastResult) return;

  const label = locationInput.value.trim() || "Unnamed Location";
  const now = new Date();

  const entry = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    label,
    lat: lastCenter.lat,
    lng: lastCenter.lng,
    radiusMi: Number(radiusSelect.value),
    score: lastResult.score,
    verdict: lastResult.verdict,
    savedAt: now.toISOString(),
  };

  saved.unshift(entry);
  localStorage.setItem("savedLocationsV2", JSON.stringify(saved));
  renderSaved();
};

function renderSaved() {
  savedList.innerHTML = "";

  if (!saved.length) {
    const empty = document.createElement("li");
    empty.className = "small";
    empty.textContent = "No saved locations yet — analyze a location and hit Save.";
    savedList.appendChild(empty);
    return;
  }

  saved.forEach((s) => {
    const li = document.createElement("li");
    li.className = "savedItem";

    const meta = document.createElement("div");
    meta.className = "savedMeta";

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = `${s.label}`;

    const sub = document.createElement("div");
    sub.className = "sub";
    const date = new Date(s.savedAt);
    sub.textContent = `Score ${s.score} • ${s.verdict} • ${s.radiusMi} mi • ${date.toLocaleString()}`;

    meta.appendChild(title);
    meta.appendChild(sub);

    const btns = document.createElement("div");
    btns.style.display = "flex";
    btns.style.gap = "8px";

    const goBtn = document.createElement("button");
    goBtn.className = "secondary";
    goBtn.textContent = "View";
    goBtn.onclick = () => {
      lastCenter = L.latLng(s.lat, s.lng);
      radiusSelect.value = String(s.radiusMi);
      map.setView(lastCenter, 12);
      setMarker(lastCenter, s.label);
      setCircle(lastCenter);
      updateUI({
        score: s.score,
        factors: lastResult?.factors || {
          "Median Income": 80,
          "Rent Pressure": 75,
          "Home Prices": 78,
          "Competition": 70,
          "School Quality": 82,
        },
        verdict: s.verdict,
        verdictClass: verdictBadge(s.score).cls,
      });
    };

    const delBtn = document.createElement("button");
    delBtn.className = "secondary";
    delBtn.textContent = "Delete";
    delBtn.onclick = () => {
      saved = saved.filter(x => x.id !== s.id);
      localStorage.setItem("savedLocationsV2", JSON.stringify(saved));
      renderSaved();
    };

    btns.appendChild(goBtn);
    btns.appendChild(delBtn);

    li.appendChild(meta);
    li.appendChild(btns);

    savedList.appendChild(li);
  });
}

// ---------- CSV EXPORT / IMPORT ----------
exportBtn.onclick = () => {
  const header = "label,lat,lng,radiusMi,score,verdict,savedAt\n";
  const rows = saved.map(s => {
    // escape quotes in label
    const safeLabel = `"${String(s.label).replaceAll('"', '""')}"`;
    return [
      safeLabel,
      s.lat,
      s.lng,
      s.radiusMi,
      s.score,
      `"${String(s.verdict).replaceAll('"', '""')}"`,
      s.savedAt
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

importInput.onchange = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const text = String(reader.result || "");
    const lines = text.split("\n").filter(Boolean);

    // Expect header row
    const rows = lines.slice(1);
    rows.forEach((line) => {
      const parts = parseCsvLine(line);
      if (!parts || parts.length < 7) return;

      const [label, lat, lng, radiusMi, score, verdict, savedAt] = parts;

      saved.unshift({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
        label: label || "Imported Location",
        lat: Number(lat),
        lng: Number(lng),
        radiusMi: Number(radiusMi),
        score: Number(score),
        verdict: verdict || "Imported",
        savedAt: savedAt || new Date().toISOString(),
      });
    });

    localStorage.setItem("savedLocationsV2", JSON.stringify(saved));
    renderSaved();
  };

  reader.readAsText(file);
};

// Minimal CSV parser for a single line with quoted fields
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
  return out.map(s => s.replace(/^"|"$/g, ""));
}

// ---------- INIT ----------
renderSaved();
updateUI(analyzeMock());
setCircle(lastCenter);
setMarker(lastCenter, "Chicago (default)");

// ---------- FETCH SCHOOLS FUNCTION ----------
/**
 * Fetch nearby schools from the API.
 * @param {string} address - The address to search for nearby schools.
 * @param {number} radius - The radius in miles to search within.
 * @returns {Promise<Array>} - A promise that resolves to an array of school objects.
 */
async function fetchNearbySchools(address, radius) {
  const url = `http://127.0.0.1:5000/api/find-schools?address=${encodeURIComponent(address)}&radius=${radius}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch nearby schools");
  }

  return await response.json();
}
