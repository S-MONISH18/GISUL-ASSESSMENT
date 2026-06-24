from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongodb_uri: str = "mongodb+srv://admin:admin123@cluster0.mongodb.net/?retryWrites=true&w=majority"
    jwt_secret: str = "super-secret-key-for-jwt-signing-change-in-prod"
    environment: str = "development"

    class Config:
        env_file = ".env"

settings = Settings()
