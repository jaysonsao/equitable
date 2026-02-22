import os
from pymongo import MongoClient

_client = None
_db = None


def get_db():
    global _client, _db
    if _db is None:
        uri = os.environ.get("MONGO_CONNECTION", "")
        if not uri:
            raise RuntimeError("MONGO_CONNECTION not set")
        _client = MongoClient(uri)
        _db = _client["food-distributors"]
    return _db


def get_food_distributors(place_type=None, neighborhood=None, search=None):
    db = get_db()
    query = {}
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
    docs = db["food-distributors"].find(query, {"_id": 0})
    results = []
    for doc in docs:
        coords = (doc.get("location") or {}).get("coordinates", [])
        results.append({
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
        })
    return results


def get_farmers_markets():
    return get_food_distributors(place_type="farmers_market")


def get_income_inequality():
    db = get_db()
    return list(db["income_inequality"].find({}, {"_id": 0})) if "income_inequality" in db.list_collection_names() else []
