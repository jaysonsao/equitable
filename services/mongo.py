import os
from pymongo import MongoClient

_client = None
_db = None


def get_db():
    global _client, _db
    if _db is None:
        uri = os.environ.get("MONGO_URI", "")
        if not uri:
            raise RuntimeError("MONGO_URI not set")
        _client = MongoClient(uri)
        _db = _client["equitable"]
    return _db


def get_farmers_markets():
    db = get_db()
    return list(db["farmers_markets"].find({}, {"_id": 0}))


def get_income_inequality():
    db = get_db()
    return list(db["income_inequality"].find({}, {"_id": 0}))
