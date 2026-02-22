# Setup & Running the App

## 1. Environment Variables

Create a `.env` file in the project root with the following keys:

```
GOOGLE_MAPS_API=your_google_maps_api_key
MONGO_CONNECTION=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
```

| Variable | Description |
|---|---|
| `GOOGLE_MAPS_API` | Google Maps JavaScript API key (enables the map) |
| `MONGO_CONNECTION` | MongoDB connection URI (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/`) |
| `GEMINI_API_KEY` | Google Gemini API key (enables the AI neighborhood summaries) |

---

## 2. Install Dependencies

### Python (backend)
```bash
pip install -r requirements.txt
```

### Node (frontend)
```bash
npm install
```

---

## 3. Run the App

You need **two terminals** running at the same time:

### Terminal 1 — Flask backend
```bash
python app.py
```
Runs at `http://localhost:3000`

### Terminal 2 — Vite frontend (dev mode)
```bash
npm run dev
```
Runs at `http://localhost:5173` (proxies API calls to Flask)

---

## 4. Seed the Database (first time only)

To load data into MongoDB:
```bash
python seed.py
```

---

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/food-distributors` | All food locations (supports `?search=`, `?place_type=`, `?neighborhood=`) |
| `GET /api/farmers-markets` | Farmers markets only |
| `GET /api/income-inequality` | Income inequality data |
| `POST /api/gemini` | AI neighborhood summary (body: `{ neighborhood, context }`) |
