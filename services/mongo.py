import os
from pymongo import MongoClient, GEOSPHERE

_client = None
_db = None
_geo_index_ready = False

METERS_PER_MILE = 1609.344


def get_db():
    global _client, _db, _geo_index_ready
    if _db is None:
        uri = os.environ.get("MONGO_CONNECTION", "")
        if not uri:
            raise RuntimeError("MONGO_CONNECTION not set")
        _client = MongoClient(uri)
        _db = _client["food-distributors"]
    if not _geo_index_ready:
        # Required for geospatial queries like $near.
        try:
            _db["food-distributors"].create_index([("location", GEOSPHERE)])
            _geo_index_ready = True
        except Exception as exc:
            raise RuntimeError(f"Failed to ensure 2dsphere index on location: {exc}") from exc
    return _db


def _build_text_filters(query, place_type=None, neighborhood=None, search=None):
    if place_type:
        query["place_type"] = place_type
    if neighborhood:
        query["neighborhood_name"] = {"$regex": neighborhood, "$options": "i"}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"neighborhood_name": {"$regex": search, "$options": "i"}},
        ]
    return query


def _serialize_doc(doc):
    coords = (doc.get("location") or {}).get("coordinates", [])
    return {
        "name": doc.get("name"),
        "address": (doc.get("address") or {}).get("formatted_address") or (doc.get("address") or {}).get("line1"),
        "city": (doc.get("address") or {}).get("city_norm"),
        "neighborhood": doc.get("neighborhood_name"),
        "description": doc.get("description"),
        "website": (doc.get("contact") or {}).get("website"),
        "phone": (doc.get("contact") or {}).get("phone"),
        "place_type": doc.get("place_type"),
        "subtype": doc.get("subtype"),
        "datatype": doc.get("datatype"),
        "lat": coords[1] if len(coords) >= 2 else None,
        "lng": coords[0] if len(coords) >= 2 else None,
    }


def get_food_distributors(place_type=None, neighborhood=None, search=None, sample_pct=None, limit=None):
    db = get_db()
    collection = db["food-distributors"]
    query = _build_text_filters({}, place_type=place_type, neighborhood=neighborhood, search=search)
    docs = None

    if sample_pct is not None:
        pct = float(sample_pct)
        if pct <= 0 or pct > 1:
            raise ValueError("sample_pct must be > 0 and <= 1")
        total = collection.count_documents(query)
        sample_size = max(1, int(total * pct)) if total else 0
        if limit is not None:
            sample_size = min(sample_size, int(limit))
        if sample_size == 0:
            return []
        docs = collection.aggregate(
            [
                {"$match": query},
                {"$sample": {"size": sample_size}},
                {"$project": {"_id": 0}},
            ]
        )
    else:
        docs = collection.find(query, {"_id": 0})
        if limit is not None:
            docs = docs.limit(int(limit))

    return [_serialize_doc(doc) for doc in docs]


def search_food_distributors_by_radius(
    *,
    lat,
    lng,
    radius_miles,
    limit=250,
    place_type=None,
    neighborhood=None,
    search=None,
):
    db = get_db()
    max_distance_meters = float(radius_miles) * METERS_PER_MILE

    query = _build_text_filters(
        {
            "location": {
                "$near": {
                    "$geometry": {"type": "Point", "coordinates": [float(lng), float(lat)]},
                    "$maxDistance": max_distance_meters,
                }
            }
        },
        place_type=place_type,
        neighborhood=neighborhood,
        search=search,
    )

    docs = db["food-distributors"].find(query, {"_id": 0}).limit(int(limit))
    return [_serialize_doc(doc) for doc in docs]


def get_farmers_markets():
    return get_food_distributors(place_type="farmers_market")


def get_income_inequality():
    db = get_db()
    return list(db["income_inequality"].find({}, {"_id": 0})) if "income_inequality" in db.list_collection_names() else []
