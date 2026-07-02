"""用户管理服务。用户为全局实体，通过角色关联到项目。"""
from __future__ import annotations

from typing import List, Optional

from sqlalchemy.orm import Session, joinedload

from app.core.security import hash_password
from app.models.role import Role
from app.models.user import User


def get_user_list(db: Session, keyword: str = "") -> List[User]:
    q = db.query(User).options(joinedload(User.roles))
    if keyword:
        q = q.filter(User.username.contains(keyword))
    return q.order_by(User.id).all()


def get_user_by_id(db: Session, pk: int) -> Optional[User]:
    return db.query(User).options(joinedload(User.roles)).filter(User.id == pk).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def get_user_permissions(db: Session, user: User, project_id: int) -> List[str]:
    """获取用户在指定项目下的按钮权限列表。"""
    if user.is_superuser:
        return ["*"]

    permissions = set()
    for role in user.roles:
        if not role.is_active:
            continue
        if role.project_id != project_id:
            continue
        for menu in role.menus:
            if menu.menu_type == "button" and menu.permission:
                permissions.add(menu.permission)
    return list(permissions)


def create_user(db: Session, data: dict) -> User:
    if "password" in data and data["password"]:
        data["hashed_password"] = hash_password(data.pop("password"))
    else:
        data.pop("password", None)
    obj = User(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_user(db: Session, pk: int, data: dict) -> Optional[User]:
    obj = get_user_by_id(db, pk)
    if not obj:
        return None
    if "password" in data:
        if data["password"]:
            data["hashed_password"] = hash_password(data.pop("password"))
        else:
            data.pop("password")
    for k, v in data.items():
        if v is not None:
            setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


def delete_user(db: Session, pk: int) -> bool:
    obj = get_user_by_id(db, pk)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True


def assign_roles_to_user(db: Session, user_id: int, role_ids: List[int]) -> Optional[User]:
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    roles = db.query(Role).filter(Role.id.in_(role_ids)).all()
    user.roles = roles
    db.commit()
    db.refresh(user)
    return user
