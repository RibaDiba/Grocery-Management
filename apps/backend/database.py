from pymongo import MongoClient
from config import config
import warnings
try:
    import certifi
    _TLS_KW = {"tls": True, "tlsCAFile": certifi.where()}
except Exception:
    certifi = None
    _TLS_KW = {}

try:
    client = MongoClient(config.MONGO_URI, **_TLS_KW)
except Exception as e:
    # Fall back without explicit CA file; log a warning so issues aren't silent
    warnings.warn(f"MongoClient init with TLS bundle failed: {e}; retrying without explicit CA file")
    client = MongoClient(config.MONGO_URI)
db = client.get_database(config.MONGO_DB_NAME)

def get_user_collection():
    return db.get_collection("users")

def get_db():
    return db

def get_receipts_collection():
    return db.get_collection("receipts")

def get_groceries_collection():
    return db.get_collection("groceries")

def get_recipes_collection():
    return db.get_collection("recipes")
