import os
import json
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen
from flask import Flask, send_from_directory, Response, abort, jsonify, request
from services import mongo, gemini

ROOT = Path(__file__).parent.resolve()

app = Flask(__name__, static_folder=str(ROOT))


def load_dot_env(filepath: Path) -> dict:
    env = {}
    if not filepath.exists():
        return env
    for line in filepath.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
            value = value[1:-1]
        env[key] = value
    return env


dot_env = load_dot_env(ROOT / ".env")

# Load env vars from .env into os.environ so services can read them
for k, v in dot_env.items():
    os.environ.setdefault(k, v)

GOOGLE_MAPS_API_KEY = os.environ.get("GOOGLE_MAPS_API", "")
METERS_PER_MILE = 1609.344
MIN_RADIUS_MILES = 0.5
MAX_RADIUS_MILES = 50
DEFAULT_RESULT_LIMIT = 250
MAX_RESULT_LIMIT = 1000


def _to_float(value, field_name: str) -> float:
    try:
        return float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Invalid {field_name}: expected number") from exc


def _to_int(value, field_name: str) -> int:
    try:
        return int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Invalid {field_name}: expected integer") from exc


def _extract_coordinates(payload: dict):
    if payload.get("lat") is not None and payload.get("lng") is not None:
        return payload.get("lat"), payload.get("lng")
    pin = payload.get("pin")
    if isinstance(pin, dict) and pin.get("lat") is not None and pin.get("lng") is not None:
        return pin.get("lat"), pin.get("lng")
    coords = payload.get("coordinates")
    if isinstance(coords, dict) and coords.get("lat") is not None and coords.get("lng") is not None:
        return coords.get("lat"), coords.get("lng")
    return None, None


def _geocode_address(address: str) -> dict:
    if not GOOGLE_MAPS_API_KEY:
        raise RuntimeError("Address search unavailable: GOOGLE_MAPS_API is not configured")

    query = urlencode({"address": address, "key": GOOGLE_MAPS_API_KEY})
    url = f"https://maps.googleapis.com/maps/api/geocode/json?{query}"
    try:
        with urlopen(url, timeout=8) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        raise RuntimeError(f"Google geocoding failed with HTTP {exc.code}") from exc
    except URLError as exc:
        raise RuntimeError("Google geocoding request failed") from exc
    except json.JSONDecodeError as exc:
        raise RuntimeError("Invalid geocoding response") from exc

    status = payload.get("status")
    if status != "OK" or not payload.get("results"):
        raise ValueError(f"Address could not be geocoded (status={status})")

    top = payload["results"][0]
    location = top.get("geometry", {}).get("location", {})
    lat = location.get("lat")
    lng = location.get("lng")
    if lat is None or lng is None:
        raise ValueError("Geocoding response missing coordinates")

    return {
        "lat": float(lat),
        "lng": float(lng),
        "formatted_address": top.get("formatted_address"),
        "place_id": top.get("place_id"),
    }


@app.route("/config.js")
def config_js():
    payload = f"window.APP_CONFIG = {json.dumps({'GOOGLE_MAPS_API_KEY': GOOGLE_MAPS_API_KEY})};"
    return Response(payload, content_type="application/javascript; charset=utf-8")


@app.route("/api/farmers-markets")
def farmers_markets():
    try:
        return jsonify(mongo.get_farmers_markets())
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 503


@app.route("/api/food-distributors")
def food_distributors():
    try:
        place_type = request.args.get("place_type")
        neighborhood = request.args.get("neighborhood")
        search = request.args.get("search")
        sample_pct = request.args.get("sample_pct")
        limit = request.args.get("limit")

        sample_pct_value = _to_float(sample_pct, "sample_pct") if sample_pct is not None else None
        limit_value = _to_int(limit, "limit") if limit is not None else None
        if limit_value is not None and limit_value < 1:
            return jsonify({"error": "limit must be at least 1"}), 400

        return jsonify(
            mongo.get_food_distributors(
                place_type=place_type,
                neighborhood=neighborhood,
                search=search,
                sample_pct=sample_pct_value,
                limit=limit_value,
            )
        )
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 503


@app.route("/api/food-distributors/search-radius", methods=["GET", "POST"])
def food_distributors_search_radius():
    payload = request.get_json(silent=True) or {}
    if request.method == "GET":
        payload = {**request.args.to_dict(), **payload}

    address = str(payload.get("address", "")).strip()
    lat_raw, lng_raw = _extract_coordinates(payload)
    radius_raw = payload.get("radius_miles", MIN_RADIUS_MILES)
    limit_raw = payload.get("limit", DEFAULT_RESULT_LIMIT)

    try:
        radius_miles = _to_float(radius_raw, "radius_miles")
        if radius_miles < MIN_RADIUS_MILES:
            raise ValueError(f"radius_miles must be at least {MIN_RADIUS_MILES}")
        if radius_miles > MAX_RADIUS_MILES:
            raise ValueError(f"radius_miles must be at most {MAX_RADIUS_MILES}")

        limit = _to_int(limit_raw, "limit")
        if limit < 1:
            raise ValueError("limit must be at least 1")
        if limit > MAX_RESULT_LIMIT:
            raise ValueError(f"limit must be at most {MAX_RESULT_LIMIT}")
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    geocode_meta = None
    search_source = "pin"
    try:
        if lat_raw is not None and lng_raw is not None:
            lat = _to_float(lat_raw, "lat")
            lng = _to_float(lng_raw, "lng")
        elif address:
            geocode_meta = _geocode_address(address)
            lat = geocode_meta["lat"]
            lng = geocode_meta["lng"]
            search_source = "address"
        else:
            return jsonify({"error": "Provide either address or coordinates (lat/lng or pin.lat/pin.lng)."}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 502

    if lat < -90 or lat > 90:
        return jsonify({"error": "Invalid lat: must be between -90 and 90"}), 400
    if lng < -180 or lng > 180:
        return jsonify({"error": "Invalid lng: must be between -180 and 180"}), 400

    place_type = request.args.get("place_type") if request.method == "GET" else payload.get("place_type")
    neighborhood = request.args.get("neighborhood") if request.method == "GET" else payload.get("neighborhood")
    search = request.args.get("search") if request.method == "GET" else payload.get("search")

    try:
        results = mongo.search_food_distributors_by_radius(
            lat=lat,
            lng=lng,
            radius_miles=radius_miles,
            limit=limit,
            place_type=place_type,
            neighborhood=neighborhood,
            search=search,
        )
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 503

    response = {
        "search_source": search_source,
        "search_center": {"lat": lat, "lng": lng},
        "radius_miles": radius_miles,
        "radius_meters": radius_miles * METERS_PER_MILE,
        "limit": limit,
        "count": len(results),
        "results": results,
    }
    if geocode_meta:
        response["geocode"] = {
            "formatted_address": geocode_meta.get("formatted_address"),
            "place_id": geocode_meta.get("place_id"),
        }
    return jsonify(response)


@app.route("/api/income-inequality")
def income_inequality():
    try:
        return jsonify(mongo.get_income_inequality())
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 503


@app.route("/api/gemini", methods=["POST"])
def gemini_ask():
    body = request.get_json(silent=True) or {}
    neighborhood = body.get("neighborhood", "")
    context = body.get("context", {})
    if not neighborhood:
        return jsonify({"error": "neighborhood is required"}), 400
    try:
        answer = gemini.ask_about_neighborhood(neighborhood, context)
        return jsonify({"response": answer})
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 503


@app.route("/", defaults={"req_path": ""})
@app.route("/<path:req_path>")
def serve_static(req_path: str):
    if not req_path:
        req_path = "index.html"

    try:
        target = (ROOT / req_path).resolve()
        target.relative_to(ROOT)
    except ValueError:
        abort(403)

    if not target.exists():
        abort(404)

    return send_from_directory(str(ROOT), req_path)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    print(f"Boston map app running at http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
