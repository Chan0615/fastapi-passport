"""V1 API 路由聚合。"""
from fastapi import APIRouter

from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.public import router as public_router
from app.api.v1.endpoints.project import router as project_router
from app.api.v1.endpoints.user import router as user_router
from app.api.v1.endpoints.role import router as role_router
from app.api.v1.endpoints.menu import router as menu_router
from app.api.v1.endpoints.token import router as token_router
from app.api.v1.endpoints.operation_log import router as log_router

api_router = APIRouter()
api_router.include_router(public_router)       # 公开接口（无需认证）
api_router.include_router(auth_router)
api_router.include_router(project_router)
api_router.include_router(user_router)
api_router.include_router(role_router)
api_router.include_router(menu_router)
api_router.include_router(token_router)
api_router.include_router(log_router)
