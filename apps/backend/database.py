from pymongo import MongoClient
from config import config

client = MongoClient(config.MONGO_URI)
db = client.get_database(config.MONGO_DB_NAME)

def get_user_collection():
    return db.get_collection("users")

def get_groceries_collection():
    return db.get_collection("groceries")
