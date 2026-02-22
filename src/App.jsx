import { useCallback, useEffect, useRef, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, Legend, CartesianGrid, ReferenceLine,
} from "recharts";

function SplashScreen({ onDone }) {
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowButtons(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="splash">
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
        <p className="splash-title">Boston Food Mapping System</p>
        <p className="splash-sub">Mapping access across neighborhoods</p>
        {showButtons && (
          <div className="splash-lang">
            <button className="splash-lang-btn" onClick={() => onDone("en")}>English</button>
            <button className="splash-lang-btn" onClick={() => onDone("es")}>Español</button>
          </div>
        )}
      </div>
    </div>
  );
}

const TRANSLATIONS = {
  en: {
    tabMap: "Map Search", tabCompare: "Compare",
    eyebrow: "Boston Food Equity Explorer",
    headerTitle: "Smart Search",
    headerLede: 'Ask in plain language — "grocery stores in Roxbury" or "food pantry near Jamaica Plain".',
    searchPlaceholder: "e.g. grocery stores in Roxbury…",
    searchBtn: "Search", searchBtnBusy: "…",
    nlThinking: "Interpreting with Gemini AI…",
    noLocationFound: "No location found — using pin",
    resolved: "Resolved:", center: "Center:",
    droppedPin: "Dropped Pin", clickToPin: "Click map to drop a pin",
    searchPinBtn: "Search Pin", radiusMiles: "Radius (miles)",
    filterAll: "All", filterFarmersMarkets: "Farmers Markets",
    filterRestaurants: "Restaurants", filterGroceryStores: "Grocery Stores",
    filterFoodPantries: "Food Pantries", clearAll: "Clear all", shown: "shown",
    mapScope: "Map scope", boston: "Boston", massachusetts: "Massachusetts",
    hidePoverty: "Hide Poverty Rate Layer", showPoverty: "Show Poverty Rate Layer",
    lower: "Lower", higher: "Higher",
    legendFarmersMarket: "Farmers Market", legendRestaurant: "Restaurant",
    legendGrocery: "Grocery", legendFoodPantry: "Food Pantry",
    neighborhoodMetrics: "Neighborhood Metrics",
    population: "Population", avgGiniIndex: "Avg Gini Index",
    citywideAvgGini: "Citywide Avg Gini",
    restaurants: "Restaurants", groceryStores: "Grocery Stores",
    farmersMarkets: "Farmers Markets", foodPantries: "Food Pantries",
    totalAccessPoints: "Total Access Points", per1k: "per 1k:",
    inRadius: "In Radius", searching: "Searching...",
    locationsInRange: "location(s) in range",
    noLocationsMatched: "No locations matched this center + radius.",
    noNeighborhood: "No neighborhood",
    loadingMap: "Loading map...", loadingGoogleMaps: "Loading Google Maps...",
    loadingBoundaries: "Loading neighborhood boundaries...",
    loadingSampled: "Loading sampled locations...",
    mapReadyShowing: (n, f) => `Map ready. Showing ${n} sampled locations (10%).${f > 0 ? ` ${f} outside Boston hidden.` : ""} Enter an address or drop a pin.`,
    mapReadyEnter: "Map ready. Enter an address or drop a pin, then search by radius.",
    mapReadyNone: "Map ready. No in-Boston preview locations returned.",
    couldNotInit: "Could not initialize the map.",
    radiusMin: (min) => `Radius must be at least ${min} miles.`,
    enterAddress: "Enter an address before searching by address.",
    dropPin: "Drop a pin on the map before searching by pin.",
    foundLocations: (n, r, f) => `Found ${n} in-Boston location(s) within ${r} miles.${f > 0 ? ` ${f} outside Boston hidden.` : ""}`,
    geminiNoLocation: "Gemini couldn't find a location in your query. Try adding a neighborhood or address.",
    smartSearchFailed: "Smart search failed",
    metricsLoadFailed: "Failed to load neighborhood metrics.",
    compareTitle: "Compare Neighborhoods",
    compareLede: "Enter two neighborhoods to compare food access side by side.",
    comparePlaceholderA: "e.g. Roxbury", comparePlaceholderB: "e.g. Back Bay",
    compareBtn: "Compare", compareBtnBusy: "Loading…",
    compareBothRequired: "Enter both neighborhood names.",
    compareDifferent: "Choose two different neighborhoods.",
    overview: "Overview", povertyRate: "Poverty Rate", avgGini: "Avg Gini",
    foodLocationCounts: "Food Location Counts", per1000Residents: "Per 1,000 Residents",
  },
  es: {
    tabMap: "Búsqueda en Mapa", tabCompare: "Comparar",
    eyebrow: "Explorador de Equidad Alimentaria de Boston",
    headerTitle: "Búsqueda Inteligente",
    headerLede: 'Pregunta en lenguaje natural — "supermercados en Roxbury" o "banco de alimentos cerca de Jamaica Plain".',
    searchPlaceholder: "ej. supermercados en Roxbury…",
    searchBtn: "Buscar", searchBtnBusy: "…",
    nlThinking: "Interpretando con Gemini AI…",
    noLocationFound: "Ubicación no encontrada — usando pin",
    resolved: "Dirección:", center: "Centro:",
    droppedPin: "Pin Colocado", clickToPin: "Haz clic en el mapa para colocar un pin",
    searchPinBtn: "Buscar con Pin", radiusMiles: "Radio (millas)",
    filterAll: "Todos", filterFarmersMarkets: "Mercados Agrícolas",
    filterRestaurants: "Restaurantes", filterGroceryStores: "Supermercados",
    filterFoodPantries: "Bancos de Alimentos", clearAll: "Limpiar todo", shown: "mostrados",
    mapScope: "Alcance del mapa", boston: "Boston", massachusetts: "Massachusetts",
    hidePoverty: "Ocultar Capa de Pobreza", showPoverty: "Mostrar Capa de Pobreza",
    lower: "Menor", higher: "Mayor",
    legendFarmersMarket: "Mercado Agrícola", legendRestaurant: "Restaurante",
    legendGrocery: "Supermercado", legendFoodPantry: "Banco de Alimentos",
    neighborhoodMetrics: "Métricas del Vecindario",
    population: "Población", avgGiniIndex: "Índice Gini Promedio",
    citywideAvgGini: "Gini Promedio Ciudad",
    restaurants: "Restaurantes", groceryStores: "Supermercados",
    farmersMarkets: "Mercados Agrícolas", foodPantries: "Bancos de Alimentos",
    totalAccessPoints: "Puntos de Acceso Totales", per1k: "por 1k:",
    inRadius: "En el Radio", searching: "Buscando...",
    locationsInRange: "lugar(es) encontrado(s)",
    noLocationsMatched: "No se encontraron lugares en este radio.",
    noNeighborhood: "Sin vecindario",
    loadingMap: "Cargando mapa...", loadingGoogleMaps: "Cargando Google Maps...",
    loadingBoundaries: "Cargando límites de vecindarios...",
    loadingSampled: "Cargando ubicaciones de muestra...",
    mapReadyShowing: (n, f) => `Mapa listo. Mostrando ${n} ubicaciones de muestra (10%).${f > 0 ? ` ${f} fuera de Boston ocultos.` : ""} Ingresa una dirección o coloca un pin.`,
    mapReadyEnter: "Mapa listo. Ingresa una dirección o coloca un pin para buscar por radio.",
    mapReadyNone: "Mapa listo. No se encontraron ubicaciones en Boston.",
    couldNotInit: "No se pudo inicializar el mapa.",
    radiusMin: (min) => `El radio debe ser al menos ${min} millas.`,
    enterAddress: "Ingresa una dirección antes de buscar.",
    dropPin: "Coloca un pin en el mapa antes de buscar.",
    foundLocations: (n, r, f) => `Se encontraron ${n} lugar(es) en Boston dentro de ${r} millas.${f > 0 ? ` ${f} fuera de Boston ocultos.` : ""}`,
    geminiNoLocation: "Gemini no pudo encontrar una ubicación. Intenta agregar un vecindario o dirección.",
    smartSearchFailed: "La búsqueda inteligente falló",
    metricsLoadFailed: "Error al cargar las métricas del vecindario.",
    compareTitle: "Comparar Vecindarios",
    compareLede: "Ingresa dos vecindarios para comparar el acceso a alimentos.",
    comparePlaceholderA: "ej. Roxbury", comparePlaceholderB: "ej. Back Bay",
    compareBtn: "Comparar", compareBtnBusy: "Cargando…",
    compareBothRequired: "Ingresa ambos nombres de vecindarios.",
    compareDifferent: "Elige dos vecindarios diferentes.",
    overview: "Resumen", povertyRate: "Tasa de Pobreza", avgGini: "Gini Promedio",
    foodLocationCounts: "Cantidad de Lugares de Comida", per1000Residents: "Por 1,000 Residentes",
  },
};

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
  "South End","West End","West Roxbury","Whittier Street","Longwood","East Boston",
];
const EXCLUDED_SEARCH_NEIGHBORHOODS = new Set(["harbor islands"]);

function normalizeNeighborhood(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function isExcludedNeighborhoodForSearch(value) {
  return EXCLUDED_SEARCH_NEIGHBORHOODS.has(normalizeNeighborhood(value));
}

function normalizePlaceTypesInput(value) {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  const text = String(value).trim();
  return text ? [text] : [];
}

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

function ComparisonDashboard({ lang }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
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
    if (!a || !b) { setError(t.compareBothRequired); return; }
    if (a.toLowerCase() === b.toLowerCase()) { setError(t.compareDifferent); return; }
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
    { key: "restaurants", label: t.restaurants },
    { key: "grocery_stores", label: t.groceryStores },
    { key: "farmers_markets", label: t.farmersMarkets },
    { key: "food_pantries", label: t.foodPantries },
  ];

  return (
    <div className="cmp-panel">
      <div className="panel-header">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1>{t.compareTitle}</h1>
        <p className="lede">{t.compareLede}</p>
      </div>

      <div className="panel-section">
        <div className="cmp-inputs">
          <div className="cmp-input-wrap">
            <span className="cmp-badge cmp-badge-a">A</span>
            <input
              className="search-input"
              list="hood-list-a"
              placeholder={t.comparePlaceholderA}
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
              placeholder={t.comparePlaceholderB}
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
          {loading ? t.compareBtnBusy : t.compareBtn}
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
            <p className="section-label">{t.overview}</p>
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
                  <td>{t.population}</td>
                  <td>{fmt(dataA.population)}</td>
                  <td>{fmt(dataB.population)}</td>
                </tr>
                <tr>
                  <td>{t.povertyRate}</td>
                  <td>{fmtPct(dataA.poverty_rate)}</td>
                  <td>{fmtPct(dataB.poverty_rate)}</td>
                </tr>
                <tr>
                  <td>{t.avgGini}</td>
                  <td>{fmtDec(dataA.income?.avg_gini_for_neighborhood)}</td>
                  <td>{fmtDec(dataB.income?.avg_gini_for_neighborhood)}</td>
                </tr>
                <tr>
                  <td>{t.totalAccessPoints}</td>
                  <td>{fmt(dataA.totals?.access_points)}</td>
                  <td>{fmt(dataB.totals?.access_points)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Food counts bar chart */}
          <div className="panel-section">
            <p className="section-label">{t.foodLocationCounts}</p>
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
            <p className="section-label">{t.per1000Residents}</p>
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

function darkenColor(color, amount = 0.12) {
  if (typeof color !== "string") return color;

  const clamp = (value) => Math.max(0, Math.min(255, Math.round(value)));
  const scale = 1 - amount;

  const rgbMatch = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (rgbMatch) {
    const r = clamp(Number(rgbMatch[1]) * scale);
    const g = clamp(Number(rgbMatch[2]) * scale);
    const b = clamp(Number(rgbMatch[3]) * scale);
    return `rgb(${r},${g},${b})`;
  }

  const hexMatch = color.match(/^#([0-9a-f]{6})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    const r = clamp(parseInt(hex.slice(0, 2), 16) * scale);
    const g = clamp(parseInt(hex.slice(2, 4), 16) * scale);
    const b = clamp(parseInt(hex.slice(4, 6), 16) * scale);
    return `rgb(${r},${g},${b})`;
  }

  return color;
}

const GOOGLE_MAPS_API_KEY =
  typeof __GOOGLE_MAPS_API__ === "string" ? __GOOGLE_MAPS_API__.trim() : "";

const MIN_RADIUS_MILES = 0.1;
const DEFAULT_RADIUS_MILES = 0.5;
const DEFAULT_LIMIT = 350;
const PREVIEW_SAMPLE_PCT = 0.1;
const METERS_PER_MILE = 1609.344;
const AREA_PROMPT_PIN_PEEK_OFFSET_Y = -18;

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
  const hoveredNeighborhoodRef = useRef("");
  const runAreaSearchAtRef = useRef(async () => {});
  const openAreaSearchPromptRef = useRef(() => {});
  const lastFeatureClickTsRef = useRef(0);
  const previewResultsScopeRef = useRef([]);
  const searchResultsScopeRef = useRef([]);
  const lastSearchRadiusRef = useRef(DEFAULT_RADIUS_MILES);

  const [showSplash, setShowSplash] = useState(true);
  const [lang, setLang] = useState("en");
  const langRef = useRef("en");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const mapTheme = "civic";
  const [mapScope, setMapScope] = useState("boston");
  const [showChoropleth, setShowChoropleth] = useState(true);
  const [giniRange, setGiniRange] = useState({ min: 0.3, max: 0.55 });

  const [nlQuery, setNlQuery] = useState("");
  const [parsedIntent, setParsedIntent] = useState(null);
  const [nlSearching, setNlSearching] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
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

      const isHovered = hoveredNeighborhoodRef.current === name;
      if (isHovered) {
        fillColor = darkenColor(fillColor, 0.14);
        fillOpacity = Math.min(0.9, fillOpacity + 0.12);
      }

      return {
        clickable: true,
        fillColor,
        fillOpacity,
        strokeColor: isHovered ? "#2f2f2f" : "#555",
        strokeOpacity: isHovered ? 0.85 : 0.5,
        strokeWeight: isHovered ? 1.6 : 1,
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
    clearSearchOverlay();
    if (!map || !center) return;

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
      return results.filter((item) => {
        if (item.lat == null || item.lng == null) return false;
        if (isExcludedNeighborhoodForSearch(item.neighborhood)) return false;
        return true;
      });
    }

    const bounds = bostonBoundsRef.current;
    const knownNeighborhoods = neighborhoodNamesRef.current;

    return results.filter((item) => {
      if (item.lat == null || item.lng == null) return false;
      if (isExcludedNeighborhoodForSearch(item.neighborhood)) return false;

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

  const applyPlaceTypeFilter = useCallback((results, activePlaceTypes = selectedTypes) => {
    if (!Array.isArray(results)) return [];
    const normalized = normalizePlaceTypesInput(activePlaceTypes);
    if (!normalized.length) return results;

    const allowed = new Set(normalized);
    return results.filter((item) => allowed.has(item.place_type));
  }, [selectedTypes]);

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

        infoWindowRef.current.setOptions({ pixelOffset: new window.google.maps.Size(0, 0) });
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
    const tr = TRANSLATIONS[langRef.current] || TRANSLATIONS.en;
    if (previewResults.length > 0) {
      placeMarkers(previewResults, null, DEFAULT_RADIUS_MILES);
      setStatus(tr.mapReadyShowing(previewResults.length, 0));
    } else {
      clearResultMarkers();
      clearSearchOverlay();
      setStatus(tr.mapReadyEnter);
    }
  }, [clearResultMarkers, clearSearchOverlay, placeMarkers, previewResults]);

  const getFocusedSearchRadiusMiles = useCallback(() => {
    const parsed = Number.parseFloat(radiusMiles);
    if (!Number.isFinite(parsed) || parsed < MIN_RADIUS_MILES) {
      return DEFAULT_RADIUS_MILES;
    }
    return parsed;
  }, [radiusMiles]);

  const runAreaSearchAt = useCallback(async (pin, areaLabel = "this area") => {
    if (!pin) return;

    const radius = getFocusedSearchRadiusMiles();
    const activePlaceTypes = normalizePlaceTypesInput(selectedTypes);
    const payload = {
      pin,
      radius_miles: radius,
      limit: DEFAULT_LIMIT,
    };
    if (activePlaceTypes.length === 1) {
      payload.place_type = activePlaceTypes[0];
    } else if (activePlaceTypes.length > 1) {
      payload.place_types = activePlaceTypes;
    }

    setDroppedPin(pin);
    setSearching(true);
    setError("");
    setHasSearched(true);
    setLastSearchSource("pin");
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

      const rawResults = Array.isArray(data.results) ? data.results : [];
      const scopeFilteredResults = filterResultsByScope(rawResults);
      const filteredResults = applyPlaceTypeFilter(scopeFilteredResults, activePlaceTypes);
      const filteredOut = rawResults.length - filteredResults.length;

      searchResultsScopeRef.current = scopeFilteredResults;
      setSearchResults(filteredResults);
      setSearchCenter(data.search_center || pin);
      lastSearchRadiusRef.current = radius;
      placeMarkers(filteredResults, data.search_center || pin, radius);
      setStatus(
        `Found ${filteredResults.length} location(s) near ${areaLabel} (area search: ${radius} miles).${
          filteredOut > 0 ? ` ${filteredOut} outside current scope hidden.` : ""
        }`
      );
    } catch (err) {
      searchResultsScopeRef.current = [];
      setSearchResults([]);
      setSearchCenter(null);
      setHasSearched(false);
      restorePreview();
      setError(err.message || "Search failed");
    } finally {
      setSearching(false);
    }
  }, [applyPlaceTypeFilter, filterResultsByScope, getFocusedSearchRadiusMiles, placeMarkers, restorePreview, selectedTypes]);

  const openAreaSearchPrompt = useCallback((latLng, areaLabel = "this area") => {
    const map = mapRef.current;
    if (!map || !latLng || !infoWindowRef.current) return;

    const radius = getFocusedSearchRadiusMiles();
    const wrapper = document.createElement("div");
    wrapper.className = "info-window";

    const title = document.createElement("strong");
    title.textContent = areaLabel;

    const hint = document.createElement("div");
    hint.className = "info-window-muted";
    hint.textContent = `Run a focused ${radius}-mile search around this point (uses current Radius value).`;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "info-window-search-btn";
    button.textContent = "Search this area";
    button.disabled = searching;
    button.addEventListener("click", () => {
      runAreaSearchAtRef.current(
        { lat: latLng.lat(), lng: latLng.lng() },
        areaLabel
      );
      infoWindowRef.current?.close();
    });

    wrapper.appendChild(title);
    wrapper.appendChild(hint);
    wrapper.appendChild(button);

    infoWindowRef.current.setOptions({
      pixelOffset: new window.google.maps.Size(0, AREA_PROMPT_PIN_PEEK_OFFSET_Y),
    });
    infoWindowRef.current.setPosition(latLng);
    infoWindowRef.current.setContent(wrapper);
    infoWindowRef.current.open(map);
  }, [getFocusedSearchRadiusMiles, searching]);

  useEffect(() => {
    runAreaSearchAtRef.current = runAreaSearchAt;
  }, [runAreaSearchAt]);

  useEffect(() => {
    openAreaSearchPromptRef.current = openAreaSearchPrompt;
  }, [openAreaSearchPrompt]);

  useEffect(() => {
    applyMapViewportSettings(mapScope, mapTheme, false);
  }, [mapScope, mapTheme, applyMapViewportSettings]);

  useEffect(() => {
    if (showSplash) return;
    let active = true;

    async function init() {
      try {
        setStatus(t.loadingGoogleMaps);
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

        setStatus(t.loadingBoundaries);
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
          const featureName = getNeighborhoodName(feature);
          if (!isExcludedNeighborhoodForSearch(featureName)) {
            names.add(featureName);
          }
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
          lastFeatureClickTsRef.current = Date.now();
          const name = getNeighborhoodName(event.feature);
          if (isExcludedNeighborhoodForSearch(name)) {
            setDroppedPin(null);
            setSelectedNeighborhood(name);
            setNeighborhoodMetrics(null);
            setMetricsError("");
            setMetricsLoading(false);
            setStatus(`${name} has no locations and is excluded from search.`);
            infoWindowRef.current?.close();
            return;
          }

          const nextPin = { lat: event.latLng.lat(), lng: event.latLng.lng() };
          setDroppedPin(nextPin);
          setSelectedNeighborhood(name);
          setMetricsError("");
          setMetricsLoading(true);
          openAreaSearchPromptRef.current(event.latLng, name);

          try {
            const metricsResponse = await fetch(
              `/api/neighborhood-metrics?name=${encodeURIComponent(name)}`
            );
            if (!metricsResponse.ok) {
              throw new Error(`Neighborhood metrics failed (${metricsResponse.status})`);
            }
            const metricsData = await metricsResponse.json();
            if (!active) return;
            setNeighborhoodMetrics(metricsData);
          } catch (err) {
            if (!active) return;
            setNeighborhoodMetrics(null);
            setMetricsError(err.message || t.metricsLoadFailed);
          } finally {
            if (active) setMetricsLoading(false);
          }

        });

        map.data.addListener("mouseover", (event) => {
          hoveredNeighborhoodRef.current = getNeighborhoodName(event.feature);
          refreshBoundaryStyles();
        });

        map.data.addListener("mouseout", () => {
          hoveredNeighborhoodRef.current = "";
          refreshBoundaryStyles();
        });

        map.addListener("click", (event) => {
          if (Date.now() - lastFeatureClickTsRef.current < 120) return;
          const nextPin = { lat: event.latLng.lat(), lng: event.latLng.lng() };
          setDroppedPin(nextPin);
          openAreaSearchPromptRef.current(event.latLng, "Selected area");
        });

        setStatus(t.loadingSampled);
        const previewResponse = await fetch(`/api/food-distributors?sample_pct=${PREVIEW_SAMPLE_PCT}`);
        if (!previewResponse.ok) {
          throw new Error(`Preview data failed to load (${previewResponse.status}).`);
        }
        const previewData = await previewResponse.json();
        if (!active) return;

        const previewRaw = Array.isArray(previewData) ? previewData : [];
        const scopeFilteredPreview = filterResultsByScope(previewRaw);
        const previewFiltered = applyPlaceTypeFilter(scopeFilteredPreview);
        const filteredOut = previewRaw.length - previewFiltered.length;

        previewResultsScopeRef.current = scopeFilteredPreview;
        setPreviewResults(previewFiltered);
        if (previewFiltered.length > 0) {
          placeMarkers(previewFiltered, null, DEFAULT_RADIUS_MILES);
          setStatus(t.mapReadyShowing(previewFiltered.length, filteredOut));
        } else {
          setStatus(t.mapReadyNone);
        }
      } catch (err) {
        if (!active) return;
        setError(err.message);
        setStatus(t.couldNotInit);
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
    applyPlaceTypeFilter,
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
          // Teardrop pin shape
          path: "M12 2C8.13 2 5 5.13 5 9c0 5.1 6.2 11.8 6.46 12.08a.75.75 0 0 0 1.08 0C12.8 20.8 19 14.1 19 9c0-3.87-3.13-7-7-7z",
          scale: 1.2,
          fillColor: "#1D4ED8",
          fillOpacity: 1,
          strokeColor: "#0b3aa6",
          strokeWeight: 1.2,
          anchor: new window.google.maps.Point(12, 22),
        },
      });
    } else {
      pinMarkerRef.current.setPosition(droppedPin);
      pinMarkerRef.current.setMap(map);
    }
  }, [droppedPin]);

  async function runRadiusSearch(sourceHint, overrideAddress = null, overridePlaceTypes = null) {
    setError("");

    const parsedRadius = Number.parseFloat(radiusMiles);
    if (!Number.isFinite(parsedRadius) || parsedRadius < MIN_RADIUS_MILES) {
      setError(t.radiusMin(MIN_RADIUS_MILES));
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
    const normalizedOverrideTypes = normalizePlaceTypesInput(overridePlaceTypes);
    const effectivePlaceTypes = normalizedOverrideTypes.length
      ? normalizedOverrideTypes
      : normalizePlaceTypesInput(selectedTypes);

    if (effectivePlaceTypes.length === 1) {
      payload.place_type = effectivePlaceTypes[0];
    } else if (effectivePlaceTypes.length > 1) {
      payload.place_types = effectivePlaceTypes;
    }

    if (useAddress) {
      if (!hasAddress) {
        setError(t.enterAddress);
        return;
      }
      payload.address = effectiveAddress.trim();
    } else {
      if (!droppedPin) {
        setError(t.dropPin);
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
      const scopeFilteredResults = filterResultsByScope(rawResults);
      const filteredResults = applyPlaceTypeFilter(scopeFilteredResults, effectivePlaceTypes);
      const filteredOut = rawResults.length - filteredResults.length;

      searchResultsScopeRef.current = scopeFilteredResults;
      setSearchResults(filteredResults);
      setSearchCenter(data.search_center || null);
      setLastSearchSource(data.search_source || (useAddress ? "address" : "pin"));
      if (data?.geocode?.formatted_address) {
        setLastResolvedAddress(data.geocode.formatted_address);
      }

      lastSearchRadiusRef.current = parsedRadius;
      placeMarkers(filteredResults, data.search_center || null, parsedRadius);
      setStatus(t.foundLocations(filteredResults.length, parsedRadius, filteredOut));
    } catch (err) {
      searchResultsScopeRef.current = [];
      setSearchResults([]);
      setSearchCenter(null);
      restorePreview();
      setError(err.message || "Search failed");
    } finally {
      setSearching(false);
    }
  }

  function clearSearchState() {
    searchResultsScopeRef.current = [];
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
      if (!res.ok) throw new Error(`Gemini parse failed (${res.status})`);
      const intent = await res.json();
      setParsedIntent(intent);
      // Apply extracted place_type as the active filter chip
      if (intent.place_type) setSelectedTypes([intent.place_type]);
      // Use extracted address or neighborhood for the radius search
      if (intent.address) {
        setAddressInput(intent.address);
        await runRadiusSearch(
          "address",
          intent.address,
          intent.place_type ? [intent.place_type] : null
        );
      } else if (intent.neighborhood) {
        setAddressInput(intent.neighborhood + ", Boston, MA");
        await runRadiusSearch(
          "address",
          intent.neighborhood + ", Boston, MA",
          intent.place_type ? [intent.place_type] : null
        );
      } else if (droppedPin) {
        await runRadiusSearch("pin", null, intent.place_type ? [intent.place_type] : null);
      } else {
        setError(t.geminiNoLocation);
      }
    } catch (err) {
      setError(err.message || t.smartSearchFailed);
    } finally {
      setNlSearching(false);
    }
  }

  function clearAll() {
    setNlQuery("");
    setParsedIntent(null);
    setAddressInput("");
    setSelectedTypes([]);
    setRadiusMiles(String(DEFAULT_RADIUS_MILES));
    setDroppedPin(null);
    clearSearchState();
  }

  function clearPinAndRadius() {
    setDroppedPin(null);
    clearSearchOverlay();
    clearSearchState();
    infoWindowRef.current?.close();
  }

  useEffect(() => {
    const filteredPreview = applyPlaceTypeFilter(previewResultsScopeRef.current);
    const filteredSearch = applyPlaceTypeFilter(searchResultsScopeRef.current);

    setPreviewResults(filteredPreview);
    setSearchResults(filteredSearch);

    if (hasSearched) {
      placeMarkers(filteredSearch, searchCenter || null, lastSearchRadiusRef.current);
    } else {
      placeMarkers(filteredPreview, null, DEFAULT_RADIUS_MILES);
    }
  }, [applyPlaceTypeFilter, hasSearched, placeMarkers, searchCenter, selectedTypes]);

  const formatMetric = (value, digits = 2) => {
    if (value == null || Number.isNaN(value)) return "N/A";
    return Number(value).toFixed(digits);
  };

  const neighborhoodPovertyRate = selectedNeighborhood ? incomeMapRef.current.get(selectedNeighborhood) ?? null : null;
  const hasPinOrRadiusOnMap = Boolean(droppedPin || searchCenter);

  const shownCount = hasSearched ? searchResults.length : previewResults.length;

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  langRef.current = lang;

  if (showSplash) return <SplashScreen onDone={(l) => { setLang(l); setShowSplash(false); }} />;

  return (
    <div className="shell">
      <aside className="panel">

        {/* ── Tab bar ── */}
        <div className="tab-bar">
          <button
            className={`tab ${activeTab === "map" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("map")}
          >{t.tabMap}</button>
          <button
            className={`tab ${activeTab === "compare" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("compare")}
          >{t.tabCompare}</button>
        </div>

        {activeTab === "compare" ? <ComparisonDashboard lang={lang} /> : <>

        {/* ── Header ── */}
        <div className="panel-header">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.headerTitle}</h1>
          <p className="lede">{t.headerLede}</p>
        </div>

        {/* ── Search ── */}
        <div className="panel-section">
          <div className="nl-search-box">
            <input
              className="search-input"
              type="text"
              placeholder={t.searchPlaceholder}
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
              {nlSearching ? t.searchBtnBusy : t.searchBtn}
            </button>
          </div>

          {nlSearching && <p className="nl-thinking">{t.nlThinking}</p>}

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
                <span className="parsed-chip parsed-chip-warn">{t.noLocationFound}</span>
              )}
            </div>
          )}

          {(lastSearchSource || lastResolvedAddress) && (
            <div className="search-meta">
              {lastResolvedAddress && <div>{t.resolved} {lastResolvedAddress}</div>}
              {searchCenter && <div>{t.center} {searchCenter.lat.toFixed(5)}, {searchCenter.lng.toFixed(5)}</div>}
            </div>
          )}
        </div>

        {/* ── Pin + Radius ── */}
        <div className="panel-section">
          <p className="section-label">{t.droppedPin}</p>
          <div className="pin-row">
            <span className={`pin-coords${droppedPin ? "" : " pin-coords-empty"}`}>
              {droppedPin ? `${droppedPin.lat.toFixed(5)}, ${droppedPin.lng.toFixed(5)}` : t.clickToPin}
            </span>
            <button className="pin-search-btn" type="button" disabled={searching} onClick={() => runRadiusSearch("pin")}>
              {t.searchPinBtn}
            </button>
            {hasPinOrRadiusOnMap && (
              <button className="pin-cancel-btn" type="button" disabled={searching} onClick={clearPinAndRadius}>
                Cancel
              </button>
            )}
          </div>
          <div className="radius-row">
            <span className="radius-label">{t.radiusMiles}</span>
            <input
              className="control-input"
              type="number"
              min={MIN_RADIUS_MILES}
              step="0.1"
              value={radiusMiles}
              onChange={(event) => setRadiusMiles(event.target.value)}
            />
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="panel-section">
          <div className="filter-chips">
            {[
              { value: "", label: t.filterAll },
              { value: "farmers_market", label: t.filterFarmersMarkets },
              { value: "restaurant", label: t.filterRestaurants },
              { value: "grocery_store", label: t.filterGroceryStores },
              { value: "food_pantry", label: t.filterFoodPantries },
            ].map((option) => (
              <button
                key={option.value}
                className={`chip ${
                  option.value === ""
                    ? (selectedTypes.length === 0 ? "chip-active" : "")
                    : (selectedTypes.includes(option.value) ? "chip-active" : "")
                }`}
                type="button"
                onClick={() => {
                  if (option.value === "") {
                    setSelectedTypes([]);
                    return;
                  }

                  setSelectedTypes((current) =>
                    current.includes(option.value)
                      ? current.filter((value) => value !== option.value)
                      : [...current, option.value]
                  );
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="meta-row">
            <button className="toggle-all" type="button" onClick={clearAll}>{t.clearAll}</button>
            <span className="count-pill">{shownCount} {t.shown}</span>
          </div>
        </div>

        {/* ── Map options ── */}
        <div className="panel-section">
          <div className="control-row">
            <span className="control-row-label">{t.mapScope}</span>
            <select className="control-input" value={mapScope} onChange={(e) => setMapScope(e.target.value)}>
              <option value="boston">{t.boston}</option>
              <option value="massachusetts">{t.massachusetts}</option>
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
            {showChoropleth ? t.hidePoverty : t.showPoverty}
          </button>
          {showChoropleth && (
            <div className="choropleth-legend">
              <div className="choropleth-bar" />
              <div className="choropleth-labels">
                <span>{(giniRange.min * 100).toFixed(1)}% — {t.lower}</span>
                <span>{t.higher} — {(giniRange.max * 100).toFixed(1)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Status ── */}
        <p className={`status ${error ? "status-error" : ""}`}>{error || status}</p>

        {/* ── Legend ── */}
        <div className="panel-section">
          <div className="legend-row">
            <span className="legend-dot" style={{ background: "#F59E0B" }} /> {t.legendFarmersMarket}
            <span className="legend-dot" style={{ background: "#10B981" }} /> {t.legendRestaurant}
            <span className="legend-dot" style={{ background: "#3B82F6" }} /> {t.legendGrocery}
            <span className="legend-dot" style={{ background: "#1a1917" }} /> {t.legendFoodPantry}
          </div>
        </div>

        {/* ── Neighborhood Metrics ── */}
        {(selectedNeighborhood || metricsLoading || metricsError) && (
          <div className="panel-section">
            <section className="dataset">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2>{selectedNeighborhood || t.neighborhoodMetrics}</h2>
                {neighborhoodMetrics && (
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button className="charts-btn" onClick={() => setShowChartsModal(true)}>View Charts</button>
                    <button className="charts-btn" onClick={() => setShowCompareModal(true)}>{t.tabCompare}</button>
                  </div>
                )}
              </div>
              {metricsLoading && <p className="dataset-caption">{t.compareBtnBusy}</p>}
              {metricsError && <p className="dataset-caption">{metricsError}</p>}
              {!metricsLoading && neighborhoodMetrics && (
                <div className="dataset-list" role="list">
                  <div className="dataset-item" role="listitem">
                    <span className="dataset-name">{t.population}</span>
                    <span className="dataset-meta">
                      {neighborhoodMetrics.population != null ? Number(neighborhoodMetrics.population).toLocaleString() : "N/A"}
                    </span>
                  </div>
                  <div className="dataset-item" role="listitem">
                    <span className="dataset-name">{t.povertyRate}</span>
                    <span className="dataset-meta">
                      {neighborhoodPovertyRate != null ? `${(neighborhoodPovertyRate * 100).toFixed(1)}%` : "N/A"}
                    </span>
                  </div>
                  {[
                    [t.restaurants, "restaurants"],
                    [t.groceryStores, "grocery_stores"],
                    [t.farmersMarkets, "farmers_markets"],
                    [t.foodPantries, "food_pantries"],
                    [t.totalAccessPoints, "access_points"],
                  ].map(([label, key]) => (
                    <div className="dataset-item" role="listitem" key={key}>
                      <span className="dataset-name">{label}</span>
                      <span className="dataset-meta">
                        {neighborhoodMetrics.counts?.[key] ?? neighborhoodMetrics.totals?.[key] ?? 0}
                        {" · "}{t.per1k} {formatMetric(neighborhoodMetrics.per_1000?.[key])}
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
            <h2>{t.inRadius}</h2>
            <p className="dataset-caption">
              {searching ? t.searching : `${searchResults.length} ${t.locationsInRange}`}
            </p>

            {!searching && searchResults.length === 0 && (
              <p className="dataset-caption">{t.noLocationsMatched}</p>
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
                    <span className="dataset-meta">{item.neighborhood || item.city || t.noNeighborhood}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        </>}
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
            <ComparisonDashboard lang={lang} />
          </div>
        </div>
      )}
    </div>
  );
}
