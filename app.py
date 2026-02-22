import os
import json
from pathlib import Path
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
