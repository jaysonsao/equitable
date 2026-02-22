import { useCallback, useEffect, useRef, useState } from "react";

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
const MASSACHUSETTS_BOUNDS = {
  north: 42.88679,
  south: 41.18705,
  east: -69.85886,
  west: -73.50814,
};

const PLACE_TYPE_COLORS = {
  farmers_market: "#F59E0B",
  restaurant: "#10B981",
};

const PLACE_TYPE_LABELS = {
  farmers_market: "Farmers Market",
  restaurant: "Restaurant",
};

const GOOGLE_MAPS_API_KEY =
  typeof __GOOGLE_MAPS_API__ === "string" ? __GOOGLE_MAPS_API__.trim() : "";

function getCountyName(feature) {
  const name = feature.getProperty("name");
  return typeof name === "string" && name.trim() ? name.trim() : "Unknown County";
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
  if (type === "Point") { bounds.extend(geometry.get()); return; }
  if (type === "MultiPoint" || type === "LineString" || type === "LinearRing") {
    geometry.getArray().forEach((latLng) => bounds.extend(latLng)); return;
  }
  if (type === "Polygon" || type === "MultiLineString") {
    geometry.getArray().forEach((inner) => extendBoundsFromGeometry(bounds, inner)); return;
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
    scale: 9,
    fillColor: PLACE_TYPE_COLORS[placeType] || "#6B7280",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
  };
}

export default function App() {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const infoWindowRef = useRef(null);
  const enabledSetRef = useRef(new Set());
  const bostonBoundsRef = useRef(null);
  const activeMarkersRef = useRef([]);

  const [status, setStatus] = useState("Loading map...");
  const [error, setError] = useState("");
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [mapTheme, setMapTheme] = useState("civic");
  const [mapScope, setMapScope] = useState("boston");

  // Search state
  const [searchText, setSearchText] = useState("");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const applyMapViewportSettings = useCallback((scope, theme, fitToScope = false) => {
    const map = mapRef.current;
    if (!map) return;
    const scopeBounds =
      scope === "massachusetts" ? MASSACHUSETTS_BOUNDS : bostonBoundsRef.current || MASSACHUSETTS_BOUNDS;
    map.setOptions({
      styles: getMapStyles(theme),
      restriction: { latLngBounds: scopeBounds, strictBounds: true },
      minZoom: scope === "massachusetts" ? 7 : 10,
      maxZoom: 17,
    });
    if (fitToScope) map.fitBounds(scopeBounds, scope === "massachusetts" ? 24 : 40);
  }, []);

  const refreshStyles = useCallback(() => {
    if (!mapRef.current) return;
    mapRef.current.data.setStyle((feature) => {
      const county = getCountyName(feature);
      const visible = enabledSetRef.current.has(county);
      return {
        clickable: visible,
        fillColor: COUNTY_COLOR,
        fillOpacity: visible ? 0.25 : 0,
        strokeColor: COUNTY_COLOR,
        strokeOpacity: visible ? 0.8 : 0,
        strokeWeight: visible ? 2 : 0,
      };
    });
  }, []);

  // Clear existing markers and place new ones
  const placeMarkers = useCallback((results) => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    activeMarkersRef.current.forEach((m) => m.setMap(null));
    activeMarkersRef.current = [];

    results.forEach((item) => {
      if (!item.lat || !item.lng) return;
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
        title.textContent = item.name;

        const typeTag = document.createElement("div");
        typeTag.style.cssText = "font-size:0.75em;color:#6B7280;margin-bottom:4px;";
        typeTag.textContent = PLACE_TYPE_LABELS[item.place_type] || item.place_type;

        const addr = document.createElement("div");
        addr.textContent = item.address || item.city || "";

        const hood = document.createElement("div");
        hood.style.cssText = "font-size:0.8em;color:#6B7280;";
        hood.textContent = item.neighborhood || "";

        const desc = document.createElement("div");
        desc.style.cssText = "margin-top:4px;font-size:0.85em;";
        desc.textContent = item.description || "";

        wrapper.appendChild(title);
        wrapper.appendChild(typeTag);
        wrapper.appendChild(addr);
        if (item.neighborhood) wrapper.appendChild(hood);
        if (item.description) wrapper.appendChild(desc);

        infoWindowRef.current.setContent(wrapper);
        infoWindowRef.current.open({ map, anchor: marker });
      });

      activeMarkersRef.current.push(marker);
    });

    // Fit map to results if any
    if (results.length > 0 && results.some((r) => r.lat && r.lng)) {
      const bounds = new window.google.maps.LatLngBounds();
      results.forEach((r) => { if (r.lat && r.lng) bounds.extend({ lat: r.lat, lng: r.lng }); });
      map.fitBounds(bounds, 60);
    }
  }, []);

  useEffect(() => {
    enabledSetRef.current = new Set(neighborhoods.map((n) => n.name));
    refreshStyles();
  }, [neighborhoods, refreshStyles]);

  useEffect(() => { applyMapViewportSettings(mapScope, mapTheme, false); }, [mapTheme, applyMapViewportSettings]);
  useEffect(() => { applyMapViewportSettings(mapScope, mapTheme, true); }, [mapScope, applyMapViewportSettings]);

  useEffect(() => {
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
        });

        mapRef.current = map;
        infoWindowRef.current = new window.google.maps.InfoWindow();

        setStatus("Loading neighborhood boundaries...");
        const response = await fetch(BOSTON_GEOJSON);
        if (!response.ok) throw new Error(`Boundary file failed to load (${response.status}).`);

        const geoJson = await response.json();
        const features = map.data.addGeoJson(geoJson);

        const seen = new Map();
        const names = [];
        features.forEach((feature) => {
          const name = getCountyName(feature);
          if (!seen.has(name)) { seen.set(name, feature); names.push(name); }
        });

        names.sort((a, b) => a.localeCompare(b));
        if (!active) return;
        setNeighborhoods(names.map((name) => ({ name })));

        const bounds = new window.google.maps.LatLngBounds();
        map.data.forEach((feature) => {
          const geometry = feature.getGeometry();
          if (geometry) extendBoundsFromGeometry(bounds, geometry);
        });
        if (!bounds.isEmpty()) {
          bostonBoundsRef.current = expandBoundsLiteral(toBoundsLiteral(bounds), 0.02, 0.03);
        }

        applyMapViewportSettings(mapScope, mapTheme, true);

        map.data.addListener("click", (event) => {
          const name = getCountyName(event.feature);
          // Clicking a neighborhood sets it as the filter and searches
          setSelectedNeighborhood(name);
        });

        setStatus(`Map ready. ${names.length} neighborhoods loaded. Use search to explore.`);
      } catch (err) {
        if (!active) return;
        setError(err.message);
        setStatus("Could not initialize the map.");
      }
    }

    init();
    return () => { active = false; };
  }, []);

  // Run search whenever selectedNeighborhood, selectedType, or searchText changes (only if a filter is active)
  useEffect(() => {
    if (!selectedNeighborhood && !selectedType && !searchText.trim()) return;
    runSearch();
  }, [selectedNeighborhood, selectedType]);

  async function runSearch() {
    const params = new URLSearchParams();
    if (searchText.trim()) params.set("search", searchText.trim());
    if (selectedNeighborhood) params.set("neighborhood", selectedNeighborhood);
    if (selectedType) params.set("place_type", selectedType);

    setSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/food-distributors?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
        placeMarkers(data);
      }
    } catch (_) {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  function clearSearch() {
    setSearchText("");
    setSelectedNeighborhood("");
    setSelectedType("");
    setSearchResults([]);
    setHasSearched(false);
    activeMarkersRef.current.forEach((m) => m.setMap(null));
    activeMarkersRef.current = [];
  }

  const hasFilters = searchText.trim() || selectedNeighborhood || selectedType;

  return (
    <div className="shell">
      <aside className="panel">
        <p className="eyebrow">Boston Food Equity Explorer</p>
        <h1>Food Access Map</h1>

        {/* Search bar */}
        <div className="search-box">
          <input
            className="search-input"
            type="text"
            placeholder="Search by name, description..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
          />
          <button className="search-btn" onClick={runSearch} disabled={searching}>
            {searching ? "..." : "Search"}
          </button>
        </div>

        {/* Type filter chips */}
        <div className="filter-chips">
          {[
            { value: "", label: "All Types" },
            { value: "farmers_market", label: "Farmers Markets" },
            { value: "restaurant", label: "Restaurants" },
          ].map((opt) => (
            <button
              key={opt.value}
              className={`chip ${selectedType === opt.value ? "chip-active" : ""}`}
              onClick={() => setSelectedType(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Neighborhood dropdown */}
        <div className="filter-row">
          <select
            className="control-input"
            value={selectedNeighborhood}
            onChange={(e) => setSelectedNeighborhood(e.target.value)}
          >
            <option value="">All Neighborhoods</option>
            {neighborhoods.map((n) => (
              <option key={n.name} value={n.name}>{n.name}</option>
            ))}
          </select>
          {hasFilters && (
            <button className="clear-btn" onClick={clearSearch}>Clear</button>
          )}
        </div>

        {/* Map controls */}
        <div className="control-grid" style={{ marginTop: "12px" }}>
          <label className="control">
            <span className="control-label">Map Theme</span>
            <select className="control-input" value={mapTheme} onChange={(e) => setMapTheme(e.target.value)}>
              <option value="civic">Civic Light</option>
              <option value="gray">Muted Gray</option>
              <option value="blueprint">Blueprint</option>
            </select>
          </label>
          <label className="control">
            <span className="control-label">Map Scope</span>
            <select className="control-input" value={mapScope} onChange={(e) => setMapScope(e.target.value)}>
              <option value="boston">Boston Only</option>
              <option value="massachusetts">Massachusetts</option>
            </select>
          </label>
        </div>

        <p className={`status ${error ? "status-error" : ""}`}>{error || status}</p>

        {/* Legend */}
        <div className="legend-row">
          <span className="legend-dot" style={{ background: "#F59E0B" }} /> Farmers Market
          <span className="legend-dot" style={{ background: "#10B981", marginLeft: "12px" }} /> Restaurant
        </div>

        {/* Search results list */}
        {hasSearched && (
          <section className="dataset">
            <h2>Results</h2>
            <p className="dataset-caption">
              {searching ? "Searching..." : `${searchResults.length} location${searchResults.length !== 1 ? "s" : ""} found`}
            </p>
            {!searching && searchResults.length === 0 && (
              <p className="dataset-caption">No results match your filters.</p>
            )}
            <div className="dataset-list" role="list">
              {searchResults.map((item, i) => (
                <div
                  key={i}
                  className="dataset-item dataset-item-clickable"
                  role="listitem"
                  onClick={() => {
                    if (!item.lat || !item.lng || !mapRef.current) return;
                    mapRef.current.panTo({ lat: item.lat, lng: item.lng });
                    mapRef.current.setZoom(15);
                  }}
                >
                  <span
                    className="result-dot"
                    style={{ background: PLACE_TYPE_COLORS[item.place_type] || "#6B7280" }}
                  />
                  <div className="result-text">
                    <span className="dataset-name">{item.name}</span>
                    <span className="dataset-meta">{item.neighborhood || item.city}</span>
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
    </div>
  );
}
