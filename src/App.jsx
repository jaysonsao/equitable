import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const BOSTON_CENTER = { lat: 42.3601, lng: -71.0589 };
const BOSTON_GEOJSON = "/data/boston_neighborhood_boundaries.geojson";
const COUNTY_COLOR = "#2A9D8F";
const PURPLE_LOW = "#E9D5FF";
const PURPLE_HIGH = "#4C1D95";
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

const GOOGLE_MAPS_API_KEY =
  typeof __GOOGLE_MAPS_API__ === "string" ? __GOOGLE_MAPS_API__.trim() : "";

function getCountyName(feature) {
  const name = feature.getProperty("name");
  return typeof name === "string" && name.trim() ? name.trim() : "Unknown County";
}

function hashString(input) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function interpolateColor(hexA, hexB, ratio) {
  const start = hexToRgb(hexA);
  const end = hexToRgb(hexB);
  const t = clamp(ratio, 0, 1);

  const r = Math.round(start.r + (end.r - start.r) * t);
  const g = Math.round(start.g + (end.g - start.g) * t);
  const b = Math.round(start.b + (end.b - start.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function getPopulationRange(counties) {
  if (!counties.length) return { min: 0, max: 1 };
  const values = counties.map((county) => county.population);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function getPopulationShade(population, range) {
  const span = range.max - range.min;
  const normalized = span === 0 ? 1 : (population - range.min) / span;
  return interpolateColor(PURPLE_LOW, PURPLE_HIGH, normalized);
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
  return {
    north: ne.lat(),
    south: sw.lat(),
    east: ne.lng(),
    west: sw.lng(),
  };
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

function getOuterRings(geometry) {
  const rings = [];

  function collect(innerGeometry) {
    const type = innerGeometry.getType();

    if (type === "Polygon") {
      const outer = innerGeometry.getArray()?.[0]?.getArray?.();
      if (outer && outer.length > 2) rings.push(outer);
      return;
    }

    if (type === "MultiPolygon" || type === "GeometryCollection") {
      innerGeometry.getArray().forEach((child) => collect(child));
    }
  }

  collect(geometry);
  return rings;
}

function getBoundsFromPath(path) {
  const bounds = new window.google.maps.LatLngBounds();
  path.forEach((latLng) => bounds.extend(latLng));
  return bounds;
}

function randomPointInPolygonPath(path, randomFn) {
  const polygon = new window.google.maps.Polygon({ paths: path });
  const bounds = getBoundsFromPath(path);

  const north = bounds.getNorthEast().lat();
  const east = bounds.getNorthEast().lng();
  const south = bounds.getSouthWest().lat();
  const west = bounds.getSouthWest().lng();

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const lat = south + (north - south) * randomFn();
    const lng = west + (east - west) * randomFn();
    const point = new window.google.maps.LatLng(lat, lng);
    if (window.google.maps.geometry.poly.containsLocation(point, polygon)) {
      return point;
    }
  }

  return bounds.getCenter();
}

function loadGoogleMaps(apiKey) {
  if (!apiKey) return Promise.reject(new Error("Missing GOOGLE_MAPS_API in .env."));
  if (window.google?.maps?.geometry) return Promise.resolve(window.google.maps);

  return new Promise((resolve, reject) => {
    const existing = document.getElementById("google-maps-js");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google.maps), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Google Maps script failed to load.")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-js";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error("Google Maps script failed to load."));
    document.head.appendChild(script);
  });
}

function createMarkerIcon(category) {
  const fillColor = category === "Grocery Store" ? "#3B82F6" : "#F59E0B";
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: 7,
    fillColor,
    fillOpacity: 0.95,
    strokeColor: "#ffffff",
    strokeWeight: 1.6,
  };
}

function makeFakeCountyData(counties, countyFeatureMap) {
  const fakeSites = [];
  const countyWithPopulation = counties.map((county) => {
    const seed = hashString(county.name);
    const random = seededRandom(seed);
    const population = 9000 + Math.floor(random() * 85000);

    const feature = countyFeatureMap.get(county.name);
    const geometry = feature?.getGeometry();
    const rings = geometry ? getOuterRings(geometry) : [];
    const primaryPath = rings[0] || [];
    const bounds = primaryPath.length ? getBoundsFromPath(primaryPath) : null;
    const centerLatLng = bounds
      ? bounds.getCenter()
      : new window.google.maps.LatLng(BOSTON_CENTER.lat, BOSTON_CENTER.lng);

    const siteCount = 2 + Math.floor(random() * 3);
    for (let i = 0; i < siteCount; i += 1) {
      const category = random() < 0.5 ? "Grocery Store" : "Farmers Market";
      const incomeIndex = 1 + Math.floor(random() * 5);
      const point =
        primaryPath.length > 2
          ? randomPointInPolygonPath(primaryPath, random)
          : new window.google.maps.LatLng(
              centerLatLng.lat() + (random() - 0.5) * 0.005,
              centerLatLng.lng() + (random() - 0.5) * 0.005
            );

      fakeSites.push({
        id: `${county.name.toLowerCase().replace(/\s+/g, "-")}-${i + 1}`,
        county: county.name,
        category,
        incomeIndex,
        label: `${county.name} ${category === "Grocery Store" ? "Grocery" : "Market"} ${i + 1}`,
        position: { lat: point.lat(), lng: point.lng() },
      });
    }

    return {
      ...county,
      population,
      center: { lat: centerLatLng.lat(), lng: centerLatLng.lng() },
    };
  });

  return {
    counties: countyWithPopulation,
    sites: fakeSites,
  };
}

export default function App() {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const infoWindowRef = useRef(null);
  const enabledSetRef = useRef(new Set());
  const markerRefs = useRef([]);
  const countyPopulationRef = useRef(new Map());
  const populationRangeRef = useRef({ min: 0, max: 1 });
  const bostonBoundsRef = useRef(null);

  const [status, setStatus] = useState("Loading map...");
  const [error, setError] = useState("");
  const [counties, setCounties] = useState([]);
  const [fakeSites, setFakeSites] = useState([]);
  const [populationShadingOn, setPopulationShadingOn] = useState(false);
  const [mapTheme, setMapTheme] = useState("civic");
  const [mapScope, setMapScope] = useState("boston");

  const allOn = counties.length > 0 && counties.every((county) => county.enabled);
  const populationRange = useMemo(() => getPopulationRange(counties), [counties]);

  const applyMapViewportSettings = useCallback(
    (scope, theme, fitToScope = false) => {
      const map = mapRef.current;
      if (!map) return;

      const scopeBounds =
        scope === "massachusetts" ? MASSACHUSETTS_BOUNDS : bostonBoundsRef.current || MASSACHUSETTS_BOUNDS;

      map.setOptions({
        styles: getMapStyles(theme),
        restriction: {
          latLngBounds: scopeBounds,
          strictBounds: true,
        },
        minZoom: scope === "massachusetts" ? 7 : 10,
        maxZoom: 17,
      });

      if (fitToScope) {
        map.fitBounds(scopeBounds, scope === "massachusetts" ? 24 : 40);
      }
    },
    []
  );

  const refreshStyles = useCallback(() => {
    if (!mapRef.current) return;

    mapRef.current.data.setStyle((feature) => {
      const county = getCountyName(feature);
      const visible = enabledSetRef.current.has(county);
      const population = countyPopulationRef.current.get(county)?.population ?? 0;
      const fill = populationShadingOn
        ? getPopulationShade(population, populationRangeRef.current)
        : COUNTY_COLOR;

      return {
        clickable: visible,
        fillColor: fill,
        fillOpacity: visible ? (populationShadingOn ? 0.62 : 0.38) : 0,
        strokeColor: populationShadingOn ? "#4C1D95" : COUNTY_COLOR,
        strokeOpacity: visible ? 0.92 : 0,
        strokeWeight: visible ? 2 : 0,
      };
    });
  }, [populationShadingOn]);

  const refreshMarkerVisibility = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    markerRefs.current.forEach((entry) => {
      const show = enabledSetRef.current.has(entry.county);
      entry.marker.setMap(show ? map : null);
    });
  }, []);

  useEffect(() => {
    enabledSetRef.current = new Set(counties.filter((county) => county.enabled).map((county) => county.name));
    countyPopulationRef.current = new Map(
      counties.map((county) => [county.name, { center: county.center, population: county.population }])
    );
    populationRangeRef.current = populationRange;

    refreshStyles();
    refreshMarkerVisibility();
  }, [counties, populationRange, refreshStyles, refreshMarkerVisibility]);

  useEffect(() => {
    applyMapViewportSettings(mapScope, mapTheme, false);
  }, [mapTheme, applyMapViewportSettings]);

  useEffect(() => {
    applyMapViewportSettings(mapScope, mapTheme, true);
  }, [mapScope, applyMapViewportSettings]);

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

        setStatus("Loading county boundaries...");
        const response = await fetch(BOSTON_GEOJSON);
        if (!response.ok) throw new Error(`Boundary file failed to load (${response.status}).`);

        const geoJson = await response.json();
        const features = map.data.addGeoJson(geoJson);

        const countyFeatureMap = new Map();
        const names = [];
        features.forEach((feature) => {
          const countyName = getCountyName(feature);
          if (!countyFeatureMap.has(countyName)) {
            countyFeatureMap.set(countyName, feature);
            names.push(countyName);
          }
        });

        names.sort((a, b) => a.localeCompare(b));
        const baseCounties = names.map((name) => ({
          name,
          enabled: true,
          color: COUNTY_COLOR,
          population: 0,
          center: BOSTON_CENTER,
        }));

        const fakeData = makeFakeCountyData(baseCounties, countyFeatureMap);

        if (!active) return;
        setCounties(fakeData.counties);
        setFakeSites(fakeData.sites);

        const bounds = new window.google.maps.LatLngBounds();
        map.data.forEach((feature) => {
          const geometry = feature.getGeometry();
          if (geometry) extendBoundsFromGeometry(bounds, geometry);
        });
        if (!bounds.isEmpty()) {
          bostonBoundsRef.current = expandBoundsLiteral(toBoundsLiteral(bounds), 0.02, 0.03);
        }

        applyMapViewportSettings(mapScope, mapTheme, true);

        markerRefs.current = fakeData.sites.map((site) => {
          const marker = new window.google.maps.Marker({
            map,
            position: site.position,
            title: site.label,
            icon: createMarkerIcon(site.category),
          });

          marker.addListener("click", () => {
            const wrapper = document.createElement("div");
            wrapper.className = "info-window";

            const title = document.createElement("strong");
            title.textContent = site.label;

            const line1 = document.createElement("div");
            line1.textContent = `${site.category} | ${site.county}`;

            const line2 = document.createElement("div");
            line2.textContent = `Income Index: ${site.incomeIndex}`;

            wrapper.appendChild(title);
            wrapper.appendChild(line1);
            wrapper.appendChild(line2);

            infoWindowRef.current.setContent(wrapper);
            infoWindowRef.current.open({ map, anchor: marker });
          });

          return { marker, county: site.county };
        });

        map.data.addListener("click", (event) => {
          const county = getCountyName(event.feature);
          if (!enabledSetRef.current.has(county)) return;

          const population = countyPopulationRef.current.get(county)?.population ?? "N/A";
          const content = document.createElement("div");

          const name = document.createElement("strong");
          name.textContent = county;

          const pop = document.createElement("div");
          pop.textContent = `Population (fake): ${population}`;

          content.appendChild(name);
          content.appendChild(pop);

          infoWindowRef.current.setPosition(event.latLng);
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(map);
        });

        setStatus(
          `Map ready. ${fakeData.counties.length} counties loaded, ${fakeData.sites.length} fake food access points generated.`
        );
      } catch (err) {
        if (!active) return;
        setError(err.message);
        setStatus("Could not initialize the map.");
      }
    }

    init();

    return () => {
      active = false;
      markerRefs.current.forEach(({ marker }) => marker.setMap(null));
      markerRefs.current = [];
    };
  }, []);

  const toggleCounty = (name) => {
    setCounties((current) =>
      current.map((county) => (county.name === name ? { ...county, enabled: !county.enabled } : county))
    );
  };

  const toggleAllCounties = () => {
    setCounties((current) => current.map((county) => ({ ...county, enabled: !allOn })));
  };

  const enabledCount = useMemo(
    () => counties.reduce((acc, county) => acc + (county.enabled ? 1 : 0), 0),
    [counties]
  );

  return (
    <div className="shell">
      <aside className="panel">
        <p className="eyebrow">Google Maps + Synthetic County Data</p>
        <h1>Boston County Access Explorer</h1>
        <p className="lede">
          Counties use strict polygon borders. Toggle population shading to apply a light-to-dark purple
          scale based on relative county population.
        </p>

        <div className="control-grid">
          <label className="control">
            <span className="control-label">Map Theme</span>
            <select
              className="control-input"
              value={mapTheme}
              onChange={(event) => setMapTheme(event.target.value)}
            >
              <option value="civic">Civic Light</option>
              <option value="gray">Muted Gray</option>
              <option value="blueprint">Blueprint</option>
            </select>
          </label>

          <label className="control">
            <span className="control-label">Map Scope</span>
            <select
              className="control-input"
              value={mapScope}
              onChange={(event) => setMapScope(event.target.value)}
            >
              <option value="boston">Boston Only</option>
              <option value="massachusetts">Massachusetts</option>
            </select>
          </label>
        </div>

        <div className="meta-row">
          <button type="button" className="toggle-all" onClick={toggleAllCounties} disabled={!counties.length}>
            {allOn ? "Hide All Counties" : "Show All Counties"}
          </button>
          <span className="count-pill">{enabledCount} visible</span>
        </div>

        <div className="meta-row">
          <button
            type="button"
            className={`heatmap-toggle ${populationShadingOn ? "heatmap-on" : ""}`}
            onClick={() => setPopulationShadingOn((current) => !current)}
            disabled={!counties.length}
          >
            {populationShadingOn ? "Population Shading: On" : "Population Shading: Off"}
          </button>
          <span className="count-pill">Purple Scale</span>
        </div>

        {populationShadingOn && (
          <div className="legend" aria-label="Population shading legend">
            <span className="legend-label">Low</span>
            <span className="legend-bar" />
            <span className="legend-label">High</span>
          </div>
        )}

        <p className={`status ${error ? "status-error" : ""}`}>{error || status}</p>

        <div className="list" role="list" aria-label="County toggles">
          {counties.map((county) => (
            <button
              key={county.name}
              type="button"
              className={`item ${county.enabled ? "item-on" : ""}`}
              style={{
                "--swatch": populationShadingOn
                  ? getPopulationShade(county.population, populationRange)
                  : COUNTY_COLOR,
              }}
              onClick={() => toggleCounty(county.name)}
              aria-pressed={county.enabled}
            >
              <span className="swatch" aria-hidden="true" />
              <span className="item-label">{county.name}</span>
              <span className="item-state">Pop {county.population.toLocaleString()}</span>
            </button>
          ))}
        </div>

        <section className="dataset">
          <h2>Fake Food Access Data</h2>
          <p className="dataset-caption">Category: Grocery Store or Farmers Market | Income Index: 1-5</p>
          <div className="dataset-list" role="list" aria-label="Fake food access data">
            {fakeSites.map((site) => (
              <div key={site.id} className="dataset-item" role="listitem">
                <span className="dataset-name">{site.label}</span>
                <span className="dataset-meta">
                  {site.category} | {site.county} | Income {site.incomeIndex}
                </span>
              </div>
            ))}
          </div>
        </section>
      </aside>

      <main className="map-wrap">
        <div ref={mapElRef} className="map" aria-label="Boston county map" />
      </main>
    </div>
  );
}
