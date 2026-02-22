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

  const filterResultsToBoston = useCallback((results) => {
    if (!Array.isArray(results)) return [];

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
  }, []);

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
        const previewFiltered = filterResultsToBoston(previewRaw);
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
    mapScope,
    mapTheme,
    filterResultsToBoston,
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
      const rawResults = data.results || [];
      const filteredResults = filterResultsToBoston(rawResults);
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

  function clearAll() {
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

  const neighborhoodGini = neighborhoodMetrics?.income?.avg_gini_for_neighborhood;
  const citywideGini = neighborhoodMetrics?.income?.avg_gini_citywide;
  const displayGini = neighborhoodGini;
  const giniSourceLabel = neighborhoodGini != null ? "neighborhood" : "";

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
            <span className="control-label">Map Scope</span>
            <select className="control-input" value={mapScope} onChange={(event) => setMapScope(event.target.value)}>
              <option value="boston">Boston Only</option>
              <option value="massachusetts">Massachusetts</option>
            </select>
          </label>
        </div>

        {/* Choropleth toggle */}
        <button
          className={`choropleth-btn ${showChoropleth ? "choropleth-on" : ""}`}
          onClick={() => {
            const next = !showChoropleth;
            setShowChoropleth(next);
            showChoroplethRef.current = next;
            refreshBoundaryStyles();
          }}
        >
          {showChoropleth ? "Hide" : "Show"} Income Inequality Layer
        </button>

        <p className={`status ${error ? "status-error" : ""}`}>{error || status}</p>

        {/* Choropleth legend */}
        {showChoropleth && (
          <div className="choropleth-legend">
            <span className="control-label">Poverty Rate by Neighborhood</span>
            <div className="choropleth-bar" />
            <div className="choropleth-labels">
              <span>{(giniRange.min * 100).toFixed(1)}% — Lower Poverty</span>
              <span>Higher Poverty — {(giniRange.max * 100).toFixed(1)}%</span>
            </div>
          </div>
        )}

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

        {(selectedNeighborhood || metricsLoading || metricsError) && (
          <section className="dataset">
            <h2>Neighborhood Metrics</h2>
            <p className="dataset-caption">
              {selectedNeighborhood || "Click a neighborhood on the map"}
            </p>

            {metricsLoading && <p className="dataset-caption">Loading metrics...</p>}
            {metricsError && <p className="dataset-caption">{metricsError}</p>}

            {!metricsLoading && neighborhoodMetrics && (
              <div className="dataset-list" role="list" aria-label="Neighborhood metrics">
                <div className="dataset-item" role="listitem">
                  <span className="dataset-name">Population</span>
                  <span className="dataset-meta">
                    {neighborhoodMetrics.population != null
                      ? Number(neighborhoodMetrics.population).toLocaleString()
                      : "N/A"}
                  </span>
                </div>

                <div className="dataset-item" role="listitem">
                  <span className="dataset-name">Income Inequality (Avg Gini)</span>
                  <span className="dataset-meta">
                    {formatMetric(displayGini)}
                    {giniSourceLabel ? ` (${giniSourceLabel})` : ""}
                  </span>
                </div>

                {neighborhoodMetrics.income?.availability === "unavailable" && (
                  <div className="dataset-item" role="listitem">
                    <span className="dataset-name">Income Status</span>
                    <span className="dataset-meta">
                      {neighborhoodMetrics.income?.availability_reason || "Neighborhood Gini unavailable."}
                    </span>
                  </div>
                )}

                {citywideGini != null && (
                  <div className="dataset-item" role="listitem">
                    <span className="dataset-name">Citywide Avg Gini (Reference)</span>
                    <span className="dataset-meta">{formatMetric(citywideGini)}</span>
                  </div>
                )}

                <div className="dataset-item" role="listitem">
                  <span className="dataset-name">Restaurants</span>
                  <span className="dataset-meta">
                    {neighborhoodMetrics.counts?.restaurants ?? 0} | per 1000: {formatMetric(neighborhoodMetrics.per_1000?.restaurants)}
                  </span>
                </div>

                <div className="dataset-item" role="listitem">
                  <span className="dataset-name">Grocery Stores</span>
                  <span className="dataset-meta">
                    {neighborhoodMetrics.counts?.grocery_stores ?? 0} | per 1000: {formatMetric(neighborhoodMetrics.per_1000?.grocery_stores)}
                  </span>
                </div>

                <div className="dataset-item" role="listitem">
                  <span className="dataset-name">Farmers Markets</span>
                  <span className="dataset-meta">
                    {neighborhoodMetrics.counts?.farmers_markets ?? 0} | per 1000: {formatMetric(neighborhoodMetrics.per_1000?.farmers_markets)}
                  </span>
                </div>

                <div className="dataset-item" role="listitem">
                  <span className="dataset-name">Food Pantries</span>
                  <span className="dataset-meta">
                    {neighborhoodMetrics.counts?.food_pantries ?? 0} | per 1000: {formatMetric(neighborhoodMetrics.per_1000?.food_pantries)}
                  </span>
                </div>

                <div className="dataset-item" role="listitem">
                  <span className="dataset-name">Total Access Points</span>
                  <span className="dataset-meta">
                    {neighborhoodMetrics.totals?.access_points ?? 0} | per 1000: {formatMetric(neighborhoodMetrics.per_1000?.access_points)}
                  </span>
                </div>
              </div>
            )}
          </section>
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
