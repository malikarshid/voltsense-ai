from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

def normalize_database_url(url: str) -> str:
    """
    Normalizes database connection strings for asyncpg / aiosqlite.
    Translates standard postgres:// or postgresql:// to postgresql+asyncpg://
    """
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql://") and not url.startswith("postgresql+"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url

_normalized_url = normalize_database_url(settings.DATABASE_URL)

_engine_kwargs = {
    "echo": False,
    "future": True,
}

if "sqlite" in _normalized_url:
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Managed PostgreSQL asyncpg pool configuration for serverless & high concurrency
    _engine_kwargs.update({
        "pool_size": settings.DB_POOL_SIZE,
        "max_overflow": settings.DB_MAX_OVERFLOW,
        "pool_timeout": settings.DB_POOL_TIMEOUT,
        "pool_recycle": settings.DB_POOL_RECYCLE,
        "pool_pre_ping": True,
    })

engine = create_async_engine(_normalized_url, **_engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

class Base(DeclarativeBase):
    pass

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def init_db():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("[VoltSense Database] Tables created/verified.")
    except Exception as e:
        print(f"[VoltSense Database] Non-fatal notice during init_db: {e}")
