"""FastAPI 应用入口。"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import bootstrap_config
from app.common.database import engine, Base
from app.common.log_middleware import OperationLogMiddleware
from app.api.v1.api import api_router
from app.first_init_sql import seed_initial_data

# 确保所有模型被加载，以便 Base.metadata.create_all 能创建全部表
from app.models.project import Project  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.role import Role  # noqa: F401
from app.models.menu import Menu  # noqa: F401
from app.models.token import LongTermToken  # noqa: F401
from app.models.operation_log import OperationLog  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_initial_data()
    yield


app = FastAPI(
    title=bootstrap_config.app.name,
    version=bootstrap_config.app.version,
    debug=bootstrap_config.app.debug,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=bootstrap_config.security.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(OperationLogMiddleware)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "version": bootstrap_config.app.version,
        "env": bootstrap_config.app_env,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8888, reload=True)
