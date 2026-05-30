"""
Cold Case — Configuration
==========================
Central settings class. All environment variables are read here and nowhere else.
Import the `settings` singleton in any script that needs credentials or app config.

Usage:
    from config import settings

    driver = GraphDatabase.driver(settings.neo4j_uri, auth=settings.neo4j_auth)

Environment variables (set in .env or shell):
    NEO4J_URI        neo4j+s://xxxx.databases.neo4j.io
    NEO4J_USER       neo4j  (default)
    NEO4J_PASSWORD   your AuraDB password
    APP_ENV          development | production  (default: development)
    LOG_LEVEL        DEBUG | INFO | WARNING | ERROR  (default: INFO)


"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, computed_field


class Settings(BaseSettings):
    """
    All configuration for the Cold Case graph population pipeline.
    Values are loaded from environment variables (case-insensitive).
    A .env file in the project root is also read automatically.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # -------------------------------------------------------------------------
    # Neo4j connection
    # -------------------------------------------------------------------------
    neo4j_uri: str = Field(
        ...,
        description="Full Neo4j connection URI. e.g. neo4j+s://xxxx.databases.neo4j.io",
    )
    neo4j_user: str = Field(
        default="neo4j",
        description="Neo4j username.",
    )
    neo4j_password: str = Field(
        ...,
        description="Neo4j password.",
    )

    # -------------------------------------------------------------------------
    # App
    # -------------------------------------------------------------------------
    app_env: str = Field(
        default="development",
        description="Runtime environment. One of: development, production.",
    )
    log_level: str = Field(
        default="INFO",
        description="Logging level. One of: DEBUG, INFO, WARNING, ERROR.",
    )
    gemini_api_key: str = Field(
        ...,
        description="Gemini API key.",
    )
    gemini_api_key_2: str = Field(
        default="",
        description="Fallback Gemini API key 2"
    )
    gemini_api_key_3: str = Field(
        default="",
        description="Fallback Gemini API key 3"
    )

    @computed_field
    @property
    def gemini_api_keys(self) -> list[str]:
        """Provides a list of all provided Gemini keys for rotating fallback logic."""
        keys = [self.gemini_api_key, self.gemini_api_key_2, self.gemini_api_key_3]
        return [k for k in keys if k]

    # -------------------------------------------------------------------------
    # Computed helpers — use these in scripts instead of building tuples manually
    # -------------------------------------------------------------------------
    @computed_field
    @property
    def neo4j_auth(self) -> tuple[str, str]:
        """Ready-to-use auth tuple for GraphDatabase.driver(auth=settings.neo4j_auth)."""
        return (self.neo4j_user, self.neo4j_password)

    @computed_field
    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"

    

# ---------------------------------------------------------------------------
# Singleton — import this object everywhere, never instantiate Settings again.
# ---------------------------------------------------------------------------
settings = Settings()