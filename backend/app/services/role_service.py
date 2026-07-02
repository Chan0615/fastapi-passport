"""角色管理服务。角色按项目隔离。"""
from __future__ import annotations

from typing import List, Optional

from sqlalchemy.orm import Session, joinedload

from app.models.menu import Menu
from app.models.role import Role


def get_role_list(db: Session, project_id: Optional[int] = None) -> List[Role]:
    q = db.query(Role).options(joinedload(Role.menus))
    if project_id:
        q = q.filter(Role.project_id == project_id)
    return q.order_by(Role.id).all()


def get_role_by_id(db: Session, pk: int) -> Optional[Role]:
    return db.query(Role).options(joinedload(Role.menus)).filter(Role.id == pk).first()


def create_role(db: Session, data: dict) -> Role:
    obj = Role(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_role(db: Session, pk: int, data: dict) -> Optional[Role]:
    obj = get_role_by_id(db, pk)
    if not obj:
        return None
    for k, v in data.items():
        if v is not None:
            setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


def delete_role(db: Session, pk: int) -> bool:
    obj = get_role_by_id(db, pk)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True


def assign_menus_to_role(db: Session, role_id: int, menu_ids: List[int]) -> Optional[Role]:
    role = get_role_by_id(db, role_id)
    if not role:
        return None
    menus = db.query(Menu).filter(Menu.id.in_(menu_ids)).all()
    role.menus = menus
    db.commit()
    db.refresh(role)
    return role
