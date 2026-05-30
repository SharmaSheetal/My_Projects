import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes import router

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
log = logging.getLogger(__name__)

app = FastAPI(title="Cold Case Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def health_check():
    log.info("Base health check hit")
    return {"status": "Cold Case backend is live"}