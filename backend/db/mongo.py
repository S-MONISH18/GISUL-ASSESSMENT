from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

db_config = MongoDB()

async def connect_to_mongo():
    db_config.client = AsyncIOMotorClient(settings.mongodb_uri)
    db_config.db = db_config.client["flashmind_db"]
    print("Connected to MongoDB.")

async def close_mongo_connection():
    if db_config.client:
        db_config.client.close()
        print("Closed MongoDB connection.")

def get_database():
    return db_config.db
