"""认证接口。

核心登录流程：
1. 业务系统调用 POST /auth/login 传入 {username, password, project_code}
2. passport 通过 LDAP 验证用户身份
3. 签发包含 project_code 的 JWT 令牌
4. 返回 token + 用户信息 + 该项目的菜单树 + 按钮权限列表
5. 业务系统使用共享的 secret_key 本地验证 JWT，无需每次请求都调 passport
"""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.common.database import get_db
from app.common.deps import get_current_user
from app.common.ldap_api import ldap_verify
from app.config import bootstrap_config
from app.core.security import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, decode_access_token

security_scheme = HTTPBearer(auto_error=False)
from app.models.project import Project
from app.models.user import User
from app.services.menu_service import get_user_menus
from app.services.project_service import get_project_by_code
from app.services.user_service import (
    get_user_by_username,
    get_user_permissions,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


# ────── 请求/响应模型 ──────

class LoginRequest(BaseModel):
    username: str
    password: str
    project_code: str


class UserInfo(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    display_name: str = ""
    is_superuser: bool = False

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserInfo
    project_code: str
    menus: list[dict] = []
    permissions: list[str] = []


class VerifyRequest(BaseModel):
    token: str


class VerifyResponse(BaseModel):
    valid: bool
    user: Optional[UserInfo] = None
    project_code: str = ""


# ────── 辅助函数 ──────

def _extract_ldap_field(data: dict, field: str, fallback: str = "") -> str:
    """从 LDAP 返回中提取字段（可能是 list 或 str）。"""
    val = data.get(field)
    if isinstance(val, list):
        return val[0] if val else fallback
    return val or fallback


# ────── 接口 ──────

@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """统一登录接口：LDAP 认证 + 签发 JWT + 返回项目菜单与权限。"""
    # 1. 校验项目
    project = get_project_by_code(db, payload.project_code)
    if not project or project.status != "active":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="项目不存在或已停用")

    # 2. LDAP 认证
    ldap_result = await ldap_verify(payload.username, payload.password)
    if ldap_result is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="LDAP 服务不可用")
    if not ldap_result.get("success", False):
        ldap_msg = ldap_result.get("msg") or "用户名或密码错误"
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"LDAP 认证失败: {ldap_msg}")

    ldap_username = _extract_ldap_field(ldap_result, "username", payload.username)
    ldap_mail = _extract_ldap_field(ldap_result, "mail")

    # 3. 获取或创建全局用户
    user = get_user_by_username(db, ldap_username)
    if not user:
        # 系统第一个用户自动成为超级管理员
        user_count = db.query(User).count()
        is_first_user = user_count == 0

        user = User(
            username=ldap_username,
            email=ldap_mail or None,
            display_name=ldap_username,
            hashed_password="",
            is_active=True,
            is_superuser=is_first_user,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        if is_first_user:
            logger.info("LDAP 新用户自动创建（首个用户，已设为超级管理员）: %s", user.username)
        else:
            logger.info("LDAP 新用户自动创建: %s", user.username)
    else:
        if ldap_mail and user.email != ldap_mail:
            user.email = ldap_mail
        db.commit()
        db.refresh(user)

    # 4. 签发 JWT（含 project_code）
    access_token = create_access_token(user.id, user.username, payload.project_code)
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        domain=bootstrap_config.security.cookie_domain,
        httponly=True,
        secure=False,
        samesite="lax",
    )

    # 5. 获取该项目的菜单和权限
    menus = get_user_menus(db, user, project.id)
    permissions = get_user_permissions(db, user, project.id)

    return LoginResponse(
        access_token=access_token,
        user=UserInfo(
            id=user.id,
            username=user.username,
            email=user.email,
            display_name=user.display_name or user.username,
            is_superuser=user.is_superuser,
        ),
        project_code=payload.project_code,
        menus=menus,
        permissions=permissions,
    )


@router.post("/verify", response_model=VerifyResponse)
def verify_token(payload: VerifyRequest, db: Session = Depends(get_db)):
    """令牌验证接口（供业务系统在无法本地验证时调用）。

    业务系统通常使用共享的 secret_key 本地验证 JWT，无需调用此接口。
    此接口作为备用方案，或用于需要获取最新用户信息的场景。
    """
    token_data = decode_access_token(payload.token)
    if not token_data:
        return VerifyResponse(valid=False)

    user = db.query(User).filter(User.id == int(token_data.sub)).first()
    if not user or not user.is_active:
        return VerifyResponse(valid=False)

    return VerifyResponse(
        valid=True,
        user=UserInfo(
            id=user.id,
            username=user.username,
            email=user.email,
            display_name=user.display_name or user.username,
            is_superuser=user.is_superuser,
        ),
        project_code=token_data.project_code,
    )


@router.get("/me", response_model=UserInfo)
def get_me(current_user: User = Depends(get_current_user)):
    return UserInfo(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        display_name=current_user.display_name or current_user.username,
        is_superuser=current_user.is_superuser,
    )


@router.get("/menus")
def get_my_menus(
    project_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取当前用户在指定项目下的菜单树。"""
    project = get_project_by_code(db, project_code)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    return get_user_menus(db, current_user, project.id)


@router.get("/permissions")
def get_my_permissions(
    project_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取当前用户在指定项目下的按钮权限列表。"""
    project = get_project_by_code(db, project_code)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    return {"permissions": get_user_permissions(db, current_user, project.id)}


@router.post("/logout")
async def logout(
    response: Response,
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
):
    """退出登录：删除 Cookie，记录操作日志。
    尝试从 token 中解析用户信息，即使 token 过期也能拿到用户名用于日志记录。
    """
    # 解析用户信息（容忍过期 token）
    token = None
    if credentials:
        token = credentials.credentials
    if not token:
        token = request.cookies.get("access_token")

    username = None
    if token:
        payload = decode_access_token(token, verify_exp=False)
        if payload:
            user = db.query(User).filter(User.id == int(payload.sub)).first()
            if user:
                username = user.username

    response.delete_cookie(key="access_token", domain=bootstrap_config.security.cookie_domain)
    logger.info("用户 %s 退出登录", username or "未知")
    return {"msg": "已退出登录"}
