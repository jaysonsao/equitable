import { useCallback, useEffect, useRef, useState } from "react";

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
        <p className="splash-title">Boston Food Equity Explorer</p>
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

const MASSACHUSETTS_BOUNDS = {
  north: 42.88679,
  south: 41.18705,
  east: -69.85886,
  west: -73.50814,
};

const PLACE_TYPE_COLORS = {
  farmers_market: "#F59E0B",
  restaurant: "#10B981",
  grocery_store: "#3B82F6",
};

const PLACE_TYPE_LABELS = {
  farmers_market: "Farmers Market",
  restaurant: "Restaurant",
  grocery_store: "Grocery Store",
};

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

export default function App() {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const infoWindowRef = useRef(null);
  const bostonBoundsRef = useRef(null);
  const activeMarkersRef = useRef([]);
  const pinMarkerRef = useRef(null);
  const centerMarkerRef = useRef(null);
  const radiusCircleRef = useRef(null);

  const [showSplash, setShowSplash] = useState(true);
  const [status, setStatus] = useState("Loading map...");
  const [error, setError] = useState("");
  const [mapTheme, setMapTheme] = useState("civic");
  const [mapScope, setMapScope] = useState("boston");

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

  const refreshBoundaryStyles = useCallback(() => {
    if (!mapRef.current) return;
    mapRef.current.data.setStyle(() => ({
      clickable: true,
      fillColor: COUNTY_COLOR,
      fillOpacity: 0.2,
      strokeColor: COUNTY_COLOR,
      strokeOpacity: 0.8,
      strokeWeight: 2,
    }));
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
  }, [mapTheme, mapScope, applyMapViewportSettings]);

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
        map.data.addGeoJson(geoJson);
        const bounds = new window.google.maps.LatLngBounds();
        map.data.forEach((feature) => {
          const geometry = feature.getGeometry();
          if (geometry) extendBoundsFromGeometry(bounds, geometry);
        });
        if (!bounds.isEmpty()) {
          bostonBoundsRef.current = expandBoundsLiteral(toBoundsLiteral(bounds), 0.02, 0.03);
        }

        refreshBoundaryStyles();
        applyMapViewportSettings(mapScope, mapTheme, true);

        map.data.addListener("click", (event) => {
          const name = getNeighborhoodName(event.feature);
          const nextPin = { lat: event.latLng.lat(), lng: event.latLng.lng() };
          setDroppedPin(nextPin);

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

        setPreviewResults(Array.isArray(previewData) ? previewData : []);
        if (Array.isArray(previewData) && previewData.length > 0) {
          placeMarkers(previewData, null, DEFAULT_RADIUS_MILES);
          setStatus(
            `Map ready. Showing ${previewData.length} sampled locations (10%). Enter an address or drop a pin.`
          );
        } else {
          setStatus("Map ready. No preview locations returned.");
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
      if (pinMarkerRef.current) {
        pinMarkerRef.current.setMap(null);
        pinMarkerRef.current = null;
      }
    };
  }, [
    applyMapViewportSettings,
    clearResultMarkers,
    clearSearchOverlay,
    mapScope,
    mapTheme,
    placeMarkers,
    refreshBoundaryStyles,
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

  async function runRadiusSearch(sourceHint) {
    setError("");

    const parsedRadius = Number.parseFloat(radiusMiles);
    if (!Number.isFinite(parsedRadius) || parsedRadius < MIN_RADIUS_MILES) {
      setError(`Radius must be at least ${MIN_RADIUS_MILES} miles.`);
      return;
    }

    const preferAddress = sourceHint === "address";
    const preferPin = sourceHint === "pin";
    const hasAddress = addressInput.trim().length > 0;
    const useAddress = preferAddress || (!preferPin && hasAddress);

    const payload = {
      radius_miles: parsedRadius,
      limit: DEFAULT_LIMIT,
    };
    if (selectedType) payload.place_type = selectedType;

    if (useAddress) {
      if (!hasAddress) {
        setError("Enter an address before searching by address.");
        return;
      }
      payload.address = addressInput.trim();
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

      setSearchResults(data.results || []);
      setSearchCenter(data.search_center || null);
      setLastSearchSource(data.search_source || (useAddress ? "address" : "pin"));
      if (data?.geocode?.formatted_address) {
        setLastResolvedAddress(data.geocode.formatted_address);
      }

      placeMarkers(data.results || [], data.search_center || null, parsedRadius);
      setStatus(`Found ${data.count ?? (data.results || []).length} location(s) within ${parsedRadius} miles.`);
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

  function clearAll() {
    setAddressInput("");
    setSelectedType("");
    setRadiusMiles(String(DEFAULT_RADIUS_MILES));
    setDroppedPin(null);
    clearSearchState();
  }

  const shownCount = hasSearched ? searchResults.length : previewResults.length;

  if (showSplash) return <SplashScreen onDone={() => setShowSplash(false)} />;

  return (
    <div className="shell">
      <aside className="panel">
        <p className="eyebrow">Boston Food Equity Explorer</p>
        <h1>Radius Search</h1>
        <p className="lede">
          Search around an address or a dropped pin. Only locations within your selected radius are rendered.
        </p>

        <div className="search-box">
          <input
            className="search-input"
            type="text"
            placeholder="Enter address (example: 29 Austin St, Charlestown)"
            value={addressInput}
            onChange={(event) => setAddressInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") runRadiusSearch("address");
            }}
          />
          <button className="search-btn" type="button" disabled={searching} onClick={() => runRadiusSearch("address")}>
            Search Address
          </button>
        </div>

        <div className="pin-status">
          <span className="control-label">Dropped Pin</span>
          <div className="pin-coordinates">
            {droppedPin
              ? `${droppedPin.lat.toFixed(6)}, ${droppedPin.lng.toFixed(6)}`
              : "Click map to drop a pin"}
          </div>
          <button className="pin-search-btn" type="button" disabled={searching} onClick={() => runRadiusSearch("pin")}>
            Search From Pin
          </button>
        </div>

        <div className="control-grid">
          <label className="control">
            <span className="control-label">Radius (miles)</span>
            <input
              className="control-input"
              type="number"
              min={MIN_RADIUS_MILES}
              step="0.5"
              value={radiusMiles}
              onChange={(event) => setRadiusMiles(event.target.value)}
            />
          </label>
        </div>

        <div className="filter-chips">
          {[
            { value: "", label: "All Types" },
            { value: "farmers_market", label: "Farmers Markets" },
            { value: "restaurant", label: "Restaurants" },
            { value: "grocery_store", label: "Grocery Stores" },
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
          <button className="toggle-all" type="button" onClick={clearAll}>
            Clear Search + Pin
          </button>
          <span className="count-pill">{shownCount} shown</span>
        </div>

        <div className="control-grid">
          <label className="control">
            <span className="control-label">Map Theme</span>
            <select className="control-input" value={mapTheme} onChange={(event) => setMapTheme(event.target.value)}>
              <option value="civic">Civic Light</option>
              <option value="gray">Muted Gray</option>
              <option value="blueprint">Blueprint</option>
            </select>
          </label>
          <label className="control">
            <span className="control-label">Map Scope</span>
            <select className="control-input" value={mapScope} onChange={(event) => setMapScope(event.target.value)}>
              <option value="boston">Boston Only</option>
              <option value="massachusetts">Massachusetts</option>
            </select>
          </label>
        </div>

        <p className={`status ${error ? "status-error" : ""}`}>{error || status}</p>

        {(lastSearchSource || lastResolvedAddress || searchCenter) && (
          <div className="search-meta">
            {lastSearchSource && <div>Source: {lastSearchSource === "address" ? "Address" : "Pin"}</div>}
            {lastResolvedAddress && <div>Resolved: {lastResolvedAddress}</div>}
            {searchCenter && (
              <div>
                Center: {searchCenter.lat.toFixed(6)}, {searchCenter.lng.toFixed(6)}
              </div>
            )}
          </div>
        )}

        <div className="legend-row">
          <span className="legend-dot" style={{ background: "#F59E0B" }} /> Farmers Market
          <span className="legend-dot" style={{ background: "#10B981", marginLeft: "10px" }} /> Restaurant
          <span className="legend-dot" style={{ background: "#3B82F6", marginLeft: "10px" }} /> Grocery
        </div>

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
    </div>
  );
}
