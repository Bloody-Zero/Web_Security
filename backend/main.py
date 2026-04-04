from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from backend.database import engine, Base
from backend.routers import auth, game, stats

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title="CyberShield Simulator",
    description="Интерактивный симулятор кибербезопасности",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(game.router)
app.include_router(stats.router)

app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "CyberShield Simulator"}