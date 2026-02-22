import os
import json
from pathlib import Path
from flask import Flask, send_from_directory, Response, abort, jsonify
from pymongo import MongoClient

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
GOOGLE_MAPS_API_KEY = os.environ.get("GOOGLE_MAPS_API") or dot_env.get("GOOGLE_MAPS_API", "")
MONGO_URI = os.environ.get("MONGO_URI") or dot_env.get("MONGO_URI", "")
MONGO_DB = os.environ.get("MONGO_DB") or dot_env.get("MONGO_DB", "food-distributors")
MONGO_COLLECTION = os.environ.get("MONGO_COLLECTION") or dot_env.get("MONGO_COLLECTION", "food-distributors")

# MongoDB connection
mongo_client = MongoClient(MONGO_URI) if MONGO_URI else None
db = mongo_client[MONGO_DB] if mongo_client else None


@app.route("/config.js")
def config_js():
    payload = f"window.APP_CONFIG = {json.dumps({'GOOGLE_MAPS_API_KEY': GOOGLE_MAPS_API_KEY})};"
    return Response(payload, content_type="application/javascript; charset=utf-8")


@app.route("/api/farmers-markets")
def farmers_markets():
    if db is None:
        return jsonify({"error": "No MongoDB connection"}), 503
    markets = list(db[MONGO_COLLECTION].find({"datatype": "farmers market"}, {"_id": 0}))
    return jsonify(markets)


@app.route("/api/food-distributors")
def food_distributors():
    if db is None:
        return jsonify({"error": "No MongoDB connection"}), 503
    data = list(db[MONGO_COLLECTION].find({}, {"_id": 0}))
    return jsonify(data)


@app.route("/api/income-inequality")
def income_inequality():
    if db is None:
        return jsonify({"error": "No MongoDB connection"}), 503
    data = list(db["income_inequality"].find({}, {"_id": 0}))
    return jsonify(data)


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
    if mongo_client:
        print("MongoDB connected")
    else:
        print("Warning: No MONGO_URI set — MongoDB disabled")
    app.run(host="0.0.0.0", port=port, debug=True)
