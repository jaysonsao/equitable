import { useCallback, useEffect, useRef, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, Legend, CartesianGrid, ReferenceLine,
} from "recharts";

function SplashScreen({ onDone }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 2200);
    const doneTimer = setTimeout(() => onDone(), 2800);
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer); };
  }, [onDone]);

  return (
    <div className={`splash${fading ? " splash--fade" : ""}`}>
      <div className="splash-icon">
        {/* Market cart SVG */}
        <svg viewBox="0 0 80 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="splash-cart">
          <rect x="10" y="20" width="52" height="30" rx="4" fill="#ffffff" stroke="#0b6e4f" strokeWidth="2.5"/>
          <polyline points="4,8 14,8 24,50 56,50 64,24 14,24" fill="none" stroke="#0b6e4f" strokeWidth="2.5" strokeLinejoin="round"/>
          <circle cx="28" cy="60" r="5" fill="#0b6e4f"/>
          <circle cx="52" cy="60" r="5" fill="#0b6e4f"/>
          {/* Map pin inside cart */}
          <path d="M40 18 C40 18 32 26 32 32 C32 36.4 35.6 40 40 40 C44.4 40 48 36.4 48 32 C48 26 40 18 40 18Z" fill="#F59E0B" stroke="#d97706" strokeWidth="1.5"/>
          <circle cx="40" cy="32" r="3.5" fill="#ffffff"/>
        </svg>
        <p className="splash-title">Boston Food  Mapping System</p>
        <p className="splash-sub">Mapping access across neighborhoods</p>
      </div>
    </div>
  );
}

const BOSTON_CENTER = { lat: 42.3601, lng: -71.0589 };
const BOSTON_GEOJSON = "/data/boston_neighborhood_boundaries.geojson";
const COUNTY_COLOR = "#2A9D8F";

const BASE_MAP_STYLES = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "transit.station", stylers: [{ visibility: "off" }] },
];

const MAP_THEME_STYLES = {
  civic: [
    { elementType: "geometry", stylers: [{ color: "#f7f4ee" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#d7e6f2" }] },
  ],
  gray: [
    { elementType: "geometry", stylers: [{ color: "#eceff1" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#d4dbe0" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  ],
  blueprint: [
    { elementType: "geometry", stylers: [{ color: "#e8f1f8" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#b7d4ea" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#f8fbff" }] },
  ],
};

const BOSTON_FALLBACK_BOUNDS = {
  north: 42.431,
  south: 42.228,
  east: -70.986,
  west: -71.191,
};
const MASSACHUSETTS_BOUNDS = {
  north: 42.88679,
  south: 41.18705,
  east: -69.85886,
  west: -73.50814,
};

const NEIGHBORHOOD_NAMES = [
  "Allston","Back Bay","Beacon Hill","Brighton","Charlestown","Chinatown",
  "Dorchester","Downtown","East Boston","Fenway","Hyde Park","Jamaica Plain",
  "Mattapan","Mission Hill","North End","Roslindale","Roxbury","South Boston",
  "South End","West End","West Roxbury","Whittier Street","Longwood",
  "Harbor Islands","East Boston",
];

function CompareBar({ label, valueA, valueB, format = (v) => (v ?? 0).toFixed(1) }) {
  const max = Math.max(valueA || 0, valueB || 0, 0.001);
  return (
    <div className="cmp-row">
      <span className="cmp-row-label">{label}</span>
      <div className="cmp-bars">
        <div className="cmp-bar-wrap">
          <div className="cmp-bar cmp-bar-a" style={{ width: `${((valueA || 0) / max) * 100}%` }} />
          <span className="cmp-val">{format(valueA)}</span>
        </div>
        <div className="cmp-bar-wrap">
          <div className="cmp-bar cmp-bar-b" style={{ width: `${((valueB || 0) / max) * 100}%` }} />
          <span className="cmp-val">{format(valueB)}</span>
        </div>
      </div>
    </div>
  );
}

function ComparisonDashboard() {
  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");
  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);
  const [povMap, setPovMap] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/neighborhood-stats")
      .then((r) => r.json())
      .then((rows) => {
        const m = new Map();
        rows.forEach((r) => m.set(r.name, r.poverty_rate));
        setPovMap(m);
      })
      .catch(() => {});
  }, []);

  async function compare() {
    const a = nameA.trim();
    const b = nameB.trim();
    if (!a || !b) { setError("Enter both neighborhood names."); return; }
    if (a.toLowerCase() === b.toLowerCase()) { setError("Choose two different neighborhoods."); return; }
    setLoading(true);
    setError("");
    setDataA(null);
    setDataB(null);
    try {
      const [resA, resB] = await Promise.all([
        fetch(`/api/neighborhood-metrics?name=${encodeURIComponent(a)}`),
        fetch(`/api/neighborhood-metrics?name=${encodeURIComponent(b)}`),
      ]);
      const [mA, mB] = await Promise.all([resA.json(), resB.json()]);
      if (!resA.ok) throw new Error(mA?.error || `"${a}" not found`);
      if (!resB.ok) throw new Error(mB?.error || `"${b}" not found`);
      setDataA({ ...mA, poverty_rate: povMap.get(a) });
      setDataB({ ...mB, poverty_rate: povMap.get(b) });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const fmt = (v, d = 0) => v != null && !isNaN(v) ? Number(v).toLocaleString(undefined, { maximumFractionDigits: d }) : "N/A";
  const fmtPct = (v) => v != null ? `${(v * 100).toFixed(1)}%` : "N/A";
  const fmtDec = (v) => v != null ? Number(v).toFixed(2) : "N/A";

  const FOOD_KEYS = [
    { key: "restaurants", label: "Restaurants" },
    { key: "grocery_stores", label: "Grocery Stores" },
    { key: "farmers_markets", label: "Farmers Markets" },
    { key: "food_pantries", label: "Food Pantries" },
  ];

  return (
    <div className="cmp-panel">
      <p className="lede" style={{ padding: "0.6rem 1rem 0", margin: 0 }}>Enter two neighborhoods to compare food access side by side.</p>

      <div className="panel-section">
        <div className="cmp-inputs">
          <div className="cmp-input-wrap">
            <span className="cmp-badge cmp-badge-a">A</span>
            <input
              className="search-input"
              list="hood-list-a"
              placeholder="e.g. Roxbury"
              value={nameA}
              onChange={(e) => setNameA(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && compare()}
            />
            <datalist id="hood-list-a">
              {NEIGHBORHOOD_NAMES.map((n) => <option key={n} value={n} />)}
            </datalist>
          </div>
          <div className="cmp-input-wrap">
            <span className="cmp-badge cmp-badge-b">B</span>
            <input
              className="search-input"
              list="hood-list-b"
              placeholder="e.g. Back Bay"
              value={nameB}
              onChange={(e) => setNameB(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && compare()}
            />
            <datalist id="hood-list-b">
              {NEIGHBORHOOD_NAMES.map((n) => <option key={n} value={n} />)}
            </datalist>
          </div>
        </div>
        <button className="search-btn" style={{ width: "100%" }} onClick={compare} disabled={loading}>
          {loading ? "Loading…" : "Compare"}
        </button>
        {error && <p className="status status-error">{error}</p>}
      </div>

      {dataA && dataB && (
        <>
          {/* Names header */}
          <div className="cmp-header-row">
            <span className="cmp-hood-name cmp-hood-a">{dataA.neighborhood || nameA}</span>
            <span className="cmp-vs">vs</span>
            <span className="cmp-hood-name cmp-hood-b">{dataB.neighborhood || nameB}</span>
          </div>

          {/* Overview stats */}
          <div className="panel-section">
            <p className="section-label">Overview</p>
            <table className="cmp-table">
              <thead>
                <tr>
                  <th></th>
                  <th className="cmp-th-a">{dataA.neighborhood || nameA}</th>
                  <th className="cmp-th-b">{dataB.neighborhood || nameB}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Population</td>
                  <td>{fmt(dataA.population)}</td>
                  <td>{fmt(dataB.population)}</td>
                </tr>
                <tr>
                  <td>Poverty Rate</td>
                  <td>{fmtPct(dataA.poverty_rate)}</td>
                  <td>{fmtPct(dataB.poverty_rate)}</td>
                </tr>
                <tr>
                  <td>Avg Gini</td>
                  <td>{fmtDec(dataA.income?.avg_gini_for_neighborhood)}</td>
                  <td>{fmtDec(dataB.income?.avg_gini_for_neighborhood)}</td>
                </tr>
                <tr>
                  <td>Total Access Points</td>
                  <td>{fmt(dataA.totals?.access_points)}</td>
                  <td>{fmt(dataB.totals?.access_points)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Food counts bar chart */}
          <div className="panel-section">
            <p className="section-label">Food Location Counts</p>
            <div className="cmp-legend">
              <span className="cmp-swatch cmp-swatch-a" />{dataA.neighborhood || nameA}
              <span className="cmp-swatch cmp-swatch-b" style={{ marginLeft: "12px" }} />{dataB.neighborhood || nameB}
            </div>
            {FOOD_KEYS.map(({ key, label }) => (
              <CompareBar
                key={key}
                label={label}
                valueA={dataA.counts?.[key] ?? 0}
                valueB={dataB.counts?.[key] ?? 0}
                format={(v) => String(v ?? 0)}
              />
            ))}
          </div>

          {/* Per 1,000 bar chart */}
          <div className="panel-section">
            <p className="section-label">Per 1,000 Residents</p>
            {FOOD_KEYS.map(({ key, label }) => (
              <CompareBar
                key={key}
                label={label}
                valueA={dataA.per_1000?.[key] ?? 0}
                valueB={dataB.per_1000?.[key] ?? 0}
                format={(v) => Number(v ?? 0).toFixed(2)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const PLACE_TYPE_COLORS = {
  farmers_market: "#F59E0B",
  restaurant: "#10B981",
  grocery_store: "#3B82F6",
  food_pantry: "#1a1917",
};

const PLACE_TYPE_LABELS = {
  farmers_market: "Farmers Market",
  restaurant: "Restaurant",
  grocery_store: "Grocery Store",
};

// Map Gini score t∈[0,1] to a color: light yellow → dark red
function giniToColor(t) {
  const r = Math.round(255 + (128 - 255) * t);
  const g = Math.round(255 + (0 - 255) * t);
  const b = Math.round(204 + (38 - 204) * t);
  return `rgb(${r},${g},${b})`;
}

const GOOGLE_MAPS_API_KEY =
  typeof __GOOGLE_MAPS_API__ === "string" ? __GOOGLE_MAPS_API__.trim() : "";

const MIN_RADIUS_MILES = 0.5;
const DEFAULT_RADIUS_MILES = 0.5;
const DEFAULT_LIMIT = 350;
const PREVIEW_SAMPLE_PCT = 0.1;
const METERS_PER_MILE = 1609.344;

function getNeighborhoodName(feature) {
  const name = feature.getProperty("name");
  return typeof name === "string" && name.trim() ? name.trim() : "Unknown Neighborhood";
}

function getMapStyles(theme) {
  const themeStyles = MAP_THEME_STYLES[theme] || MAP_THEME_STYLES.civic;
  return [...BASE_MAP_STYLES, ...themeStyles];
}

function expandBoundsLiteral(bounds, latPad, lngPad) {
  return {
    north: bounds.north + latPad,
    south: bounds.south - latPad,
    east: bounds.east + lngPad,
    west: bounds.west - lngPad,
  };
}

function toBoundsLiteral(bounds) {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  return { north: ne.lat(), south: sw.lat(), east: ne.lng(), west: sw.lng() };
}

function extendBoundsFromGeometry(bounds, geometry) {
  const type = geometry.getType();
  if (type === "Point") {
    bounds.extend(geometry.get());
    return;
  }

  if (type === "MultiPoint" || type === "LineString" || type === "LinearRing") {
    geometry.getArray().forEach((latLng) => bounds.extend(latLng));
    return;
  }

  if (type === "Polygon" || type === "MultiLineString") {
    geometry.getArray().forEach((inner) => extendBoundsFromGeometry(bounds, inner));
    return;
  }

  if (type === "MultiPolygon" || type === "GeometryCollection") {
    geometry.getArray().forEach((inner) => extendBoundsFromGeometry(bounds, inner));
  }
}

function loadGoogleMaps(apiKey) {
  if (!apiKey) return Promise.reject(new Error("Missing GOOGLE_MAPS_API in .env."));
  if (window.google?.maps?.geometry) return Promise.resolve(window.google.maps);

  return new Promise((resolve, reject) => {
    const existing = document.getElementById("google-maps-js");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google.maps), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Maps failed to load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-js";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error("Google Maps failed to load."));
    document.head.appendChild(script);
  });
}

function buildMarkerIcon(placeType) {
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: 8,
    fillColor: PLACE_TYPE_COLORS[placeType] || "#6B7280",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
  };
}

const CHART_ITEMS = [
  { key: "restaurants",    label: "Restaurants",    color: "#10B981" },
  { key: "grocery_stores", label: "Grocery",        color: "#3B82F6" },
  { key: "farmers_markets",label: "Markets",        color: "#F59E0B" },
  { key: "food_pantries",  label: "Pantries",       color: "#1a1917" },
];

function NeighborhoodChartsModal({ neighborhood, metrics, onClose }) {
  const [citywide, setCitywide] = useState(null);
  const [cwLoading, setCwLoading] = useState(true);

  useEffect(() => {
    fetch("/api/citywide-averages")
      .then((r) => r.json())
      .then((d) => setCitywide(d))
      .catch(() => setCitywide(null))
      .finally(() => setCwLoading(false));
  }, []);

  const per1k = metrics.per_1000 ?? {};
  const giniNeighborhood = metrics.income?.avg_gini_for_neighborhood;
  const giniCitywide     = metrics.income?.avg_gini_citywide;
  const giniAbove = giniNeighborhood != null && giniCitywide != null && giniNeighborhood > giniCitywide;
  const giniPct   = giniNeighborhood != null ? Math.min(giniNeighborhood / 0.7, 1) * 100 : null;

  // Grouped bar: neighborhood vs citywide per-1k
  const cwAvg = citywide?.citywide_avg_per_1000 ?? {};
  const groupedData = CHART_ITEMS.map((item) => ({
    name: item.label,
    neighborhood: Number((per1k[item.key] ?? 0).toFixed(2)),
    citywide: Number((cwAvg[item.key] ?? 0).toFixed(2)),
    color: item.color,
  }));

  // Line chart: all neighborhoods' per-1k by food type (top 20 by total)
  const lineData = (citywide?.neighborhoods ?? []).slice(0, 20).map((n) => ({
    name: n.neighborhood.length > 12 ? n.neighborhood.slice(0, 11) + "…" : n.neighborhood,
    Restaurants: n.restaurant ?? 0,
    Grocery: n.grocery_store ?? 0,
    Markets: n.farmers_market ?? 0,
    Pantries: n.food_pantry ?? 0,
    _isSelected: n.neighborhood.toLowerCase() === neighborhood.toLowerCase(),
  }));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{neighborhood} — Food Access Charts</span>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* ── Grouped bar: neighborhood vs citywide ── */}
        <div className="modal-section">
          <p className="modal-section-label">Food Access — Neighborhood vs Boston Avg (per 1,000 residents)</p>
          {cwLoading ? (
            <p style={{ fontSize: "0.78rem", color: "#6b6560", fontStyle: "italic" }}>Loading citywide data…</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={groupedData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2ddd6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v, name) => [v, name === "neighborhood" ? neighborhood : "Boston Avg"]} />
                <Legend formatter={(v) => v === "neighborhood" ? neighborhood : "Boston Avg"} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="neighborhood" radius={[3, 3, 0, 0]}>
                  {groupedData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
                <Bar dataKey="citywide" fill="#d1c9be" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Line chart: all neighborhoods comparison ── */}
        {!cwLoading && lineData.length > 0 && (
          <div className="modal-section">
            <p className="modal-section-label">City-wide Comparison — Per 1,000 Residents (top 20 neighborhoods)</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lineData} margin={{ top: 4, right: 8, left: -16, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2ddd6" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-40} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Restaurants" stroke="#10B981" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="Grocery"     stroke="#3B82F6" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="Markets"     stroke="#F59E0B" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="Pantries"    stroke="#1a1917" dot={false} strokeWidth={2} />
                {lineData.findIndex((d) => d._isSelected) >= 0 && (
                  <ReferenceLine
                    x={lineData.find((d) => d._isSelected)?.name}
                    stroke="#0b6e4f"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                    label={{ value: "← here", position: "top", fontSize: 9, fill: "#0b6e4f" }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Gini bar ── */}
        {giniPct != null && (
          <div className="modal-section">
            <p className="modal-section-label">Income Inequality (Gini Index)</p>
            <div className="gini-bar-track">
              <div
                className="gini-bar-fill"
                style={{ width: `${giniPct}%`, background: giniAbove ? "#b5001f" : "#0b6e4f" }}
              />
            </div>
            <div className="gini-bar-labels">
              <span>{neighborhood}: {giniNeighborhood?.toFixed(3)}</span>
              {giniCitywide != null && <span>Citywide avg: {giniCitywide?.toFixed(3)}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const infoWindowRef = useRef(null);
  const bostonBoundsRef = useRef(null);
  const neighborhoodNamesRef = useRef(new Set());
  const activeMarkersRef = useRef([]);
  const incomeMapRef = useRef(new Map()); // neighborhood name → poverty rate
  const giniRangeRef = useRef({ min: 0.3, max: 0.55 });
  const showChoroplethRef = useRef(true);
  const pinMarkerRef = useRef(null);
  const centerMarkerRef = useRef(null);
  const radiusCircleRef = useRef(null);

  const [showSplash, setShowSplash] = useState(true);
  const [status, setStatus] = useState("Loading map...");
  const [error, setError] = useState("");
  const mapTheme = "civic";
  const [mapScope, setMapScope] = useState("boston");
  const [showChoropleth, setShowChoropleth] = useState(true);
  const [giniRange, setGiniRange] = useState({ min: 0.3, max: 0.55 });

  const [nlQuery, setNlQuery] = useState("");
  const [parsedIntent, setParsedIntent] = useState(null);
  const [nlSearching, setNlSearching] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [radiusMiles, setRadiusMiles] = useState(String(DEFAULT_RADIUS_MILES));
  const [droppedPin, setDroppedPin] = useState(null);
  const [previewResults, setPreviewResults] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchCenter, setSearchCenter] = useState(null);
  const [lastSearchSource, setLastSearchSource] = useState("");
  const [lastResolvedAddress, setLastResolvedAddress] = useState("");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("");
  const [neighborhoodMetrics, setNeighborhoodMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState("");
  const [showChartsModal, setShowChartsModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const applyMapViewportSettings = useCallback((scope, theme, fitToScope = false) => {
    const map = mapRef.current;
    if (!map) return;

    const scopeBounds =
      scope === "massachusetts"
        ? MASSACHUSETTS_BOUNDS
        : (bostonBoundsRef.current || BOSTON_FALLBACK_BOUNDS);

    map.setOptions({
      styles: getMapStyles(theme),
      restriction: { latLngBounds: scopeBounds, strictBounds: true },
      minZoom: scope === "massachusetts" ? 7 : 10,
      maxZoom: 17,
    });
    if (fitToScope) {
      const padding = scope === "massachusetts" ? 24 : 40;
      window.google.maps.event.addListenerOnce(map, "idle", () => {
        map.fitBounds(scopeBounds, padding);
        window.google.maps.event.trigger(map, "resize");
      });
    }
  }, []);

  const refreshBoundaryStyles = useCallback(() => {
    if (!mapRef.current) return;
    mapRef.current.data.setStyle((feature) => {
      const name = getNeighborhoodName(feature);
      const choropleth = showChoroplethRef.current;
      const rate = incomeMapRef.current.get(name);
      const { min, max } = giniRangeRef.current;

      let fillColor = COUNTY_COLOR;
      let fillOpacity = 0.2;

      if (choropleth && rate != null) {
        const t = Math.max(0, Math.min(1, (rate - min) / (max - min)));
        fillColor = giniToColor(t);
        fillOpacity = 0.7;
      }

      return {
        clickable: true,
        fillColor,
        fillOpacity,
        strokeColor: "#555",
        strokeOpacity: 0.5,
        strokeWeight: 1,
      };
    });
  }, []);

  const clearResultMarkers = useCallback(() => {
    activeMarkersRef.current.forEach((marker) => marker.setMap(null));
    activeMarkersRef.current = [];
  }, []);

  const clearSearchOverlay = useCallback(() => {
    if (centerMarkerRef.current) {
      centerMarkerRef.current.setMap(null);
      centerMarkerRef.current = null;
    }
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setMap(null);
      radiusCircleRef.current = null;
    }
  }, []);

  const renderSearchOverlay = useCallback((center, radiusInMiles) => {
    const map = mapRef.current;
    if (!map || !center) return;

    clearSearchOverlay();

    centerMarkerRef.current = new window.google.maps.Marker({
      map,
      position: center,
      title: "Search center",
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 7,
        fillColor: "#B91C1C",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
    });

    radiusCircleRef.current = new window.google.maps.Circle({
      map,
      center,
      radius: radiusInMiles * METERS_PER_MILE,
      strokeColor: "#B91C1C",
      strokeOpacity: 0.85,
      strokeWeight: 2,
      fillColor: "#FCA5A5",
      fillOpacity: 0.15,
    });
  }, [clearSearchOverlay]);

  const filterResultsByScope = useCallback((results) => {
    if (!Array.isArray(results)) return [];

    if (mapScope === "massachusetts") {
      return results.filter((item) => item.lat != null && item.lng != null);
    }

    const bounds = bostonBoundsRef.current;
    const knownNeighborhoods = neighborhoodNamesRef.current;

    return results.filter((item) => {
      if (item.lat == null || item.lng == null) return false;

      if (bounds) {
        const inBounds =
          item.lat <= bounds.north &&
          item.lat >= bounds.south &&
          item.lng <= bounds.east &&
          item.lng >= bounds.west;
        if (!inBounds) return false;
      }

      if (!knownNeighborhoods.size) return true;
      const neighborhood = String(item.neighborhood || "").trim();
      return neighborhood ? knownNeighborhoods.has(neighborhood) : false;
    });
  }, [mapScope]);

  const placeMarkers = useCallback((results, center, radiusInMiles) => {
    const map = mapRef.current;
    if (!map) return;

    clearResultMarkers();
    renderSearchOverlay(center, radiusInMiles);

    results.forEach((item) => {
      if (item.lat == null || item.lng == null) return;

      const marker = new window.google.maps.Marker({
        map,
        position: { lat: item.lat, lng: item.lng },
        title: item.name,
        icon: buildMarkerIcon(item.place_type),
      });

      marker.addListener("click", () => {
        const wrapper = document.createElement("div");
        wrapper.className = "info-window";

        const title = document.createElement("strong");
        title.textContent = item.name || "Unknown";

        const typeTag = document.createElement("div");
        typeTag.className = "info-window-muted";
        typeTag.textContent = PLACE_TYPE_LABELS[item.place_type] || item.place_type || "Unknown Type";

        const address = document.createElement("div");
        address.textContent = item.address || item.city || "No address";

        const neighborhood = document.createElement("div");
        neighborhood.className = "info-window-muted";
        neighborhood.textContent = item.neighborhood || "";

        wrapper.appendChild(title);
        wrapper.appendChild(typeTag);
        wrapper.appendChild(address);
        if (item.neighborhood) wrapper.appendChild(neighborhood);

        infoWindowRef.current.setContent(wrapper);
        infoWindowRef.current.open({ map, anchor: marker });
      });

      activeMarkersRef.current.push(marker);
    });

    if (center) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(center);
      results.forEach((item) => {
        if (item.lat == null || item.lng == null) return;
        bounds.extend({ lat: item.lat, lng: item.lng });
      });
      map.fitBounds(bounds, 90);
    }
  }, [clearResultMarkers, renderSearchOverlay]);

  const restorePreview = useCallback(() => {
    if (previewResults.length > 0) {
      placeMarkers(previewResults, null, DEFAULT_RADIUS_MILES);
      setStatus(
        `Map ready. Showing ${previewResults.length} sampled locations (10%). Enter an address or drop a pin.`
      );
    } else {
      clearResultMarkers();
      clearSearchOverlay();
      setStatus("Map ready. Enter an address or drop a pin, then search by radius.");
    }
  }, [clearResultMarkers, clearSearchOverlay, placeMarkers, previewResults]);

  useEffect(() => {
    applyMapViewportSettings(mapScope, mapTheme, false);
  }, [mapScope, mapTheme, applyMapViewportSettings]);

  useEffect(() => {
    if (showSplash) return;
    let active = true;

    async function init() {
      try {
        setStatus("Loading Google Maps...");
        await loadGoogleMaps(GOOGLE_MAPS_API_KEY);
        if (!active || !mapElRef.current) return;

        const map = new window.google.maps.Map(mapElRef.current, {
          center: BOSTON_CENTER,
          zoom: 11,
          fullscreenControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          styles: getMapStyles(mapTheme),
          gestureHandling: "greedy",
          isFractionalZoomEnabled: true,
        });

        mapRef.current = map;
        infoWindowRef.current = new window.google.maps.InfoWindow();
        window.google.maps.event.trigger(map, "resize");

        setStatus("Loading neighborhood boundaries...");
        const [response, incomeRes] = await Promise.all([
          fetch(BOSTON_GEOJSON),
          fetch("/api/neighborhood-stats"),
        ]);
        if (!response.ok) throw new Error(`Boundary file failed to load (${response.status}).`);

        if (incomeRes.ok) {
          const incomeData = await incomeRes.json();
          const incomeMap = new Map();
          incomeData.forEach((d) => {
            const name = d["name"]?.trim();
            const rate = parseFloat(d["poverty_rate"]);
            if (name && !isNaN(rate)) incomeMap.set(name, rate);
          });
          incomeMapRef.current = incomeMap;
          if (incomeMap.size > 0) {
            const values = [...incomeMap.values()];
            const min = Math.min(...values);
            const max = Math.max(...values);
            giniRangeRef.current = { min, max };
            setGiniRange({ min, max });
          }
        }


        const geoJson = await response.json();
        map.data.addGeoJson(geoJson);
        const bounds = new window.google.maps.LatLngBounds();
        const names = new Set();
        map.data.forEach((feature) => {
          names.add(getNeighborhoodName(feature));
          const geometry = feature.getGeometry();
          if (geometry) extendBoundsFromGeometry(bounds, geometry);
        });
        neighborhoodNamesRef.current = names;
        if (!bounds.isEmpty()) {
          bostonBoundsRef.current = expandBoundsLiteral(toBoundsLiteral(bounds), 0.02, 0.03);
        }

        refreshBoundaryStyles();
        applyMapViewportSettings(mapScope, mapTheme, true);
        setTimeout(() => window.google.maps.event.trigger(map, "resize"), 100);

        map.data.addListener("click", async (event) => {
          const name = getNeighborhoodName(event.feature);
          const nextPin = { lat: event.latLng.lat(), lng: event.latLng.lng() };
          setDroppedPin(nextPin);
          setSelectedNeighborhood(name);
          setMetricsError("");
          setMetricsLoading(true);

          try {
            const metricsResponse = await fetch(
              `/api/neighborhood-metrics?name=${encodeURIComponent(name)}`
            );
            const metricsData = await metricsResponse.json();
            if (!metricsResponse.ok) {
              throw new Error(metricsData?.error || `Neighborhood metrics failed (${metricsResponse.status})`);
            }
            if (!active) return;
            setNeighborhoodMetrics(metricsData);
          } catch (err) {
            if (!active) return;
            setNeighborhoodMetrics(null);
            setMetricsError(err.message || "Failed to load neighborhood metrics.");
          } finally {
            if (active) setMetricsLoading(false);
          }

          const content = document.createElement("strong");
          content.textContent = `${name} (pin set)`;
          infoWindowRef.current.setPosition(event.latLng);
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(map);
        });

        map.addListener("click", (event) => {
          const nextPin = { lat: event.latLng.lat(), lng: event.latLng.lng() };
          setDroppedPin(nextPin);
        });

        setStatus("Loading sampled locations...");
        const previewResponse = await fetch(`/api/food-distributors?sample_pct=${PREVIEW_SAMPLE_PCT}`);
        if (!previewResponse.ok) {
          throw new Error(`Preview data failed to load (${previewResponse.status}).`);
        }
        const previewData = await previewResponse.json();
        if (!active) return;

        const previewRaw = Array.isArray(previewData) ? previewData : [];
        const previewFiltered = filterResultsByScope(previewRaw);
        const filteredOut = previewRaw.length - previewFiltered.length;

        setPreviewResults(previewFiltered);
        if (previewFiltered.length > 0) {
          placeMarkers(previewFiltered, null, DEFAULT_RADIUS_MILES);
          setStatus(
            `Map ready. Showing ${previewFiltered.length} sampled locations (10%).${
              filteredOut > 0 ? ` ${filteredOut} outside Boston hidden.` : ""
            } Enter an address or drop a pin.`
          );
        } else {
          setStatus("Map ready. No in-Boston preview locations returned.");
        }
      } catch (err) {
        if (!active) return;
        setError(err.message);
        setStatus("Could not initialize the map.");
      }
    }

    init();
    return () => {
      active = false;
      clearResultMarkers();
      clearSearchOverlay();
      neighborhoodNamesRef.current = new Set();
      if (pinMarkerRef.current) {
        pinMarkerRef.current.setMap(null);
        pinMarkerRef.current = null;
      }
    };
  }, [
    applyMapViewportSettings,
    clearResultMarkers,
    clearSearchOverlay,
    mapTheme,
    filterResultsByScope,
    placeMarkers,
    refreshBoundaryStyles,
    showSplash,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!droppedPin) {
      if (pinMarkerRef.current) {
        pinMarkerRef.current.setMap(null);
        pinMarkerRef.current = null;
      }
      return;
    }

    if (!pinMarkerRef.current) {
      pinMarkerRef.current = new window.google.maps.Marker({
        map,
        position: droppedPin,
        title: "Dropped pin",
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: "#1D4ED8",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 1.5,
        },
      });
    } else {
      pinMarkerRef.current.setPosition(droppedPin);
      pinMarkerRef.current.setMap(map);
    }
  }, [droppedPin]);

  async function runRadiusSearch(sourceHint, overrideAddress = null, overridePlaceType = null) {
    setError("");

    const parsedRadius = Number.parseFloat(radiusMiles);
    if (!Number.isFinite(parsedRadius) || parsedRadius < MIN_RADIUS_MILES) {
      setError(`Radius must be at least ${MIN_RADIUS_MILES} miles.`);
      return;
    }

    const preferAddress = sourceHint === "address";
    const preferPin = sourceHint === "pin";
    const effectiveAddress = overrideAddress ?? addressInput;
    const hasAddress = effectiveAddress.trim().length > 0;
    const useAddress = preferAddress || (!preferPin && hasAddress);

    const payload = {
      radius_miles: parsedRadius,
      limit: DEFAULT_LIMIT,
    };
    const effectivePlaceType = overridePlaceType ?? selectedType;
    if (effectivePlaceType) payload.place_type = effectivePlaceType;

    if (useAddress) {
      if (!hasAddress) {
        setError("Enter an address before searching by address.");
        return;
      }
      payload.address = effectiveAddress.trim();
    } else {
      if (!droppedPin) {
        setError("Drop a pin on the map before searching by pin.");
        return;
      }
      payload.pin = droppedPin;
    }

    setSearching(true);
    setHasSearched(true);
    setLastResolvedAddress("");
    try {
      const response = await fetch("/api/food-distributors/search-radius", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || `Search failed (${response.status})`);
      }
      const rawResults = data.results || [];
      const filteredResults = filterResultsByScope(rawResults);
      const filteredOut = rawResults.length - filteredResults.length;

      setSearchResults(filteredResults);
      setSearchCenter(data.search_center || null);
      setLastSearchSource(data.search_source || (useAddress ? "address" : "pin"));
      if (data?.geocode?.formatted_address) {
        setLastResolvedAddress(data.geocode.formatted_address);
      }

      placeMarkers(filteredResults, data.search_center || null, parsedRadius);
      setStatus(
        `Found ${filteredResults.length} in-Boston location(s) within ${parsedRadius} miles.${
          filteredOut > 0 ? ` ${filteredOut} outside Boston hidden.` : ""
        }`
      );
    } catch (err) {
      setSearchResults([]);
      setSearchCenter(null);
      restorePreview();
      setError(err.message || "Search failed");
    } finally {
      setSearching(false);
    }
  }

  function clearSearchState() {
    setSearchResults([]);
    setSearchCenter(null);
    setHasSearched(false);
    setLastSearchSource("");
    setLastResolvedAddress("");
    restorePreview();
  }

  async function runNlSearch() {
    if (!nlQuery.trim()) return;
    setNlSearching(true);
    setError("");
    setParsedIntent(null);
    try {
      const res = await fetch("/api/gemini/parse-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: nlQuery }),
      });
      const intent = await res.json();
      if (!res.ok) throw new Error(intent?.error || "Gemini parse failed");
      setParsedIntent(intent);
      // Apply extracted place_type as the active filter chip
      if (intent.place_type) setSelectedType(intent.place_type);
      // Use extracted address or neighborhood for the radius search
      if (intent.address) {
        setAddressInput(intent.address);
        await runRadiusSearch("address", intent.address, intent.place_type);
      } else if (intent.neighborhood) {
        setAddressInput(intent.neighborhood + ", Boston, MA");
        await runRadiusSearch("address", intent.neighborhood + ", Boston, MA", intent.place_type);
      } else if (droppedPin) {
        await runRadiusSearch("pin", null, intent.place_type);
      } else {
        setError("Gemini couldn't find a location in your query. Try adding a neighborhood or address.");
      }
    } catch (err) {
      setError(err.message || "Smart search failed");
    } finally {
      setNlSearching(false);
    }
  }

  function clearAll() {
    setNlQuery("");
    setParsedIntent(null);
    setAddressInput("");
    setSelectedType("");
    setRadiusMiles(String(DEFAULT_RADIUS_MILES));
    setDroppedPin(null);
    clearSearchState();
  }

  const formatMetric = (value, digits = 2) => {
    if (value == null || Number.isNaN(value)) return "N/A";
    return Number(value).toFixed(digits);
  };

  const neighborhoodPovertyRate = selectedNeighborhood ? incomeMapRef.current.get(selectedNeighborhood) ?? null : null;

  const shownCount = hasSearched ? searchResults.length : previewResults.length;

  if (showSplash) return <SplashScreen onDone={() => setShowSplash(false)} />;

  return (
    <div className="shell">
      <aside className="panel">

        {/* ── Header ── */}
        <div className="panel-header">
          <p className="eyebrow">Boston Food Equity Explorer</p>
          <h1>Smart Search</h1>
          <p className="lede">Ask in plain language — "grocery stores in Roxbury" or "food pantry near Jamaica Plain".</p>
        </div>

        {/* ── Search ── */}
        <div className="panel-section">
          <div className="nl-search-box">
            <input
              className="search-input"
              type="text"
              placeholder="e.g. grocery stores in Roxbury…"
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") runNlSearch(); }}
            />
            <button
              className="search-btn"
              type="button"
              disabled={nlSearching || searching}
              onClick={runNlSearch}
            >
              {nlSearching ? "…" : "Search"}
            </button>
          </div>

          {nlSearching && <p className="nl-thinking">Interpreting with Gemini AI…</p>}

          {parsedIntent && (
            <div className="parsed-chips">
              {parsedIntent.place_type && (
                <span className="parsed-chip">{PLACE_TYPE_LABELS[parsedIntent.place_type] ?? parsedIntent.place_type}</span>
              )}
              {parsedIntent.neighborhood && (
                <span className="parsed-chip">{parsedIntent.neighborhood}</span>
              )}
              {parsedIntent.address && (
                <span className="parsed-chip">{parsedIntent.address}</span>
              )}
              {!parsedIntent.place_type && !parsedIntent.neighborhood && !parsedIntent.address && (
                <span className="parsed-chip parsed-chip-warn">No location found — using pin</span>
              )}
            </div>
          )}

          {(lastSearchSource || lastResolvedAddress) && (
            <div className="search-meta">
              {lastResolvedAddress && <div>Resolved: {lastResolvedAddress}</div>}
              {searchCenter && <div>Center: {searchCenter.lat.toFixed(5)}, {searchCenter.lng.toFixed(5)}</div>}
            </div>
          )}
        </div>

        {/* ── Pin + Radius ── */}
        <div className="panel-section">
          <p className="section-label">Dropped Pin</p>
          <div className="pin-row">
            <span className={`pin-coords${droppedPin ? "" : " pin-coords-empty"}`}>
              {droppedPin ? `${droppedPin.lat.toFixed(5)}, ${droppedPin.lng.toFixed(5)}` : "Click map to drop a pin"}
            </span>
            <button className="pin-search-btn" type="button" disabled={searching} onClick={() => runRadiusSearch("pin")}>
              Search Pin
            </button>
          </div>
          <div className="radius-row">
            <span className="radius-label">Radius (miles)</span>
            <input
              className="control-input"
              type="number"
              min={MIN_RADIUS_MILES}
              step="0.5"
              value={radiusMiles}
              onChange={(event) => setRadiusMiles(event.target.value)}
            />
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="panel-section">
          <div className="filter-chips">
            {[
              { value: "", label: "All" },
              { value: "farmers_market", label: "Farmers Markets" },
              { value: "restaurant", label: "Restaurants" },
              { value: "grocery_store", label: "Grocery Stores" },
              { value: "food_pantry", label: "Food Pantries" },
            ].map((option) => (
              <button
                key={option.value}
                className={`chip ${selectedType === option.value ? "chip-active" : ""}`}
                type="button"
                onClick={() => setSelectedType(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="meta-row">
            <button className="toggle-all" type="button" onClick={clearAll}>Clear all</button>
            <span className="count-pill">{shownCount} shown</span>
          </div>
        </div>

        {/* ── Map options ── */}
        <div className="panel-section">
          <div className="control-row">
            <span className="control-row-label">Map scope</span>
            <select className="control-input" value={mapScope} onChange={(e) => setMapScope(e.target.value)}>
              <option value="boston">Boston</option>
              <option value="massachusetts">Massachusetts</option>
            </select>
          </div>
          <button
            className={`choropleth-btn ${showChoropleth ? "choropleth-on" : ""}`}
            onClick={() => {
              const next = !showChoropleth;
              setShowChoropleth(next);
              showChoroplethRef.current = next;
              refreshBoundaryStyles();
            }}
          >
            {showChoropleth ? "Hide" : "Show"} Poverty Rate Layer
          </button>
          {showChoropleth && (
            <div className="choropleth-legend">
              <div className="choropleth-bar" />
              <div className="choropleth-labels">
                <span>{(giniRange.min * 100).toFixed(1)}% — Lower</span>
                <span>Higher — {(giniRange.max * 100).toFixed(1)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Status ── */}
        <p className={`status ${error ? "status-error" : ""}`}>{error || status}</p>

        {/* ── Legend ── */}
        <div className="panel-section">
          <div className="legend-row">
            <span className="legend-dot" style={{ background: "#F59E0B" }} /> Farmers Market
            <span className="legend-dot" style={{ background: "#10B981" }} /> Restaurant
            <span className="legend-dot" style={{ background: "#3B82F6" }} /> Grocery
            <span className="legend-dot" style={{ background: "#1a1917" }} /> Food Pantry
          </div>
        </div>

        {/* ── Neighborhood Metrics ── */}
        {(selectedNeighborhood || metricsLoading || metricsError) && (
          <div className="panel-section">
            <section className="dataset">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2>{selectedNeighborhood || "Neighborhood Metrics"}</h2>
                {neighborhoodMetrics && (
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button className="charts-btn" onClick={() => setShowChartsModal(true)}>View Charts</button>
                    <button className="charts-btn" onClick={() => setShowCompareModal(true)}>Compare</button>
                  </div>
                )}
              </div>
              {metricsLoading && <p className="dataset-caption">Loading…</p>}
              {metricsError && <p className="dataset-caption">{metricsError}</p>}
              {!metricsLoading && neighborhoodMetrics && (
                <div className="dataset-list" role="list">
                  <div className="dataset-item" role="listitem">
                    <span className="dataset-name">Population</span>
                    <span className="dataset-meta">
                      {neighborhoodMetrics.population != null ? Number(neighborhoodMetrics.population).toLocaleString() : "N/A"}
                    </span>
                  </div>
                  <div className="dataset-item" role="listitem">
                    <span className="dataset-name">Poverty Rate</span>
                    <span className="dataset-meta">
                      {neighborhoodPovertyRate != null ? `${(neighborhoodPovertyRate * 100).toFixed(1)}%` : "N/A"}
                    </span>
                  </div>
                  {[
                    ["Restaurants", "restaurants"],
                    ["Grocery Stores", "grocery_stores"],
                    ["Farmers Markets", "farmers_markets"],
                    ["Food Pantries", "food_pantries"],
                    ["Total Access Points", "access_points"],
                  ].map(([label, key]) => (
                    <div className="dataset-item" role="listitem" key={key}>
                      <span className="dataset-name">{label}</span>
                      <span className="dataset-meta">
                        {neighborhoodMetrics.counts?.[key] ?? neighborhoodMetrics.totals?.[key] ?? 0}
                        {" · "}per 1k: {formatMetric(neighborhoodMetrics.per_1000?.[key])}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {hasSearched && (
          <section className="dataset">
            <h2>In Radius</h2>
            <p className="dataset-caption">
              {searching ? "Searching..." : `${searchResults.length} location(s) in range`}
            </p>

            {!searching && searchResults.length === 0 && (
              <p className="dataset-caption">No locations matched this center + radius.</p>
            )}

            <div className="dataset-list" role="list" aria-label="Radius search results">
              {searchResults.map((item, index) => (
                <div
                  key={`${item.name || "item"}-${index}`}
                  className="dataset-item dataset-item-clickable"
                  role="listitem"
                  onClick={() => {
                    if (!mapRef.current || item.lat == null || item.lng == null) return;
                    mapRef.current.panTo({ lat: item.lat, lng: item.lng });
                    mapRef.current.setZoom(15);
                  }}
                >
                  <span
                    className="result-dot"
                    style={{ background: PLACE_TYPE_COLORS[item.place_type] || "#6B7280" }}
                  />
                  <div className="result-text">
                    <span className="dataset-name">{item.name || "Unknown"}</span>
                    <span className="dataset-meta">{item.neighborhood || item.city || "No neighborhood"}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </aside>

      <main className="map-wrap">
        <div ref={mapElRef} className="map" aria-label="Boston neighborhood map" />
      </main>

      {showChartsModal && neighborhoodMetrics && (
        <NeighborhoodChartsModal
          neighborhood={selectedNeighborhood}
          metrics={neighborhoodMetrics}
          onClose={() => setShowChartsModal(false)}
        />
      )}

      {showCompareModal && (
        <div className="modal-backdrop" onClick={() => setShowCompareModal(false)}>
          <div className="modal-card" style={{ maxWidth: "700px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Compare Neighborhoods</span>
              <button className="modal-close" onClick={() => setShowCompareModal(false)} aria-label="Close">×</button>
            </div>
            <ComparisonDashboard />
          </div>
        </div>
      )}
    </div>
  );
}
